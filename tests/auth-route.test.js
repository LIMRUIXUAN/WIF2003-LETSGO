const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const crypto = require('crypto');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

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
          save: async function() {
            Object.assign(record, {
              name: this.name,
              email: this.email,
              password: this.password,
              resetCodeHash: this.resetCodeHash,
              resetCodeExpiresAt: this.resetCodeExpiresAt
            });
            return this;
          }
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

function hashResetCodeForTest(code) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(String(code))
    .digest('hex');
}

async function withReloadedAuthRouter({ sendMail, randomInt } = {}, callback) {
  const routePath = require.resolve('../routes/auth');
  const mailerPath = require.resolve('../utils/mailer');
  const originalRouteCache = require.cache[routePath];
  const originalMailerCache = require.cache[mailerPath];
  const originalRandomInt = crypto.randomInt;

  delete require.cache[routePath];
  if (sendMail) {
    require.cache[mailerPath] = {
      id: mailerPath,
      filename: mailerPath,
      loaded: true,
      exports: { sendMail }
    };
  }
  if (randomInt) {
    crypto.randomInt = randomInt;
  }

  try {
    const reloadedRouter = require('../routes/auth');
    return await callback(reloadedRouter);
  } finally {
    delete require.cache[routePath];
    if (originalRouteCache) require.cache[routePath] = originalRouteCache;
    if (originalMailerCache) require.cache[mailerPath] = originalMailerCache;
    else delete require.cache[mailerPath];
    crypto.randomInt = originalRandomInt;
  }
}

async function createServer(router = authRouter) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', router);

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

test('POST /api/auth/login rejects oversized passwords before comparison', async () => {
  await withStubbedUserFindOne([], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'valid@example.com', password: 'a'.repeat(73) })
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

test('POST /api/auth/password-reset/request stores hashed code and sends email', async () => {
  const existingUser = {
    email: 'reset@example.com',
    name: 'Reset User',
    password: 'password123',
    resetCodeHash: '',
    resetCodeExpiresAt: null
  };
  const sentMessages = [];

  await withStubbedUserFindOne([existingUser], async () => {
    await withReloadedAuthRouter({
      randomInt: () => 123456,
      sendMail: async (message) => sentMessages.push(message)
    }, async (router) => {
      const server = await createServer(router);
      try {
        const response = await fetch(`${server.baseUrl}/api/auth/password-reset/request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'Reset@Example.com' })
        });
        const payload = await response.json();
        assert.equal(response.status, 200);
        assert.equal(payload.success, true);
        assert.equal(payload.expiresInMinutes, 10);
        assert.equal(existingUser.resetCodeHash, hashResetCodeForTest('123456'));
        assert.ok(existingUser.resetCodeExpiresAt instanceof Date);
        assert.equal(sentMessages.length, 1);
        assert.equal(sentMessages[0].to, 'reset@example.com');
        assert.match(sentMessages[0].text, /123456/);
      } finally {
        await server.close();
      }
    });
  });
});

test('POST /api/auth/password-reset/confirm resets password and clears reset token', async () => {
  const existingUser = {
    email: 'reset@example.com',
    name: 'Reset User',
    password: 'old-password',
    resetCodeHash: hashResetCodeForTest('654321'),
    resetCodeExpiresAt: new Date(Date.now() + 60 * 1000)
  };

  await withStubbedUserFindOne([existingUser], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'reset@example.com',
          code: '654321',
          password: 'new-password'
        })
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(existingUser.password, 'new-password');
      assert.equal(existingUser.resetCodeHash, '');
      assert.equal(existingUser.resetCodeExpiresAt, null);
    } finally {
      await server.close();
    }
  });
});

test('POST /api/auth/password-reset/confirm enforces maximum password length', async () => {
  const existingUser = {
    email: 'reset@example.com',
    name: 'Reset User',
    password: 'old-password',
    resetCodeHash: hashResetCodeForTest('654321'),
    resetCodeExpiresAt: new Date(Date.now() + 60 * 1000)
  };

  await withStubbedUserFindOne([existingUser], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'reset@example.com',
          code: '654321',
          password: 'a'.repeat(73)
        })
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.equal(payload.message, 'Password must be 72 characters or fewer.');
      assert.equal(existingUser.password, 'old-password');
    } finally {
      await server.close();
    }
  });
});

test('POST /api/auth/password-reset/confirm rejects expired codes and clears them', async () => {
  const existingUser = {
    email: 'reset@example.com',
    name: 'Reset User',
    password: 'old-password',
    resetCodeHash: hashResetCodeForTest('654321'),
    resetCodeExpiresAt: new Date(Date.now() - 60 * 1000)
  };

  await withStubbedUserFindOne([existingUser], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'reset@example.com',
          code: '654321',
          password: 'new-password'
        })
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.equal(payload.message, 'Verification code expired. Please request a new one.');
      assert.equal(existingUser.resetCodeHash, '');
      assert.equal(existingUser.resetCodeExpiresAt, null);
    } finally {
      await server.close();
    }
  });
});

test('auth endpoints rate limit repeated attempts', async () => {
  await withStubbedUserFindOne([], async () => {
    await withReloadedAuthRouter({}, async (router) => {
      const server = await createServer(router);
      try {
        let lastResponse;
        for (let i = 0; i < 31; i++) {
          lastResponse = await fetch(`${server.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'limited@example.com', password: 'password123' })
          });
          await lastResponse.text();
        }

        assert.equal(lastResponse.status, 429);
      } finally {
        await server.close();
      }
    });
  });
});
