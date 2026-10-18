import jwt from 'jsonwebtoken';

export function createAuthorityMiddleware(jwtSecret, authContractVerified = false) {
  return (req, res, next) => {
    if (!jwtSecret) {
      return res.status(503).json({ success: false, error: 'Authentication is not configured.' });
    }
    if (authContractVerified !== true) {
      return res.status(503).json({ success: false, error: 'The JWT claim contract has not been verified.' });
    }

    const authorization = req.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) return res.status(401).json({ success: false, error: 'A bearer token is required.' });

    try {
      const claims = jwt.verify(token, jwtSecret, { algorithms: ['HS256'], audience: 'authenticated' });
      if (!Number.isFinite(claims.exp)) {
        return res.status(401).json({ success: false, error: 'The bearer token must have an expiry.' });
      }
      const role = claims.app_metadata?.role ?? claims.role;
      const labId = claims.app_metadata?.lab_id ?? claims.lab_id ?? claims.labId;

      if (role !== 'authority') {
        return res.status(403).json({ success: false, error: 'Authority access is required.' });
      }
      if (typeof labId !== 'string' || !labId.trim()) {
        return res.status(403).json({ success: false, error: 'The token has no laboratory scope.' });
      }

      req.authority = { labId: labId.trim() };
      return next();
    } catch {
      return res.status(401).json({ success: false, error: 'The bearer token is invalid or expired.' });
    }
  };
}
