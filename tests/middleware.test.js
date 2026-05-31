const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { requireAuth, requireSelfEmail, signToken, verifyToken } = require('../middleware/auth');

async function createServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/protected', requireAuth, (req, res) => {
    res.json({ success: true, user: req.authUser });
  });

  app.get('/api/protected/:email', requireAuth, requireSelfEmail, (req, res) => {
    res.json({ success: true, message: 'Access granted' });
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
