import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { fault } from '../assistant/config.js';

// Stable model and SDK contracts verified against Google's official model/SDK docs.
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export function createGeminiService(config = {}, { client: suppliedClient } = {}) {
  let client = suppliedClient;
  const model = config.geminiModel || DEFAULT_GEMINI_MODEL;
  const timeout = Number.isFinite(config.geminiTimeoutMs) && config.geminiTimeoutMs > 0
    ? Math.min(config.geminiTimeoutMs, 30000) : 20000;

  async function generate({ instructions, contents, tools, maxOutputTokens = 700 }) {
    if (!config.geminiKey) throw fault(503, 'Gemini is not configured. Set GEMINI_API_KEY in the backend environment.', 'AI_UNAVAILABLE');
    if (typeof model !== 'string' || !/^[a-zA-Z0-9._-]{1,100}$/.test(model)) {
      throw fault(503, 'GEMINI_MODEL is invalid. Configure a supported Gemini model ID.', 'AI_CONFIGURATION');
    }
    const controller = new AbortController();
    let timer;
    try {
      client ||= new GoogleGenAI({ apiKey: config.geminiKey, httpOptions: { timeout, retryOptions: { attempts: 1 } } });
      const request = client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: instructions,
          maxOutputTokens,
          abortSignal: controller.signal,
          // The workflow plans short administrative steps; bound reasoning latency.
          ...(model.startsWith('gemini-3.') ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
          ...(tools?.length ? { tools } : {}),
        },
      });
      // Bound even an SDK transport that fails to honour abort/HTTP timeouts.
      return await Promise.race([
        request,
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(fault(504, 'Gemini timed out. Try again; workflow controls remain available.', 'AI_TIMEOUT'));
          }, timeout);
        }),
      ]);
    } catch (error) {
      if (error?.code === 'AI_TIMEOUT') throw error;
      const status = Number(error?.status || error?.statusCode);
      if (status === 429) throw fault(429, 'Gemini quota or rate limit was reached. Try again later.', 'AI_QUOTA');
      if (controller.signal.aborted || ['AbortError', 'TimeoutError'].includes(error?.name) || status === 408 || status === 504) {
        throw fault(504, 'Gemini timed out. Try again; workflow controls remain available.', 'AI_TIMEOUT');
      }
      if ([400, 401, 403, 404].includes(status)) {
        throw fault(503, 'Gemini rejected the backend configuration. Check the API key, model access and provider settings.', 'AI_CONFIGURATION');
      }
      // SDK errors can contain the URL, request data or credentials. Never expose them.
      throw fault(502, 'Gemini is temporarily unavailable. Try again; workflow controls remain available.', 'AI_PROVIDER_ERROR');
    } finally {
      clearTimeout(timer);
    }
  }

  return { generate, model };
}
