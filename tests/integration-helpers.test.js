const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-jwt-secret';

// Import routers
const authRouter = require('../routes/auth');
const tripsRouter = require('../routes/trips');
const destinationsRouter = require('../routes/destinations');
const usersRouter = require('../routes/users');

// Import models to stub
const User = require('../models/User');
const Trip = require('../models/Trip');
const Destination = require('../models/Destination');
const { signToken } = require('../middleware/auth');

const testUser = {
  id: 'test-user-id',
  email: 'testuser@ecoplanner.com',
  name: 'Test User',
  role: 'user'
};
const validToken = signToken(testUser);

// Helper to start server
async function createServer() {
  const app = express();
  app.use(express.json());

  app.use('/api/auth', authRouter);
  app.use('/api/trips', tripsRouter);
  app.use('/api/destinations', destinationsRouter);
  app.use('/api/users', usersRouter);

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

// ── TC_INT_001: Registration API Integration Test ──
test('TC_INT_001: registration API creates new user document successfully', async () => {
  const originalFindOne = User.findOne;
  const originalSave = User.prototype.save;
  
  User.findOne = async () => null; // No duplicate user
  User.prototype.save = async function() { return this; }; // Mock save

  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Integration Test User',
        email: 'newuser@ecoplanner.com',
        password: 'password123'
      })
    });
    
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.message, /registration successful/i);
  } finally {
    User.findOne = originalFindOne;
    User.prototype.save = originalSave;
    await server.close();
  }
});

// ── TC_INT_002: Login Token Retrieval Integration Test ──
test('TC_INT_002: login API returns JWT token for valid credentials', async () => {
  const mockUser = new User({
    name: 'Test User',
    email: 'testuser@ecoplanner.com',
    password: 'password123'
  });
  
  const originalFindOne = User.findOne;
  User.findOne = () => {
    return {
      select() { return this; },
      async then(resolve) {
        resolve(Object.assign(mockUser, {
          comparePassword: async () => true,
          isPasswordHashed: () => true
        }));
      }
    };
  };

  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@ecoplanner.com',
        password: 'password123'
      })
    });
    
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.token);
  } finally {
    User.findOne = originalFindOne;
    await server.close();
  }
});

// ── TC_INT_003: Profile Route Authentication Flow ──
test('TC_INT_003: user profile endpoint protects routes with Bearer authentication', async () => {
  const mockUser = { name: 'Test User', email: 'testuser@ecoplanner.com', favorites: [], interests: [] };
  const originalFindOne = User.findOne;
  User.findOne = async () => mockUser;

  const server = await createServer();
  try {
    // 1. Unauthenticated request -> should fail
    const failResponse = await fetch(`${server.baseUrl}/api/users/profile/testuser@ecoplanner.com`);
    assert.equal(failResponse.status, 401);

    // 2. Authenticated request with token -> should succeed
    const successResponse = await fetch(`${server.baseUrl}/api/users/profile/testuser@ecoplanner.com`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    const payload = await successResponse.json();
    assert.equal(successResponse.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.email, 'testuser@ecoplanner.com');
  } finally {
    User.findOne = originalFindOne;
    await server.close();
  }
});

// ── TC_INT_004: Explore Destination API Flow ──
test('TC_INT_004: destinations API loads seeded destination list', async () => {
  const mockDestinations = [
    { id: 1, name: 'Langkawi Nature Walk', category: 'Nature', priceLabel: 'RM50', ecoScore: 9, co2ImpactLabel: 'Minimal', rating: 4.8 }
  ];
  const originalFind = Destination.find;
  Destination.find = () => {
    return {
      sort() { return this; },
      async lean() {
        return mockDestinations;
      }
    };
  };

  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/destinations`);
    const payload = await response.json();
    
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data.length > 0);
    assert.equal(payload.data[0].name, 'Langkawi Nature Walk');
  } finally {
    Destination.find = originalFind;
    await server.close();
  }
});

// ── TC_INT_005: Itinerary Trip CRUD API Flow ──
test('TC_INT_005: trips API handles itinerary CRUD operations correctly', async () => {
  const originalCreate = Trip.create;
  Trip.create = async (data) => {
    return { _id: 'mock-trip-id', ...data };
  };

  const server = await createServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        name: 'API Integration Trip',
        city: 'Georgetown',
        start: '2026-06-12',
        end: '2026-06-14',
        days: []
      })
    });
    
    const payload = await response.json();
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.name, 'API Integration Trip');
  } finally {
    Trip.create = originalCreate;
    await server.close();
  }
});

// ── TC_INT_006: Carbon Calculation Endpoint Flow ──
test('TC_INT_006: calculate-carbon endpoint correctly returns carbon footprint values', async () => {
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
          { location: { lat: 3.1579, lng: 101.7116 } },
          { location: { lat: 3.1491, lng: 101.6960 } }
        ]
      })
    });
    
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.distanceKm > 0);
    assert.ok(payload.carbonFootprintKg >= 0);
  } finally {
    await server.close();
  }
});
