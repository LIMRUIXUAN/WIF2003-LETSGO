const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const User = require('../models/User');
const userRouter = require('../routes/users');
const { signToken } = require('../middleware/auth');

function withStubbedUserModel(records, callback) {
  const originalFindOne = User.findOne;
  const originalFindOneAndUpdate = User.findOneAndUpdate;

  let localRecords = [...records];

  User.findOne = (query = {}) => {
    return {
      select() { return this; },
      async then(resolve) {
        const record = localRecords.find(r => r.email === query.email);
        if (record) {
          const userDoc = Object.assign(new User(record), record);
          userDoc.save = async function() {
             const index = localRecords.findIndex(r => r.email === this.email);
             if (index !== -1) localRecords[index] = this;
          };
          resolve(userDoc);
        } else {
          resolve(null);
        }
      }
    };
  };

  User.findOneAndUpdate = async (query, update, options) => {
    const index = localRecords.findIndex(r => r.email === query.email);
    if (index !== -1) {
      if (update.$set) {
        localRecords[index] = { ...localRecords[index], ...update.$set };
      }
      return localRecords[index];
    }
    return null;
  };

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      User.findOne = originalFindOne;
      User.findOneAndUpdate = originalFindOneAndUpdate;
    });
}

async function createServer() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRouter);

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

const dummyUser = { email: 'test@example.com', name: 'Test User', id: '123' };
const validToken = signToken(dummyUser);

test('GET /api/users/profile/:email returns user profile', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User', favorites: [1, 2] }];
  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/profile/test@example.com`, {
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data.name, 'Test User');
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/users/:email/favorites toggles destination ID', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User', favorites: [1] }];
  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      // Add a favorite
      let response = await fetch(`${server.baseUrl}/api/users/test@example.com/favorites`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}` 
        },
        body: JSON.stringify({ destinationId: 2 })
      });
      let payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.action, 'added');
      assert.deepEqual(payload.favorites, [1, 2]);

      // Remove the favorite
      response = await fetch(`${server.baseUrl}/api/users/test@example.com/favorites`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}` 
        },
        body: JSON.stringify({ destinationId: 1 })
      });
      payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.action, 'removed');
      assert.deepEqual(payload.favorites, [2]);
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/users/:email updates profile information', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User', city: 'Old City' }];
  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/test@example.com`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}` 
        },
        body: JSON.stringify({ city: 'New City' })
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data.city, 'New City');
    } finally {
      await server.close();
    }
  });
});
