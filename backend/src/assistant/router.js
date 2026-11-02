import express from 'express';
import { assistantConfig, fault } from './config.js';
import { createPatientAuthentication } from './auth.js';
import { createFileStore, createPgStore } from './store.js';
import { createWorkflowService } from './workflow.js';
import { createPaymentService } from './payments.js';
import { createToolExecutor } from './tools.js';
import { createAgent } from './agent.js';
import { createPrescriptionService } from './prescriptions.js';
import { createReportService } from './reports.js';

const unavailableStore = { mode: 'unconfigured', read: async () => { throw fault(503, 'Database integration is not configured. Configure DATABASE_URL or explicit local DEMO_MODE.'); }, transaction: async () => { throw fault(503, 'Database integration is not configured.'); } };

export function createAssistantRouter({ pool = null, config = assistantConfig(), store: suppliedStore, fetchImpl, extract } = {}) {
  const router = express.Router();
  const store = suppliedStore || (config.demoMode ? createFileStore(config.dataFile) : pool ? createPgStore(pool) : unavailableStore);
  const workflow = createWorkflowService({ store, config: { ...config, paymentTiming: config.paymentStage === 'booking' ? 'at_booking' : 'after_report' } });
  const payments = createPaymentService({ store, workflow, config, fetchImpl });
  const authentication = createPatientAuthentication(config);
  const executor = createToolExecutor({ store, workflow, payments });
  const agent = createAgent({ store, executor, workflow, config, fetchImpl });
  const prescriptions = createPrescriptionService({ store, workflow, config, extract });
  const reports = createReportService({ store, workflow, config });
  const run = fn => async (req, res) => {
    try { const data = await fn(req, res); if (!res.headersSent) res.json({ success: true, data }); }
    catch (error) { if (!res.headersSent) res.status(error.status || 503).json({ success: false, error: error.status ? error.message : 'This service is temporarily unavailable. Please retry or contact the laboratory.', code: error.code || 'SERVICE_UNAVAILABLE' }); }
  };

  // Registered before JSON parsing: provider signatures cover exactly these original bytes.
  router.post('/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }), run(req => payments.webhook(req.body, req.get('x-razorpay-signature'), req.get('x-razorpay-event-id'))));
  router.use(express.json({ limit: '7mb' }));
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('X-Content-Type-Options', 'nosniff'); next(); });
  const buckets = new Map();
  function limited(limit, keyFn) {
    return (req, res, next) => {
      const key = keyFn(req);
      const time = Date.now();
      if (buckets.size > 10000) for (const [k,v] of buckets) if (v.until < time) buckets.delete(k);
      const bucket = buckets.get(key);
      if (!bucket || bucket.until < time) buckets.set(key, { count: 1, until: time + 60000 });
      else if (++bucket.count > limit) return res.status(429).json({ success: false, error: 'Too many requests. Please wait a minute.' });
      next();
    };
  }
  router.get('/config', (_req, res) => res.json({ success: true, data: { mode: config.aiProvider, storageMode: config.demoMode ? 'demo' : store.mode === 'postgresql' ? 'postgres' : 'unconfigured', paymentMode: config.paymentMode, paymentStage: config.paymentStage, demoAuth: Boolean(config.demoMode && config.jwtSecret?.length >= 32 && config.demoPassword?.length >= 12) } }));
  router.post('/demo-session', limited(10, req => `login:${req.ip}`), run(req => authentication.demoSession(req.body)));
  router.post('/public/chat', limited(12, req => `public-chat:${req.ip}`), run(req => agent.publicChat(req.body)));
  router.use(authentication.authenticate);
  router.use(limited(90, req => `actor:${req.actor.id}`));
  router.post('/chat', limited(12, req => `chat:${req.actor.id}`), run(req => agent.chat(req.actor, req.body)));
  router.post('/confirm', run(req => agent.confirm(req.actor, req.body)));
  router.get('/tests', run(req => workflow.searchTests(req.query.query || '')));
  router.get('/slots', run(req => workflow.availability(req.query.date)));
  router.get('/appointments', run(req => workflow.appointments(req.actor)));
  router.get('/notifications', run(req => workflow.notifications(req.actor)));
  router.get('/bookings/:id', run(async req => {
    const booking = await workflow.booking(req.actor, req.params.id);
    return req.actor.role === 'authority' ? { ...booking, report: await workflow.staffReport(req.actor, req.params.id) } : booking;
  }));
  function confirmed(body) { if (!body || typeof body !== 'object') throw fault(400, 'Send a valid action request.'); if (body.confirmed !== true) throw fault(409, 'Review the details and explicitly confirm this action.', 'CONFIRMATION_REQUIRED'); }
  router.post('/bookings', run(req => { confirmed(req.body); return workflow.book(req.actor, req.body); }));
  router.post('/bookings/:id/cancel', run(req => { confirmed(req.body); return workflow.cancel(req.actor, req.params.id); }));
  router.get('/bookings/:id/invoice', run(req => workflow.invoice(req.actor, req.params.id)));
  router.get('/bookings/:id/report.pdf', run(async (req, res) => {
    const buffer = await reports.getPdf(req.actor, req.params.id);
    res.type('application/pdf').set('Content-Disposition', 'inline; filename="LabSetu-approved-report.pdf"').send(buffer);
  }));
  router.get('/bookings/:id/receipt', run(req => payments.receipt(req.actor, req.params.id)));
  router.post('/prescriptions', limited(5, req => `ocr:${req.actor.id}`), run(req => prescriptions.upload(req.actor, req.body)));
  router.post('/payments/order', run(req => { confirmed(req.body); return payments.createOrder(req.actor, req.body.bookingId, req.body.idempotencyKey); }));
  router.post('/payments/verify', run(req => payments.verify(req.actor, req.body)));
  router.get('/bookings/:id/payment', run(req => payments.status(req.actor, req.params.id)));
  router.post('/payments/:id/simulate', run(req => { confirmed(req.body); return payments.simulate(req.actor, req.params.id, req.body.outcome); }));
  router.get('/staff/bookings', run(req => { if (req.actor.role !== 'authority') throw fault(403, 'Laboratory staff access is required.'); return workflow.appointments(req.actor); }));
  router.post('/staff/bookings/:id/transition', run(async req => {
    const booking = await workflow.staffTransition(req.actor, req.params.id, req.body);
    if (req.body.entity === 'report' && req.body.status === 'approved') await reports.getPdf(req.actor, req.params.id);
    return booking;
  }));
  router.use((error, _req, res, _next) => res.status(error.type === 'entity.too.large' ? 413 : 400).json({ success: false, error: error.type === 'entity.too.large' ? 'The uploaded request is too large.' : 'Request body must be valid JSON.' }));
  return router;
}
