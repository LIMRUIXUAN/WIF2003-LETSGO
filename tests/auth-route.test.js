const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const User = require('../models/User');
const authRouter = require('../routes/auth');

function withStubbedUserFindOne(records, callback) {
  const originalFindOne = User.findOne;

  User.findOne = (query = {}) => {
    return {
      select() { return this; },
      async then(resolve) {
        const record = records.find(r => r.email === query.email);
        resolve(record ? Object.assign(new User(record), record, {
          comparePassword: async (pwd) => pwd === 'password123',
          isPasswordHashed: () => false,
          save: async () => {}
        }) : null);
      }
    };
  };

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      User.findOne = originalFindOne;
    });
}

function withStubbedUserSave(callback) {
  const originalSave = User.prototype.save;
  let saveCalled = false;

  User.prototype.save = async function() {
    saveCalled = true;
    return this;
  };

  return Promise.resolve()
    .then(() => callback(() => saveCalled))
    .finally(() => {
      User.prototype.save = originalSave;
    });
}

async function createServer() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);

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

test('POST /api/auth/register fails with missing fields', async () => {
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.message.includes('Name, email, and password are required'));
  } finally {
    await server.close();
  }
});

test('POST /api/auth/register fails if email already exists', async () => {
  const existingUser = { email: 'existing@example.com', name: 'Existing', password: 'password123' };
  await withStubbedUserFindOne([existingUser], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New', email: 'existing@example.com', password: 'password123' })
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.equal(payload.message, 'Email already registered.');
    } finally {
      await server.close();
    }
  });
});

test('POST /api/auth/register succeeds for new user', async () => {
  await withStubbedUserFindOne([], async () => {
    await withStubbedUserSave(async (getSaveCalled) => {
      const server = await createServer();
      try {
        const response = await fetch(`${server.baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New', email: 'new@example.com', password: 'password123' })
        });
        const payload = await response.json();
        assert.equal(response.status, 201);
        assert.equal(payload.success, true);
        assert.equal(payload.message, 'Account created successfully!');
        assert.equal(getSaveCalled(), true);
      } finally {
        await server.close();
      }
    });
  });
});

test('POST /api/auth/login fails for incorrect credentials', async () => {
  await withStubbedUserFindOne([], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@example.com', password: 'password123' })
      });
      const payload = await response.json();
      assert.equal(response.status, 401);
      assert.equal(payload.success, false);
      assert.equal(payload.message, 'Invalid email or password.');
    } finally {
      await server.close();
    }
  });
});

test('POST /api/auth/login succeeds for correct credentials', async () => {
  const existingUser = { email: 'valid@example.com', name: 'Valid User', password: 'password123' };
  await withStubbedUserFindOne([existingUser], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'valid@example.com', password: 'password123' })
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.ok(payload.token);
    } finally {
      await server.close();
    }
  });
});
