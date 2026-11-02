import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tghjbfeadohczaaanlhe.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaGpiZmVhZG9oY3phYWFubGhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjE2OTMzOCwiZXhwIjoyMTA3NzQ1MzM4fQ.Y8cn5RpQ1arU392mYkBirc1hzznA_CAytxCVJ9fTtoQ';

/**
 * Supabase client instance configured with full project privileges
 * Supports autoRefreshToken, database hydration across page reloads, and realtime subscriptions
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'labsetu_supabase_session'
  }
});

export default supabase;
