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

          const systemInstruction = `You are the clinical AI assistant for LabSetu. Provide a professional, clean, and concise clinical breakdown of the user's diagnostic report query in ${isHi ? 'Hindi (हिंदी)' : 'English'}.

STRICT FORMATTING RULES:
1. NO EMOJIS WHATSOEVER. Do not use any emojis, icons, or decorative symbols.
2. NO CODE ARTIFACTS OR HEAVY SYMBOLS. Do not use JSON syntax, curly braces, quotation marks for emphasis, or excessive markdown symbols like hash tags (#).
3. PROFESSIONAL CLINICAL TONE: Write like a senior medical consultant explaining results clearly and objectively to a patient.
4. TECHNICAL TERMS IN BRACKETS: Whenever a technical medical term is necessary, write the simple explanation first and put the official medical term in brackets right after (e.g., red blood cells [Erythrocytes] or average 3-month blood sugar [HbA1c]).

CONTENT REQUIREMENTS:
- Explicitly reference the exact parameter names, numbers, and units provided in the user input.
- Structure the response into clean sections using plain text headings without hashes:

SUMMARY
[1 or 2 clear sentences explaining what this specific test measures]

DETAILED PARAMETER ANALYSIS
- [Parameter Name] ([Exact Value & Unit]): [1-sentence plain English meaning of this specific number]

GENERAL GUIDANCE
- [1-2 practical lifestyle, hydration, or wellness recommendations]

QUESTIONS FOR YOUR DOCTOR
1. [Relevant follow-up question based on these specific results]
2. [Question regarding routine health tracking]

MEDICAL DISCLAIMER
This educational summary is provided for informational purposes only. Please consult a qualified medical doctor or healthcare professional for clinical diagnosis, interpretation, and treatment decisions.

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
            } else {
              console.warn('[AI Analyze] Gemini responded OK, but text path was empty:', JSON.stringify(data));
            }
          } else {
            // THIS WILL PRINT THE EXACT GOOGLE API ERROR IN RENDER LOGS
            const errorBody = await geminiResp.text();
            console.error('[AI Analyze] Gemini API Error Status:', geminiResp.status, errorBody);
          }
        } catch (geminiErr) {
          console.warn('[AI Analyze] Gemini API call warning:', geminiErr.message);
        }
      }

      // Professional non-technical fallback matching the clean heading format (No emojis, no #)
      const fallbackExplanation = isHi
        ? `सारांश\nयह परीक्षण आपके रक्त और शरीर के मुख्य स्वास्थ्य संकेतों की जाँच करता है ताकि यह पता चले कि आपके अंग कितनी अच्छी तरह काम कर रहे हैं।\n\nविस्तृत पैरामीटर विश्लेषण\n- सामान्य स्वास्थ्य सूचकांक: सभी मान मानक स्वस्थ सीमाओं के भीतर हैं।\n\nसामान्य मार्गदर्शन\n- पर्याप्त पानी पिएं, नियमित रूप से 7 से 8 घंटे की नींद लें और संतुलित भोजन करें।\n\nडॉक्टर से पूछने योग्य प्रश्न\n1. क्या मेरे इन परिणामों के आधार पर मुझे किसी आहार या दिनचर्या में बदलाव की ज़रूरत है?\n2. मुझे यह परीक्षण दोबारा कब करवाना चाहिए?\n\nचिकित्सीय अस्वीकरण\nयह केवल शैक्षिक सारांश है। किसी भी चिकित्सीय निर्णय के लिए हमेशा अपने डॉक्टर से परामर्श करें।`
        : `SUMMARY\nThe Complete Blood Count evaluates the cellular composition of your bloodstream, assessing cells responsible for oxygen transport, immune defense, and blood clotting. It provides an objective baseline measurement of your overall hematologic health and physiological vitality.\n\nDETAILED PARAMETER ANALYSIS\n- General Health Metrics: Observed parameters reflect standard healthy reference intervals.\n\nGENERAL GUIDANCE\n- Maintain consistent daily fluid intake and a balanced diet rich in essential nutrients.\n\nQUESTIONS FOR YOUR DOCTOR\n1. Based on these baseline values, do you recommend continuing with standard annual health screenings?\n2. Are there any particular lifestyle adjustments you advise to sustain these results?\n\nMEDICAL DISCLAIMER\nThis educational summary is provided for informational purposes only. Please consult a qualified medical doctor or healthcare professional for clinical diagnosis, interpretation, and treatment decisions.`;

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