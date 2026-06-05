const crypto = require('crypto');

const TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7);

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function getAuthSecret() {
  const secret = process.env.JWT_SECRET || process.env.AUTH_TOKEN_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is not set. ' +
      'Add JWT_SECRET to your .env file before starting the server.'
    );
  }
  return secret;
}

function signPayload(unsignedToken) {
  return crypto
    .createHmac('sha256', getAuthSecret())
    .update(unsignedToken)
    .digest('base64url');
}

function signToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const payload = base64UrlEncode({
    sub: String(user._id || user.id || ''),
    email: String(user.email || '').trim().toLowerCase(),
    name: user.name || '',
    role: user.role || 'user',
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  });
  const unsignedToken = `${header}.${payload}`;

  return `${unsignedToken}.${signPayload(unsignedToken)}`;
}

function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format.');
  }

  const unsignedToken = `${parts[0]}.${parts[1]}`;
  const expectedSignature = signPayload(unsignedToken);
  const actualSignature = parts[2];

  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(actualSignature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new Error('Invalid token signature.');
  }

  const payload = base64UrlDecode(parts[1]);
  if (!payload.email || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired.');
  }

  return payload;
}

function getBearerToken(req) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}

function requireAuth(req, res, next) {
  try {
    req.authUser = verifyToken(getBearerToken(req));
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: 'Please sign in again.'
    });
  }
}

function requireSelfEmail(req, res, next) {
  const requestedEmail = String(req.params.email || '').trim().toLowerCase();
  const tokenEmail = String(req.authUser?.email || '').trim().toLowerCase();

  if (!requestedEmail || requestedEmail !== tokenEmail) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own account.'
    });
  }

  return next();
}

function requireRole(allowedRoles) {
  const normalizedRoles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
    .map((role) => String(role || '').trim().toLowerCase())
    .filter(Boolean);

  return function requireAllowedRole(req, res, next) {
    const userRole = String(req.authUser?.role || '').trim().toLowerCase();

    if (!userRole || !normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requireSelfEmail,
  signToken,
  verifyToken
};
