import express from 'express';
import { randomUUID } from 'node:crypto';
import { createVerifiedSupabaseMiddleware } from './auth.js';

// Identifiers never originate from URL input beyond this explicit allowlist.
const KNOWN_TABLES = new Set([
  'patient_cases', 'test_results', 'reports', 'appointments', 'bills', 'profiles',
  'referral_business_records', 'active_billing_workflow', 'labsetu_support_tickets',
  'labsetu_privacy_settings', 'referral_doctors'
]);
const PATIENT_READABLE = new Set(['reports', 'appointments', 'bills', 'profiles', 'labsetu_support_tickets', 'labsetu_privacy_settings']);
const PATIENT_WRITABLE = new Set(['labsetu_support_tickets', 'labsetu_privacy_settings']);
const MANAGED_RECORDS = new Set(['patient_cases', 'test_results', 'reports', 'appointments', 'bills', 'profiles']);
const idValid = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function errorResponse(res, error) {
  const denied = error?.code === '42501' || error?.status === 403;
  return res.status(denied ? 403 : 503).json({ success: false, error: denied
    ? 'You do not have permission to access this resource.'
    : 'This database resource is unavailable. No operation was acknowledged as saved.' });
}

function scopeQuery(query, resource, user) {
  if (resource === 'labsetu_support_tickets' || resource === 'labsetu_privacy_settings') return query.eq('user_id', user.id);
  if (user.role === 'authority') return query.eq('center_id', user.labId);
  if (resource === 'profiles') return query.eq('id', user.id);
  const scoped = query.eq('patient_id', user.id);
  return resource === 'reports' ? scoped.in('status', ['approved', 'released']) : scoped;
}

function permittedStaff(req) {
  return req.authUser.role === 'authority' && typeof req.authUser.labId === 'string' && req.authUser.labId.length > 0;
}

export function createResourcesRouter(options = {}) {
  const router = express.Router();
  router.use(createVerifiedSupabaseMiddleware(options));
  router.use('/:resource', (req, res, next) => {
    const resource = req.params.resource;
    if (resource !== 'dashboard' && !KNOWN_TABLES.has(resource)) return res.status(404).json({ success: false, error: 'Unknown resource.' });
    if (req.authUser.role === 'authority' && !permittedStaff(req)) return res.status(403).json({ success: false, error: 'A verified laboratory scope is required.' });
    if (req.authUser.role !== 'authority' && !PATIENT_READABLE.has(resource)) return res.status(403).json({ success: false, error: 'This resource requires authorised laboratory staff.' });
    return next();
  });

  router.get('/:resource', async (req, res) => {
    const { resource } = req.params;
    try {
      if (resource === 'dashboard') {
        const [cases, bills] = await Promise.all([
          scopeQuery(req.supabase.from('patient_cases').select('*'), 'patient_cases', req.authUser).limit(100),
          scopeQuery(req.supabase.from('bills').select('*'), 'bills', req.authUser).limit(100)
        ]);
        if (cases.error || bills.error) return errorResponse(res, cases.error || bills.error);
        return res.json({ success: true, data: { cases: cases.data || [], bills: bills.data || [] }, _source: 'supabase' });
      }
      // Patients may see readiness metadata; medical values/files use the protected release workflow.
      const select = resource === 'reports' && req.authUser.role === 'citizen'
        ? 'id,patient_id,status,date,test_name,test_type' : '*';
      const result = await scopeQuery(req.supabase.from(resource).select(select), resource, req.authUser).limit(200);
      if (result.error) return errorResponse(res, result.error);
      const data = resource === 'labsetu_privacy_settings' ? result.data?.[0]?.settings || {} : result.data || [];
      return res.json({ success: true, data, _source: 'supabase' });
    } catch (error) { return errorResponse(res, error); }
  });

  const write = async (req, res) => {
    const { resource } = req.params;
    if (resource === 'dashboard' || MANAGED_RECORDS.has(resource)) return res.status(409).json({ success: false, error: 'Use the dedicated booking, clinical, billing, or profile workflow to change this record.' });
    if (!PATIENT_WRITABLE.has(resource) && !permittedStaff(req)) return res.status(403).json({ success: false, error: 'Staff access is required.' });
    let rows;
    if (resource === 'labsetu_privacy_settings') {
      const allowed = ['smsAlerts', 'whatsappAlerts', 'shareWithTreatingDoctor', 'anonymousResearchConsent'];
      if (!isObject(req.body) || Object.entries(req.body).some(([key, value]) => !allowed.includes(key) || typeof value !== 'boolean')) {
        return res.status(400).json({ success: false, error: 'Only boolean notification and consent preferences can be saved here. Doctor access needs a verified permission workflow.' });
      }
      rows = [{ id: req.authUser.id, user_id: req.authUser.id, settings: req.body, updated_at: new Date().toISOString() }];
    } else {
      const input = Array.isArray(req.body) ? req.body : [req.body];
      if (!input.length || input.length > 25 || input.some((row) => !isObject(row))) return res.status(400).json({ success: false, error: 'Provide between 1 and 25 valid records.' });
      if (resource === 'labsetu_support_tickets') {
        if (input.some((row) => (row.id !== undefined && !idValid(row.id)) || typeof row.subject !== 'string' || !row.subject.trim() || row.subject.length > 300
          || (row.category !== undefined && (typeof row.category !== 'string' || row.category.length > 100))
          || (row.description !== undefined && (typeof row.description !== 'string' || row.description.length > 4000)))) {
          return res.status(400).json({ success: false, error: 'Support tickets require a valid subject and bounded description.' });
        }
        rows = input.map((row) => ({ id: row.id || 'TKT-' + randomUUID(), user_id: req.authUser.id, category: row.category || 'General',
          subject: row.subject.trim(), description: row.description || '', status: 'open' }));
      } else {
        if (input.some((row) => !idValid(row.id))) return res.status(400).json({ success: false, error: 'Each record requires a valid identifier.' });
        rows = input.map((row) => ({ ...row, center_id: req.authUser.labId }));
      }
    }
    try {
      const result = await req.supabase.from(resource).upsert(rows, { onConflict: 'id' }).select();
      if (result.error) return errorResponse(res, result.error);
      if (!Array.isArray(result.data) || !result.data.length) return res.status(409).json({ success: false, error: 'No authorised record was written.' });
      return res.json({ success: true, data: resource === 'labsetu_privacy_settings' ? result.data[0].settings : result.data, _source: 'supabase' });
    } catch (error) { return errorResponse(res, error); }
  };
  router.post('/:resource', write);
  router.put('/:resource', write);

  router.delete('/:resource', async (req, res) => {
    const { resource } = req.params;
    if (resource === 'dashboard' || MANAGED_RECORDS.has(resource)) return res.status(409).json({ success: false, error: 'Managed healthcare records cannot be deleted through generic resource sync.' });
    if (!PATIENT_WRITABLE.has(resource) && !permittedStaff(req)) return res.status(403).json({ success: false, error: 'Staff access is required.' });
    if (!idValid(req.query.id)) return res.status(400).json({ success: false, error: 'A single record id is required. Bulk deletion is not supported.' });
    try {
      const result = await scopeQuery(req.supabase.from(resource).delete().eq('id', req.query.id), resource, req.authUser).select('id');
      if (result.error) return errorResponse(res, result.error);
      if (!result.data?.length) return res.status(404).json({ success: false, error: 'No authorised record was deleted.' });
      return res.json({ success: true, data: result.data });
    } catch (error) { return errorResponse(res, error); }
  });
  return router;
}

export default createResourcesRouter();
