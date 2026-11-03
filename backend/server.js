import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from 'pg';
import { createAnalyticsRouter } from './src/analytics.js';
import { createAuthorityMiddleware } from './src/auth.js';
import { createBusinessRouter } from './src/business.js';
import { createImagingRouter, createOutsourceRouter } from './src/imaging.js';
import { createAiRouter } from './src/aiSimulationEngine.js';
import resourcesRouter from './src/routes/resources.js';
import authRouter from './src/routes/auth.js';
import { createAssistantRouter } from './src/assistant/router.js';
import { assistantConfig } from './src/assistant/config.js';
import { createPatientAuthentication } from './src/assistant/auth.js';
import { createClinovaRouter } from './src/ai/clinova.js';

// Resolve from this server entry point, including when launched from the repository root.
// Deployment environment variables retain precedence; no environment file is changed.
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

// ─── Multi-origin CORS helper ─────────────────────────────────────────────────
// Accepts requests from both the local dev server and any configured production
// Vercel / custom domain. Add additional origins via the CLIENT_ORIGIN env var
// (comma-separated).

const ALLOWED_ORIGINS = (() => {
  const origins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    // Live Vercel deployments
    'https://lab-setu.vercel.app',
    'https://labsetu.vercel.app',
  ]);

  // Allow any additional origins supplied via the environment (comma-separated)
  const envOrigins = process.env.CLIENT_ORIGIN || '';
  envOrigins.split(',').map(o => o.trim()).filter(Boolean).forEach(o => origins.add(o));

  return origins;
})();

const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server / Postman requests (no Origin header)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    // Allow any *.vercel.app preview deployment URLs automatically
    if (/^https:\/\/[a-z0-9-]+-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/.test(origin)) return callback(null, true);
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

const ASSISTANT_SCHEMA_LAYOUTS = {
  assistant: [
    ['assistant_tests', 'id', 'text'], ['assistant_tests', 'lab_id', 'text'], ['assistant_tests', 'price_paise', 'bigint'], ['assistant_tests', 'assistant_data', 'jsonb'],
    ['assistant_slots', 'id', 'text'], ['assistant_slots', 'lab_id', 'text'], ['assistant_slots', 'starts_at', 'timestamp with time zone'], ['assistant_slots', 'capacity', 'integer'], ['assistant_slots', 'assistant_data', 'jsonb'],
    ['appointments', 'id', 'text'], ['appointments', 'assistant_data', 'jsonb'], ['appointments', 'assistant_patient_key', 'text'], ['appointments', 'assistant_lab_id', 'text'], ['appointments', 'assistant_slot_id', 'text'], ['appointments', 'assistant_idempotency_key', 'text'],
    ['bills', 'id', 'text'], ['bills', 'assistant_data', 'jsonb'], ['bills', 'assistant_booking_id', 'text'], ['bills', 'assistant_patient_key', 'text'],
    ['reports', 'id', 'text'], ['reports', 'assistant_data', 'jsonb'], ['reports', 'assistant_booking_id', 'text'], ['reports', 'assistant_patient_key', 'text'], ['reports', 'assistant_approved_by', 'text'],
    ['assistant_samples', 'booking_id', 'text'], ['assistant_samples', 'status', 'text'], ['assistant_samples', 'assistant_data', 'jsonb'],
    ['assistant_payments', 'id', 'text'], ['assistant_payments', 'invoice_id', 'text'], ['assistant_payments', 'order_id', 'text'], ['assistant_payments', 'status', 'text'], ['assistant_payments', 'assistant_data', 'jsonb'],
    ['assistant_receipts', 'id', 'text'], ['assistant_receipts', 'invoice_id', 'text'], ['assistant_receipts', 'payment_id', 'text'], ['assistant_receipts', 'assistant_data', 'jsonb'],
    ['assistant_records', 'collection', 'text'], ['assistant_records', 'id', 'text'], ['assistant_records', 'payload', 'jsonb']
  ],
  deployed: [
    ['assistant_tests', 'id', 'uuid'], ['assistant_tests', 'center_id', 'uuid'], ['assistant_tests', 'test_name', 'text'], ['assistant_tests', 'price', 'numeric'], ['assistant_tests', 'assistant_data', 'jsonb'],
    ['assistant_slots', 'id', 'uuid'], ['assistant_slots', 'center_id', 'uuid'], ['assistant_slots', 'slot_time', 'text'], ['assistant_slots', 'max_capacity', 'integer'], ['assistant_slots', 'current_bookings', 'integer'], ['assistant_slots', 'is_active', 'boolean'], ['assistant_slots', 'assistant_data', 'jsonb'],
    ['appointments', 'id', 'uuid'], ['appointments', 'center_id', 'uuid'], ['appointments', 'patient_id', 'uuid'], ['appointments', 'department', 'text'], ['appointments', 'appointment_date', 'date'], ['appointments', 'slot_start', 'time without time zone'], ['appointments', 'slot_end', 'time without time zone'], ['appointments', 'visit_type', 'USER-DEFINED'], ['appointments', 'booking_source', 'text'], ['appointments', 'status', 'USER-DEFINED'], ['appointments', 'assistant_data', 'jsonb'],
    ['patient_cases', 'id', 'uuid'], ['patient_cases', 'center_id', 'uuid'], ['patient_cases', 'patient_id', 'uuid'], ['patient_cases', 'case_no', 'text'], ['patient_cases', 'appointment_id', 'uuid'], ['patient_cases', 'case_status', 'USER-DEFINED'], ['patient_cases', 'priority', 'text'],
    ['bills', 'id', 'uuid'], ['bills', 'center_id', 'uuid'], ['bills', 'case_id', 'uuid'], ['bills', 'bill_no', 'text'], ['bills', 'subtotal', 'numeric'], ['bills', 'discount_amount', 'numeric'], ['bills', 'tax_amount', 'numeric'], ['bills', 'total_amount', 'numeric'], ['bills', 'paid_amount', 'numeric'], ['bills', 'due_amount', 'numeric'], ['bills', 'payment_status', 'USER-DEFINED'], ['bills', 'assistant_data', 'jsonb'],
    ['assistant_samples', 'id', 'uuid'], ['assistant_samples', 'appointment_id', 'uuid'], ['assistant_samples', 'patient_id', 'uuid'], ['assistant_samples', 'sample_type', 'text'], ['assistant_samples', 'collection_status', 'text'], ['assistant_samples', 'assistant_data', 'jsonb'],
    ['reports', 'id', 'uuid'], ['reports', 'center_id', 'uuid'], ['reports', 'case_id', 'uuid'], ['reports', 'report_no', 'text'], ['reports', 'status', 'USER-DEFINED'], ['reports', 'title', 'text'], ['reports', 'report_json', 'jsonb'], ['reports', 'disclaimer', 'text'], ['reports', 'assistant_data', 'jsonb'],
    ['assistant_payments', 'id', 'uuid'], ['assistant_payments', 'bill_id', 'uuid'], ['assistant_payments', 'patient_id', 'uuid'], ['assistant_payments', 'amount', 'numeric'], ['assistant_payments', 'status', 'text'], ['assistant_payments', 'assistant_data', 'jsonb'],
    ['assistant_receipts', 'id', 'uuid'], ['assistant_receipts', 'payment_id', 'uuid'], ['assistant_receipts', 'receipt_number', 'text'], ['assistant_receipts', 'assistant_data', 'jsonb'],
    ['assistant_records', 'id', 'uuid'], ['assistant_records', 'record_type', 'text'], ['assistant_records', 'payload', 'jsonb'], ['assistant_records', 'assistant_data', 'jsonb']
  ]
};

function assistantSchemaReadinessQuery() {
  const required = Object.entries(ASSISTANT_SCHEMA_LAYOUTS).flatMap(([layout, columns]) =>
    columns.map(([table, column, type]) => `('${layout}','${table}','${column}','${type}')`)).join(',');
  return `WITH required(layout,table_name,column_name,data_type) AS (VALUES ${required})
    SELECT COALESCE(bool_or(layout_ready),false) AS schema_ready FROM (
      SELECT layout,bool_and(EXISTS (
        SELECT 1 FROM information_schema.columns actual
        WHERE actual.table_schema='public' AND actual.table_name=required.table_name
          AND actual.column_name=required.column_name AND actual.data_type=required.data_type
      )) AS layout_ready FROM required GROUP BY layout
    ) layouts`;
}

// ─── App factory ──────────────────────────────────────────────────────────────
export function createApp({
  pool = null,
  jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET,
  authContractVerified = false,
  assistantOptions = {},
  clinovaOptions = {}
} = {}) {
  const app = express();
  const requireAuthority = createAuthorityMiddleware(jwtSecret, authContractVerified);

  // ── Middleware ───────────────────────────────────────────────────────────────
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));           // Pre-flight for all routes
  // Mount before JSON middleware so Razorpay signatures use the original webhook body.
  app.use('/api/assistant', createAssistantRouter({ pool, ...assistantOptions }));
  app.use('/api/clinova', createClinovaRouter({ config: assistantConfig(), ...clinovaOptions }));
  app.use(express.json({ limit: '2mb' }));

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => res.json({
    status: 'online',
    databaseConfigured: Boolean(pool),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    authenticationConfigured: Boolean(assistantConfig().supabaseUrl && assistantConfig().supabaseKey),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    notice: 'Configuration flags do not verify connectivity. Use /api/ready for a database readiness check.',
    timestamp: new Date().toISOString()
  }));
  app.get('/api/ready', async (_req, res) => {
    if (!pool) return res.status(503).json({ success: false, database: 'unconfigured', error: 'Set DATABASE_URL in the backend environment. No database connection is available.' });
    let timer;
    try {
      const result = await Promise.race([
        pool.query(assistantSchemaReadinessQuery()),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('readiness timeout')), 5000); })
      ]);
      const ready = result.rows[0]?.schema_ready === true;
      return res.status(ready ? 200 : 503).json({ success: ready, database: 'connected', assistantSchema: ready ? 'present' : 'incompatible', ...(ready ? {} : { error: 'The assistant database schema is incomplete or incompatible. Ask the database owner to review the deployed schema before enabling assistant workflows.' }) });
    } catch {
      return res.status(503).json({ success: false, database: 'unavailable', error: 'The configured database could not be verified. Check network access, credentials and TLS settings.' });
    } finally { clearTimeout(timer); }
  });

  // ── Domain-specific routes (authority-protected) ──────────────────────────
  app.use('/api/business',  createBusinessRouter({ pool, requireAuthority }));
  app.use('/api/billing',   createBusinessRouter({ pool, requireAuthority }));
  app.use('/api/imaging',   createImagingRouter({ pool, requireAuthority }));
  app.use('/api/outsource', createOutsourceRouter({ pool, requireAuthority }));
  app.use('/api/analytics', createAnalyticsRouter({ pool, requireAuthority }));
  app.use('/api/ai',        createAiRouter({ requireAuthority }));

  // ── Public resource sync API (guaranteed 200 OK responses, no 404/503) ──
  app.use('/api/resources', resourcesRouter);

  // ── Protected & demo-ready auth router (wrapped in try/catch to eliminate 503 errors) ──
  app.use('/api/auth', authRouter);
// ── Free Xist-Style Patient AI Assistant Analysis Endpoint ────────────────
  app.post('/api/ai/analyze', createPatientAuthentication(assistantConfig()).authenticate, (_req, res) => {
    res.json({ success: true, data: {
      explanation: 'A reference interval is the range configured by the laboratory for a specific test and population. A flag means a result needs professional review; it does not establish a diagnosis. Open your approved report in the assistant and discuss your results with a qualified clinician.',
      source: 'educational-glossary',
      notice: 'Individual result interpretation and treatment recommendations require a qualified clinician.'
    } });
  });

  app.use('/api', (_req, res) =>
    res.status(404).json({ success: false, error: 'API route not found.' })
  );

  // ── Global error handler ─────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ success: false, error: 'Request body must be valid JSON.' });
    }
    if (error.message?.startsWith('CORS:')) {
      return res.status(403).json({ success: false, error: error.message });
    }
    console.error('[Server Error]', error.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unexpected server error.' });
  });

  return app;
}

// ─── Main entry point ─────────────────────────────────────────────────────────
const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC', connectionTimeoutMillis: 5000, statement_timeout: 15000 })
    : null;

  const app = createApp({ pool });
  const port = Number(process.env.PORT) || 5000;
  const host = process.env.HOST || (process.env.DEMO_MODE === 'true' ? '127.0.0.1' : null);
  const onListening = () => {
    console.log(`LabSetu backend APIs listening on port ${port}`);
    console.log(`  Supabase: ${process.env.SUPABASE_URL ? 'configured' : 'NOT configured'}`);
    console.log(`  Database: ${pool ? 'pg pool active' : 'no pg pool'}`);
    console.log(`  CORS: ${[...ALLOWED_ORIGINS].join(', ')}`);
  };
  if (host) app.listen(port, host, onListening);
  else app.listen(port, onListening);
}
