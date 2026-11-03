import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = fileURLToPath(new URL('../../', import.meta.url));

export function assistantConfig(env = process.env) {
  const demoMode = env.DEMO_MODE === 'true';
  return {
    demoMode,
    aiProvider: env.AI_PROVIDER || (demoMode ? 'demo' : 'gemini'),
    geminiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL || 'gemini-3.8-flash',
    geminiTimeoutMs: 20000,
    openaiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL,
    jwtSecret: env.DEMO_JWT_SECRET,
    demoPassword: env.DEMO_PASSWORD,
    dataFile: path.resolve(backendDirectory, env.ASSISTANT_DATA_FILE || './data/assistant-demo.json'),
    uploadDir: path.resolve(backendDirectory, env.ASSISTANT_UPLOAD_DIR || './data/prescriptions'),
    paymentMode: env.PAYMENT_MODE || 'disabled',
    paymentStage: env.PAYMENT_STAGE || 'report_ready',
    requirePaymentForReport: env.REQUIRE_PAYMENT_FOR_REPORT !== 'false',
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
    razorpayWebhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    supabaseUrl: env.SUPABASE_URL,
    supabaseKey: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
    ocrLanguage: env.OCR_LANGUAGE || 'eng',
    ocrDataPath: env.OCR_DATA_PATH ? path.resolve(backendDirectory, env.OCR_DATA_PATH) : undefined,
  };
}

export const demoLabId = '00000000-0000-4000-8000-000000000010';
export const demoCitizenId = '00000000-0000-4000-8000-000000000001';
export const demoAuthorityId = '00000000-0000-4000-8000-000000000003';

export function fault(status, message, code = 'INVALID_REQUEST') {
  return Object.assign(new Error(message), { status, code });
}
