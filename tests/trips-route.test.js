const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

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
    const trip = new Trip(data);
    await trip.validate();
    const newTrip = { _id: Date.now().toString(), ...trip.toObject() };
    localRecords.push(newTrip);
    return newTrip;
  };

  Trip.findByIdAndUpdate = async (id, data) => {
    const index = localRecords.findIndex(r => String(r._id) === String(id));
    if (index !== -1) {
      const updated = { ...localRecords[index], ...data };
      const { _id, ...updatedWithoutId } = updated;
      const trip = new Trip(updatedWithoutId);
      await trip.validate();
      localRecords[index] = updated;
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

test('POST /api/trips/calculate-carbon calculates distance, footprint, and savings', async () => {
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/trips/calculate-carbon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        transportMode: 'bus',
        stops: [
          { location: { lat: 0, lng: 0 } },
          { location: { lat: 0, lng: 1 } }
        ]
      })
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.distanceKm, 133.4);
    assert.equal(payload.carbonFootprintKg, 14);
    assert.equal(payload.carbonSavedKg, 4.7);
  } finally {
    await server.close();
  }
});

test('POST /api/trips/calculate-carbon rejects missing route stops', async () => {
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/trips/calculate-carbon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({ transportMode: 'walking', stops: [{ location: { lat: 3.1, lng: 101.7 } }] })
    });
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, 'At least two stops are required for route calculations.');
  } finally {
    await server.close();
  }
});

test('POST /api/trips/calculate-carbon requires authentication', async () => {
  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/trips/calculate-carbon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transportMode: 'walking',
        stops: [
          { location: { lat: 3.1, lng: 101.7 } },
          { location: { lat: 3.2, lng: 101.8 } }
        ]
      })
    });
    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, 'Please sign in again.');
  } finally {
    await server.close();
  }
});

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

test('GET /api/trips/:email rejects access to another user email', async () => {
  await withStubbedTripModel([], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips/other@example.com`, {
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      const payload = await response.json();
      assert.equal(response.status, 403);
      assert.equal(payload.success, false);
      assert.equal(payload.message, 'You can only access your own account.');
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

test('POST /api/trips rejects invalid trip payloads', async () => {
  await withStubbedTripModel([], async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ name: '   ' })
      });
      const payload = await response.json();
      assert.equal(response.status, 400);
      assert.equal(payload.success, false);
      assert.match(payload.message, /Trip name is required/);
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/trips/:id updates owned trips and preserves token ownership', async () => {
  const sampleTrips = [
    { _id: 'trip123', name: 'Trip 1', userEmail: 'test@example.com' }
  ];

  await withStubbedTripModel(sampleTrips, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips/trip123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({
          _id: 'changed-id',
          userEmail: 'attacker@example.com',
          name: 'Updated Trip',
          days: [{ date: '2026-06-12', stops: [{ name: 'Low-carbon breakfast' }] }]
        })
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data._id, 'trip123');
      assert.equal(payload.data.name, 'Updated Trip');
      assert.equal(payload.data.userEmail, 'test@example.com');
      assert.equal(payload.data.days[0].stops[0].name, 'Low-carbon breakfast');
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/trips/:id compares trip ownership case-insensitively', async () => {
  const sampleTrips = [
    { _id: 'tripMixed', name: 'Mixed Case Trip', userEmail: 'Test@Example.com' }
  ];

  await withStubbedTripModel(sampleTrips, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips/tripMixed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ name: 'Updated Mixed Case Trip' })
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data.userEmail, 'test@example.com');
    } finally {
      await server.close();
    }
  });
});

test('PUT /api/trips/:id rejects updates to trips owned by another user', async () => {
  const sampleTrips = [
    { _id: 'trip456', name: 'Trip 2', userEmail: 'other@example.com' }
  ];

  await withStubbedTripModel(sampleTrips, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips/trip456`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`
        },
        body: JSON.stringify({ name: 'Should Not Update' })
      });
      const payload = await response.json();
      assert.equal(response.status, 403);
      assert.equal(payload.success, false);
      assert.equal(payload.message, 'You can only update your own trips.');
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

test('DELETE /api/trips/:id compares trip ownership case-insensitively', async () => {
  const sampleTrips = [
    { _id: 'tripMixed', name: 'Mixed Case Trip', userEmail: 'Test@Example.com' }
  ];

  await withStubbedTripModel(sampleTrips, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/trips/tripMixed`, {
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
