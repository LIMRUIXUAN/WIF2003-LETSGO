const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const Trip = require('../models/Trip');
const tripRouter = require('../routes/trips');
const { signToken } = require('../middleware/auth');

function withStubbedTripModel(records, callback) {
  const originalFind = Trip.find;
  const originalFindById = Trip.findById;
  const originalCreate = Trip.create;
  const originalFindByIdAndUpdate = Trip.findByIdAndUpdate;
  const originalFindByIdAndDelete = Trip.findByIdAndDelete;

  let localRecords = [...records];

  Trip.find = async (query = {}) => {
    return localRecords.filter(r => r.userEmail === query.userEmail);
  };

  Trip.findById = async (id) => {
    return localRecords.find(r => String(r._id) === String(id));
  };

  Trip.create = async (data) => {
    const newTrip = { _id: Date.now().toString(), ...data };
    localRecords.push(newTrip);
    return newTrip;
  };

  Trip.findByIdAndUpdate = async (id, data) => {
    const index = localRecords.findIndex(r => String(r._id) === String(id));
    if (index !== -1) {
      localRecords[index] = { ...localRecords[index], ...data };
      return localRecords[index];
    }
    return null;
  };

  Trip.findByIdAndDelete = async (id) => {
    const index = localRecords.findIndex(r => String(r._id) === String(id));
    if (index !== -1) {
      const deleted = localRecords[index];
      localRecords.splice(index, 1);
      return deleted;
    }
    return null;
  };

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      Trip.find = originalFind;
      Trip.findById = originalFindById;
      Trip.create = originalCreate;
      Trip.findByIdAndUpdate = originalFindByIdAndUpdate;
      Trip.findByIdAndDelete = originalFindByIdAndDelete;
    });
}

async function createServer() {
  const app = express();
  app.use(express.json());
  app.use('/api/trips', tripRouter);

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

test('GET /api/trips/:email returns trips for user', async () => {
  const sampleTrips = [
    { _id: '1', name: 'Trip 1', userEmail: 'test@example.com' },
    { _id: '2', name: 'Trip 2', userEmail: 'other@example.com' }
  ];

  await withStubbedTripModel(sampleTrips, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips/test@example.com`, {
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data.length, 1);
      assert.equal(payload.data[0].name, 'Trip 1');
    } finally {
      await server.close();
    }
  });
});

test('POST /api/trips creates a new trip', async () => {
  await withStubbedTripModel([], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ name: 'New Trip' })
      });
      const payload = await response.json();
      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      assert.equal(payload.data.name, 'New Trip');
      assert.equal(payload.data.userEmail, 'test@example.com');
    } finally {
      await server.close();
    }
  });
});

test('DELETE /api/trips/:id deletes the trip if owned by user', async () => {
  const sampleTrips = [
    { _id: 'trip123', name: 'Trip 1', userEmail: 'test@example.com' }
  ];

  await withStubbedTripModel(sampleTrips, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips/trip123`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.message, 'Trip deleted');
    } finally {
      await server.close();
    }
  });
});

test('DELETE /api/trips/:id rejects if owned by another user', async () => {
  const sampleTrips = [
    { _id: 'trip456', name: 'Trip 2', userEmail: 'other@example.com' }
  ];

  await withStubbedTripModel(sampleTrips, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips/trip456`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      const payload = await response.json();
      assert.equal(response.status, 403);
      assert.equal(payload.success, false);
      assert.equal(payload.message, 'You can only delete your own trips.');
    } finally {
      await server.close();
    }
  });
});
