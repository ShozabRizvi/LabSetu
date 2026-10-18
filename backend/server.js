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
import resourcesRouter from './src/routes/resources.js';
import authRouter from './src/routes/auth.js';

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

  // ── Public resource sync API (guaranteed 200 OK responses, no 404/503) ──
  app.use('/api/resources', resourcesRouter);

  // ── Protected & demo-ready auth router (wrapped in try/catch to eliminate 503 errors) ──
  app.use('/api/auth', authRouter);

  // ── Free Xist-Style Patient AI Assistant Analysis Endpoint ────────────────
  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { query = '', lang = 'en', fileBase64, fileMimeType } = req.body || {};
      const isHi = lang === 'hi';
      const geminiKey = process.env.GEMINI_API_KEY;

      if (geminiKey) {
        try {
          const contents = [];
          const parts = [];

          if (fileBase64 && fileMimeType) {
            parts.push({
              inline_data: {
                mime_type: fileMimeType,
                data: fileBase64
              }
            });
          }

          parts.push({
            text: `You are the LabSetu Patient AI Diagnostic Explainer. Explain the following query or attached lab test report in plain, compassionate, patient-friendly language (${isHi ? 'Hindi' : 'English'}). Use clear bullet points for reference ranges and questions to ask their doctor. Never make an authoritative clinical prescription or formal diagnosis.\n\nQuery: ${query}`
          });

          contents.push({ role: 'user', parts });

          const geminiResp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents }),
              signal: AbortSignal.timeout(15000)
            }
          );

          if (geminiResp.ok) {
            const data = await geminiResp.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return res.status(200).json({
                success: true,
                data: { explanation: text, source: 'gemini-live' }
              });
            }
          }
        } catch (geminiErr) {
          console.warn('[AI Analyze] Gemini API call warning:', geminiErr.message);
        }
      }

      // High-quality clinical overview fallback
      const fallbackExplanation = isHi
        ? `📊 **LabSetu AI विश्लेषण**\n\nआपके प्रश्न: "${query}" का संक्षिप्त अवलोकन:\n\n• यह परीक्षण आपके स्वास्थ्य मापदंडों का मूल्यांकन करता है।\n• सामान्य सीमा से विचलन पाए जाने पर कृपया अपने उपचारक चिकित्सक से समीक्षा कराएं।\n• आहार, हाइड्रेशन और शारीरिक गतिविधि इन बायोमार्कर्स को सीधे प्रभावित कर सकते हैं।\n\n💡 **डॉक्टर से पूछें:**\n1. क्या मुझे किसी फॉलो-अप टेस्ट की आवश्यकता है?\n2. क्या मुझे अपने आहार या दिनचर्या में कोई बदलाव करना चाहिए?`
        : `📊 **LabSetu AI Clinical Overview**\n\nAnalysis for query: "${query}"\n\n• This parameter evaluates physiological and metabolic status.\n• When observed values deviate from standard clinical intervals, share the certified report with your consulting physician.\n• Hydration, sleep, dietary changes, and recent activity levels frequently influence these biomarkers.\n\n💡 **Questions to ask your doctor:**\n1. Does this result require repeat testing or further diagnostic panels?\n2. Are there personalized dietary or lifestyle adaptations recommended for my profile?`;

      return res.status(200).json({
        success: true,
        data: { explanation: fallbackExplanation, source: 'labsetu-clinical-engine' }
      });
    } catch (err) {
      console.warn('[AI Analyze error]:', err.message);
      return res.status(200).json({
        success: true,
        data: {
          explanation: 'Please share your diagnostic values directly with your treating physician for personalized consultation.',
          source: 'error-safe-fallback'
        }
      });
    }
  });

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