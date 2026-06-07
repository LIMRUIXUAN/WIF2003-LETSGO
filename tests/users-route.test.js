const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const User = require('../models/User');
const Trip = require('../models/Trip');
const userRouter = require('../routes/users');
const { signToken, verifyToken } = require('../middleware/auth');

function withStubbedUserModel(records, callback) {
  const originalFindOne = User.findOne;
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const originalFindOneAndDelete = User.findOneAndDelete;
  const originalTripUpdateMany = Trip.updateMany;
  const originalTripDeleteMany = Trip.deleteMany;

  let localRecords = [...records];
  const calls = {
    tripUpdates: [],
    tripDeletes: []
  };

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

  User.findOneAndDelete = async (query) => {
    const index = localRecords.findIndex(r => r.email === query.email);
    if (index === -1) return null;
    const deleted = localRecords[index];
    localRecords.splice(index, 1);
    return deleted;
  };

  Trip.updateMany = async (query, update) => {
    calls.tripUpdates.push({ query, update });
    return { modifiedCount: 1 };
  };

  Trip.deleteMany = async (query) => {
    calls.tripDeletes.push({ query });
    return { deletedCount: 2 };
  };

  return Promise.resolve()
    .then(() => callback({ calls, getRecords: () => localRecords }))
    .finally(() => {
      User.findOne = originalFindOne;
      User.findOneAndUpdate = originalFindOneAndUpdate;
      User.findOneAndDelete = originalFindOneAndDelete;
      Trip.updateMany = originalTripUpdateMany;
      Trip.deleteMany = originalTripDeleteMany;
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

test('GET /api/users/profile/:email rejects unauthenticated requests', async () => {
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/users/profile/test@example.com`);
    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, 'Please sign in again.');
  } finally {
    await server.close();
  }
});

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

test('PUT /api/users/:email/favorites rejects invalid destination IDs', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User', favorites: [1] }];
  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/test@example.com/favorites`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ destinationId: 'not-a-number' })
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.equal(payload.message, 'Valid destinationId is required');
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/users/:email/interests saves normalized travel interests', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User', interests: ['🏞 Nature'] }];
  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/test@example.com/interests`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ interests: ['🚲 Cycling', ' 🚲 Cycling ', '', '🌊 Beach'] })
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.deepEqual(payload.data.interests, ['🚲 Cycling', '🌊 Beach']);
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/users/:email/interests rejects non-array interests', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User', interests: [] }];
  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/test@example.com/interests`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ interests: '🌊 Beach' })
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.equal(payload.message, 'Interests must be an array.');
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/users/:email/password updates password and returns a fresh token', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User', password: 'old-password123' }];
  const token = signToken({ email: 'test@example.com', name: 'Test User', id: '123' });

  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/test@example.com/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: 'old-password123',
          newPassword: 'new-password123'
        })
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.message, 'Password updated successfully.');
      assert.equal(verifyToken(payload.token).email, 'test@example.com');
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

test('PUT /api/users/:email cascades email changes to trips and returns a fresh token', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User', city: 'Old City' }];
  await withStubbedUserModel(sampleUsers, async ({ calls }) => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/test@example.com`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ email: 'updated@example.com', city: 'New City' })
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data.email, 'updated@example.com');
      assert.equal(verifyToken(payload.token).email, 'updated@example.com');
      assert.deepEqual(calls.tripUpdates, [{
        query: { userEmail: 'test@example.com' },
        update: { $set: { userEmail: 'updated@example.com' } }
      }]);
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/users/:email rejects invalid avatar image formats', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User' }];
  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/test@example.com`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ avatar: 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+' })
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.match(payload.message, /Invalid avatar format/);
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/users/:email accepts PNG avatar data URLs', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User' }];
  const avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/test@example.com`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ avatar })
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data.avatar, avatar);
    } finally {
      await server.close();
    }
  });
});

test('DELETE /api/users/:email deletes the user and their trips', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User' }];
  await withStubbedUserModel(sampleUsers, async ({ calls, getRecords }) => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/users/test@example.com`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.message, 'Account deleted.');
      assert.deepEqual(getRecords(), []);
      assert.deepEqual(calls.tripDeletes, [{ query: { userEmail: 'test@example.com' } }]);
    } finally {
      await server.close();
    }
  });
});

test('profile update endpoints rate limit repeated updates', async () => {
  const sampleUsers = [{ email: 'test@example.com', name: 'Test User', city: 'Old City' }];
  await withStubbedUserModel(sampleUsers, async () => {
    const server = await createServer();
    try {
      let lastResponse;
      for (let i = 0; i < 61; i++) {
        lastResponse = await fetch(`${server.baseUrl}/api/users/test@example.com`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`
          },
          body: JSON.stringify({ city: `City ${i}` })
        });
        await lastResponse.text();
      }

      assert.equal(lastResponse.status, 429);
    } finally {
      await server.close();
    }
  });
});
