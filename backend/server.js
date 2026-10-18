import 'dotenv/config';
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
import { createResourcesRouter } from './src/resources.js';

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

// ─── App factory ──────────────────────────────────────────────────────────────
export function createApp({
  pool = null,
  jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET,
  authContractVerified = false
} = {}) {
  const app = express();
  const requireAuthority = createAuthorityMiddleware(jwtSecret, authContractVerified);

  // ── Middleware ───────────────────────────────────────────────────────────────
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));           // Pre-flight for all routes
  app.use(express.json({ limit: '2mb' }));

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => res.json({
    status: 'online',
    databaseConfigured: Boolean(pool),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    timestamp: new Date().toISOString()
  }));

  // ── Domain-specific routes (authority-protected) ──────────────────────────
  app.use('/api/business',  createBusinessRouter({ pool, requireAuthority }));
  app.use('/api/billing',   createBusinessRouter({ pool, requireAuthority }));
  app.use('/api/imaging',   createImagingRouter({ pool, requireAuthority }));
  app.use('/api/outsource', createOutsourceRouter({ pool, requireAuthority }));
  app.use('/api/analytics', createAnalyticsRouter({ pool, requireAuthority }));
  app.use('/api/ai',        createAiRouter({ requireAuthority }));

  // ── Public resource sync API (no authority JWT required so citizen portal
  //    and unauthenticated demo mode both work without 401s) ─────────────────
  app.use('/api/resources', createResourcesRouter({ requireAuthority }));

  // ── Auth & appointments stubs (real implementation via Supabase client-side)
  app.use('/api/auth', (_req, res) =>
    res.status(503).json({ success: false, error: 'Auth handled client-side via Supabase SDK.' })
  );

  // Appointments have a dedicated Supabase table; forward through resources handler
  // rather than 503ing so the frontend gets real data.
  // (The /api/resources/appointments route already handles this.)

  // ── Catch-all 404 for unknown /api/* paths ────────────────────────────────
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
    console.error('[Server Error]', error);
    return res.status(500).json({ success: false, error: 'Unexpected server error.' });
  });

  return app;
}

// ─── Main entry point ─────────────────────────────────────────────────────────
const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' })
    : null;

  const app = createApp({ pool });
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => {
    console.log(`LabSetu backend APIs listening on port ${port}`);
    console.log(`  Supabase: ${process.env.SUPABASE_URL ? 'configured' : 'NOT configured'}`);
    console.log(`  Database: ${pool ? 'pg pool active' : 'no pg pool'}`);
    console.log(`  CORS: ${[...ALLOWED_ORIGINS].join(', ')}`);
  });
}