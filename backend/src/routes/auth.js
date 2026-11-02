import express from 'express';
import { createClient } from '@supabase/supabase-js';

const emailAddress = (value) => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPassword = (value) => typeof value === 'string' && value.length >= 8 && value.length <= 256;

// A fresh anon-key client prevents cross-request sessions and service-role RLS bypass.
export function createRequestSupabase({ token, config = process.env, createClientImpl = createClient } = {}) {
  const url = config.supabaseUrl || config.SUPABASE_URL || config.VITE_SUPABASE_URL;
  const anonKey = config.supabaseAnonKey || config.SUPABASE_ANON_KEY || config.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  try {
    if (anonKey.startsWith('sb_secret_')) return null;
    if (anonKey.split('.').length === 3 && JSON.parse(Buffer.from(anonKey.split('.')[1], 'base64url').toString()).role === 'service_role') return null;
    return createClientImpl(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        ...(token ? { headers: { Authorization: 'Bearer ' + token } } : {}),
        fetch: (input, init = {}) => fetch(input, { ...init, signal: init.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) })
      }
    });
  } catch { return null; }
}

export function publicAuthUser(user) {
  const privileged = ['authority', 'staff', 'admin'].includes(user.app_metadata?.role);
  const labId = user.app_metadata?.lab_id || user.app_metadata?.center_id;
  return {
    id: user.id, email: user.email || '', name: String(user.user_metadata?.full_name || 'Patient').slice(0, 200),
    role: privileged ? 'authority' : 'citizen',
    ...(privileged && typeof labId === 'string' && labId.trim() ? { labId: labId.trim() } : {})
  };
}

export function createVerifiedSupabaseMiddleware(options = {}) {
  return async (req, res, next) => {
    const authorization = req.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token || token.length > 8192) return res.status(401).json({ success: false, error: 'A valid bearer token is required.' });
    const client = createRequestSupabase({ ...options, token });
    if (!client) return res.status(503).json({ success: false, error: 'Supabase authentication is not configured.' });
    try {
      const { data, error } = await client.auth.getUser(token);
      if (error || !data?.user?.id) return res.status(401).json({ success: false, error: 'The bearer token is invalid or expired.' });
      req.supabase = client;
      req.authUser = publicAuthUser(data.user);
      req.authToken = token;
      return next();
    } catch {
      return res.status(503).json({ success: false, error: 'Authentication could not be verified. Please try again.' });
    }
  };
}

export function createAuthRouter(options = {}) {
  const router = express.Router();
  const verified = createVerifiedSupabaseMiddleware(options);
  const clientFor = (res) => {
    const client = createRequestSupabase(options);
    if (!client) res.status(503).json({ success: false, error: 'Supabase authentication is not configured.' });
    return client;
  };

  router.post('/login', async (req, res) => {
    const { identifier, password, role } = req.body || {};
    if (!emailAddress(identifier) || typeof password !== 'string' || !password || password.length > 256 || (role !== undefined && !['citizen', 'authority'].includes(role))) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address, password, and portal role.' });
    }
    const client = clientFor(res);
    if (!client) return;
    try {
      const { data, error } = await client.auth.signInWithPassword({ email: identifier.trim().toLowerCase(), password });
      if (error || !data?.user?.id || !data?.session?.access_token) return res.status(401).json({ success: false, error: 'Invalid login credentials.' });
      const user = publicAuthUser(data.user);
      if (role && role !== user.role) return res.status(403).json({ success: false, error: 'This account does not have access to the selected portal.' });
      return res.json({ success: true, user, token: data.session.access_token });
    } catch {
      return res.status(503).json({ success: false, error: 'Authentication is temporarily unavailable.' });
    }
  });

  router.post('/register', async (req, res) => {
    const { email, password, name, role } = req.body || {};
    if (role !== undefined && role !== 'citizen') return res.status(403).json({ success: false, error: 'Staff accounts must be provisioned by an authorised administrator.' });
    if (!emailAddress(email) || !validPassword(password) || typeof name !== 'string' || !name.trim() || name.length > 200) {
      return res.status(400).json({ success: false, error: 'Provide a name, valid email address, and password of 8–256 characters.' });
    }
    const client = clientFor(res);
    if (!client) return;
    try {
      const { data, error } = await client.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: name.trim() } } });
      if (error || !data?.user?.id) return res.status(400).json({ success: false, error: 'Registration could not be completed. Check your details or contact support.' });
      return res.status(201).json({ success: true, user: publicAuthUser(data.user),
        requiresEmailConfirmation: !data.session?.access_token,
        ...(data.session?.access_token ? { token: data.session.access_token } : {}),
        message: data.session?.access_token ? 'Patient account created.' : 'Check your email to complete account verification.' });
    } catch {
      return res.status(503).json({ success: false, error: 'Registration is temporarily unavailable.' });
    }
  });

  router.get('/me', verified, (req, res) => res.json({ success: true, user: req.authUser }));

  router.post('/logout', verified, async (req, res) => {
    try {
      const { error } = await req.supabase.auth.admin.signOut(req.authToken, 'local');
      if (error) return res.status(503).json({ success: false, error: 'The session could not be revoked. Sign out using the Supabase client.' });
      return res.json({ success: true, message: 'Session revoked.' });
    } catch {
      return res.status(503).json({ success: false, error: 'The session could not be revoked. Sign out using the Supabase client.' });
    }
  });

  router.post('/reset-password', async (req, res) => {
    const { email } = req.body || {};
    if (!emailAddress(email)) return res.status(400).json({ success: false, error: 'A valid email address is required.' });
    const client = clientFor(res);
    if (!client) return;
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) return res.status(503).json({ success: false, error: 'The password reset request could not be processed.' });
      return res.json({ success: true, message: 'If this address has an account, password reset instructions have been requested.' });
    } catch {
      return res.status(503).json({ success: false, error: 'The password reset request could not be processed.' });
    }
  });

  return router;
}

export default createAuthRouter();
