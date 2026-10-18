import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tghjbfeadohczaaanlhe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaGpiZmVhZG9oY3phYWFubGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNjkzMzgsImV4cCI6MjEwNzc0NTMzOH0.4l3AoMe9R2IvipNuWwKlckwTYhmNfCaYGYqCvlY-dRw';

/**
 * Supabase client instance configured with dynamic environment variables
 * Supports autoRefreshToken and session persistence across browser reloads
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'labsetu_supabase_session'
  }
});

export default supabase;
