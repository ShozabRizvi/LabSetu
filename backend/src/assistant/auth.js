import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { demoAuthorityId, demoCitizenId, demoLabId, fault } from './config.js';

export function secureEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createPatientAuthentication(config) {
  const supabase = config.supabaseUrl && config.supabaseKey
    ? createClient(config.supabaseUrl, config.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(10000) }) } })
    : null;

  async function authenticate(req, res, next) {
    try {
      const token = (req.get('authorization') || '').match(/^Bearer (\S+)$/)?.[1];
      if (!token) throw fault(401, 'Sign in to access your healthcare records.', 'UNAUTHENTICATED');
      // Local demo tokens are accepted only in an explicitly configured demo process.
      if (config.demoMode && config.jwtSecret) {
        try {
          const claims = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], audience: 'labsetu-demo', issuer: 'labsetu-local' });
          if (!claims.exp || ![demoCitizenId, demoAuthorityId].includes(claims.sub)) throw new Error('Invalid demo subject');
          req.actor = { id: claims.sub, role: claims.sub === demoAuthorityId ? 'authority' : 'citizen', labId: demoLabId, canApproveReports: claims.sub === demoAuthorityId, name: claims.sub === demoAuthorityId ? 'Synthetic laboratory staff' : 'Synthetic patient', demo: true };
          return next();
        } catch { throw fault(401, 'Use the synthetic demo sign-in for this local demonstration.'); }
      }
      if (!supabase) throw fault(503, 'Authentication is not configured. Local demonstrations require explicit demo configuration.', 'AUTH_UNAVAILABLE');
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) throw fault(401, 'Your session is invalid or expired.', 'UNAUTHENTICATED');
      const user = data.user;
      const metadata = user.app_metadata || {};
      const staff = ['authority', 'admin', 'staff'].includes(metadata.role);
      // User-editable user_metadata is never a source of privileges or laboratory scope.
      if (staff && !/^[0-9a-f-]{36}$/i.test(metadata.lab_id || '')) throw fault(403, 'Your staff account has no assigned laboratory.');
      req.actor = { id: user.id, role: staff ? 'authority' : 'citizen', labId: staff ? metadata.lab_id : null, canApproveReports: staff && metadata.can_approve_reports === true, name: user.user_metadata?.full_name || 'Patient' };
      next();
    } catch (error) {
      res.status(error.status || 503).json({ success: false, error: error.status ? error.message : 'Authentication service is unavailable.', code: error.code || 'AUTH_UNAVAILABLE' });
    }
  }

  function demoSession(body) {
    if (!config.demoMode || !config.jwtSecret || config.jwtSecret.length < 32 || !config.demoPassword || config.demoPassword.length < 12) throw fault(503, 'Demo login is disabled. Configure DEMO_MODE, a 32-character DEMO_JWT_SECRET and a 12-character DEMO_PASSWORD.');
    if (!secureEqual(body.password, config.demoPassword)) throw fault(401, 'Invalid demo credentials.');
    if (!['citizen', 'authority'].includes(body.role)) throw fault(400, 'Choose patient or staff.');
    const user = { id: body.role === 'authority' ? demoAuthorityId : demoCitizenId, role: body.role, labId: demoLabId, name: body.role === 'authority' ? 'Synthetic laboratory staff' : 'Synthetic patient' };
    const token = jwt.sign({}, config.jwtSecret, { algorithm: 'HS256', audience: 'labsetu-demo', issuer: 'labsetu-local', subject: user.id, expiresIn: '2h' });
    return { token, user, mode: 'DEMO MODE' };
  }
  return { authenticate, demoSession };
}
