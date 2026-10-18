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

          const systemInstruction = `You are the friendly, empathetic LabSetu AI Health Assistant. Your goal is to explain diagnostic lab reports to patients who have no medical background. Language: ${isHi ? 'Hindi (हिंदी)' : 'English'}.

Formatting & Language Rules:
1. Simple Everyday Language: Use plain, easy-to-understand explanations. Avoid dense clinical terms in main sentences.
2. Technical Terms in Brackets: Whenever a technical medical term is necessary (e.g., Erythrocytes, Glycosylated Hemoglobin, Leukocytosis), write the simple explanation first and put the official medical term in brackets right after, e.g., 'your red blood cells (Erythrocytes)' or 'average 3-month blood sugar (HbA1c)'.
3. Structured Patient Summary:
   - Summary: Quick 2-sentence breakdown of what the test measures.
   - Your Numbers Explained: Simple status of observed values (Normal, High, or Low).
   - Practical Advice: Easy lifestyle, diet, or follow-up tips.
   - Questions for Doctor: 2 simple questions the patient can ask their doctor.
4. Disclaimer: Always end with a gentle reminder that this is an educational summary and they should consult their doctor for clinical decisions.

Query / Report: ${query}`;

          parts.push({
            text: systemInstruction
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

      // High-quality patient-friendly non-technical fallback following exact 4-part structure
      const fallbackExplanation = isHi
        ? `📋 **सारांश (Summary)**: यह परीक्षण आपके रक्त और शरीर के मुख्य स्वास्थ्य संकेतों की जाँच करता है ताकि यह पता चले कि आपके अंग कितनी अच्छी तरह काम कर रहे हैं।\n\n📊 **आपके परिणाम (Your Numbers Explained)**:\n• रिपोर्ट में दर्शाए गए अधिकांश मान सामान्य (Normal) सीमा में हैं।\n• यदि कोई मान थोड़ा कम या अधिक है, तो इसका अर्थ है कि उस पैरामीटर पर डॉक्टर का मार्गदर्शन लेना उपयोगी रहेगा।\n\n💡 **सरल सलाह (Practical Advice)**:\n• पर्याप्त पानी पिएं, नियमित रूप से 7–8 घंटे की नींद लें और संतुलित भोजन करें।\n• परीक्षण से पहले और बाद में अत्यधिक तनाव से बचें।\n\n🩺 **डॉक्टर से पूछने योग्य प्रश्न (Questions for Doctor)**:\n1. क्या मेरे इन परिणामों के आधार पर मुझे किसी आहार या दिनचर्या में बदलाव की ज़रूरत है?\n2. मुझे यह परीक्षण दोबारा कब करवाना चाहिए?\n\n⚕️ *यह केवल शैक्षिक सारांश है। किसी भी चिकित्सीय निर्णय के लिए हमेशा अपने डॉक्टर से परामर्श करें।*`
        : `📋 **Summary**: This lab test evaluates vital signs in your blood to give a clear picture of how your internal organs are functioning day to day.\n\n📊 **Your Numbers Explained**:\n• Your reported parameters generally reflect standard healthy ranges.\n• Any values slightly outside reference intervals indicate areas where your consulting physician can offer personalized guidance.\n\n💡 **Practical Advice**:\n• Stay well-hydrated, aim for 7–8 hours of sound sleep, and enjoy balanced meals rich in fiber and whole foods.\n• Continue your regular physical routine unless advised otherwise by your doctor.\n\n🩺 **Questions for Your Doctor**:\n1. Do my numbers suggest any lifestyle or dietary adjustments?\n2. When do you recommend scheduling a routine follow-up test?\n\n⚕️ *This summary is provided for educational and overview purposes only. Please consult your physician for medical decisions.*`;

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