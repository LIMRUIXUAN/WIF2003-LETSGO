const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const crypto = require('crypto');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const { requireAuth, requireRole, requireSelfEmail, signToken, verifyToken } = require('../middleware/auth');

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(unsignedToken) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(unsignedToken)
    .digest('base64url');
}

function buildToken(payloadOverrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub: '1',
    email: 'test@example.com',
    name: 'Test',
    iat: now,
    exp: now + 60,
    ...payloadOverrides
  });
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken)}`;
}

async function createServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/protected', requireAuth, (req, res) => {
    res.json({ success: true, user: req.authUser });
  });

  app.get('/api/protected/:email', requireAuth, requireSelfEmail, (req, res) => {
    res.json({ success: true, message: 'Access granted' });
  });

  app.get('/api/admin', requireAuth, requireRole(['admin']), (_req, res) => {
    res.json({ success: true, message: 'Admin access granted' });
  });

  app.get('/api/error', (req, res, next) => {
    next(new Error('Test Error'));
  });

  // Global Error Handler
  app.use((err, _req, res, next) => {
    if (res.headersSent) return next(err);
    return res.status(err.status || 500).json({
      success: false,
      message: 'Internal server error.'
    });
  });

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  };
}

test('requireAuth rejects request without token', async () => {
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/protected`);
    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, 'Please sign in again.');
  } finally {
    await server.close();
  }
});

test('requireAuth accepts valid token', async () => {
  const token = signToken({ id: '1', email: 'test@example.com', name: 'Test' });
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/protected`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.user.email, 'test@example.com');
  } finally {
    await server.close();
  }
});

test('signToken embeds the user role in the JWT payload', () => {
  const token = signToken({ id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' });
  const payload = verifyToken(token);

  assert.equal(payload.email, 'admin@example.com');
  assert.equal(payload.role, 'admin');
});

test('signToken defaults missing roles to user', () => {
  const token = signToken({ id: '1', email: 'test@example.com', name: 'Test' });
  const payload = verifyToken(token);

  assert.equal(payload.role, 'user');
});

test('requireAuth rejects tampered token payloads', async () => {
  const token = signToken({ id: '1', email: 'test@example.com', name: 'Test' });
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  payload.email = 'attacker@example.com';
  const tampered = `${parts[0]}.${encode(payload)}.${parts[2]}`;

  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/protected`, {
      headers: { 'Authorization': `Bearer ${tampered}` }
    });
    const payloadBody = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payloadBody.success, false);
    assert.equal(payloadBody.message, 'Please sign in again.');
  } finally {
    await server.close();
  }
});

test('verifyToken rejects expired tokens', () => {
  const expired = buildToken({ exp: Math.floor(Date.now() / 1000) - 1 });

  assert.throws(() => verifyToken(expired), /Token expired/);
});

test('requireSelfEmail rejects if emails do not match', async () => {
  const token = signToken({ id: '1', email: 'test@example.com', name: 'Test' });
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/protected/other@example.com`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, 'You can only access your own account.');
  } finally {
    await server.close();
  }
});

test('requireSelfEmail accepts if emails match', async () => {
  const token = signToken({ id: '1', email: 'test@example.com', name: 'Test' });
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/protected/test@example.com`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.message, 'Access granted');
  } finally {
    await server.close();
  }
});

test('requireSelfEmail accepts case-insensitive email matches', async () => {
  const token = signToken({ id: '1', email: 'Test@Example.com', name: 'Test' });
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/protected/TEST@example.com`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.message, 'Access granted');
  } finally {
    await server.close();
  }
});

test('requireRole rejects authenticated users without an allowed role', async () => {
  const token = signToken({ id: '1', email: 'test@example.com', name: 'Test', role: 'user' });
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/admin`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, 'You do not have permission to perform this action.');
  } finally {
    await server.close();
  }
});

test('requireRole accepts authenticated users with an allowed role', async () => {
  const token = signToken({ id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' });
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/admin`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.message, 'Admin access granted');
  } finally {
    await server.close();
  }
});

test('Global Error Handler catches unhandled exceptions', async () => {
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/error`);
    const payload = await response.json();
    assert.equal(response.status, 500);
    assert.equal(payload.success, false);
    assert.equal(payload.message, 'Internal server error.');
  } finally {
    await server.close();
  }
});
