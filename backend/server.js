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

export function createApp({ pool = null, jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET, authContractVerified = false } = {}) {
  const app = express();
  const requireAuthority = createAuthorityMiddleware(jwtSecret, authContractVerified);

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'online', databaseConfigured: Boolean(pool) }));
  app.use('/api/business', createBusinessRouter({ pool, requireAuthority }));
  app.use('/api/billing', createBusinessRouter({ pool, requireAuthority }));
  app.use('/api/imaging', createImagingRouter({ pool, requireAuthority }));
  app.use('/api/outsource', createOutsourceRouter({ pool, requireAuthority }));
  app.use('/api/analytics', createAnalyticsRouter({ pool, requireAuthority }));

  app.use('/api', (_req, res) => res.status(404).json({ success: false, error: 'API route not found.' }));
  app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return res.status(400).json({ success: false, error: 'Request body must be valid JSON.' });
    }
    return res.status(500).json({ success: false, error: 'Unexpected server error.' });
  });
  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, options: '-c timezone=UTC' }) : null;
  const app = createApp({ pool });
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => console.log(`LabSetu backend APIs listening on port ${port}`));
}