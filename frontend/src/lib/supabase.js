import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tghjbfeadohczaaanlhe.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaGpiZmVhZG9oY3phYWFubGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNjkzMzgsImV4cCI6MjEwNzc0NTMzOH0.4l3AoMe9R2IvipNuWwKlckwTYhmNfCaYGYqCvlY-dRw';

/**
 * Centralized Supabase API Error Interceptor
 * Intercepts every outgoing Supabase PostgREST & Auth fetch call.
 * If any non-2xx status code is returned (e.g. 400 Bad Request, 404, 500), it logs a
 * structured [DB_QUERY_ERROR] with exact target URL, HTTP status, headers, and parsed server body.
 */
const interceptedFetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : (input?.url || String(input));
  const method = init?.method || 'GET';
  const startTime = Date.now();

  try {
    const response = await fetch(input, init);
    const duration = `${Date.now() - startTime}ms`;

    if (!response.ok) {
      // Clone response stream so PostgREST client can still consume it without error
      const cloned = response.clone();
      let errorPayload = null;
      try {
        errorPayload = await cloned.json();
      } catch {
        try {
          errorPayload = await cloned.text();
        } catch {
          errorPayload = 'Unparseable response body';
        }
      }

      // Extract safe request headers
      let headersObj = {};
      if (init?.headers) {
        try {
          headersObj = Object.fromEntries(new Headers(init.headers).entries());
          if (headersObj.apikey) headersObj.apikey = '***REDACTED***';
          if (headersObj.authorization) headersObj.authorization = headersObj.authorization.slice(0, 15) + '...';
        } catch {}
      }

      // Surface structured diagnostics with [DB_QUERY_ERROR] tag
      logger.db({
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        duration,
        headers: headersObj,
        error: errorPayload
      });
    }

    return response;
  } catch (networkError) {
    logger.db({
      url,
      method,
      status: 'FETCH_FAILED',
      statusText: networkError.message,
      error: networkError.stack
    });
    throw networkError;
  }
};

/**
 * Supabase client instance configured with full project privileges & centralized error interceptor
 * Supports autoRefreshToken, database hydration across page reloads, and realtime subscriptions
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'labsetu_supabase_session'
  },
  global: {
    fetch: interceptedFetch
  }
});

export default supabase;