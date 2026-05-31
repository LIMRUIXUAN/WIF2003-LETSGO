const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const Destination = require('../models/Destination');
const destinationRouter = require('../routes/destinations');

const SAMPLE_DESTINATIONS = [
  {
    id: 1,
    name: 'Bamboo Eco Resort',
    location: 'Cameron Highlands',
    category: 'hotel',
    ecoScore: 9.4,
    description: 'Solar-powered mountain retreat.',
    imageUrl: 'https://example.com/bamboo.jpg',
    priceLabel: 'RM 280/night',
    co2ImpactLabel: '↓34 kg CO₂',
    icon: '🏕',
    rating: 4.9
  },
  {
    id: 2,
    name: 'Green Roots Cafe',
    location: 'Kuala Lumpur',
    cat: 'restaurant',
    eco: 8.8,
    desc: 'Plant-based menu with zero-waste packaging.',
    image: 'https://example.com/cafe.jpg',
    price: 'RM 25-60',
    co2: '↓8 kg CO₂',
    icon: '🍃',
    rating: 4.7
  }
];

function withStubbedFind(records, callback) {
  const originalFind = Destination.find;

  Destination.find = (query = {}) => ({
    sort() {
      return this;
    },
    lean: async () => records.filter((record) => matchesQuery(record, query))
  });

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      Destination.find = originalFind;
    });
}

function matchesQuery(record, query) {
  if (!query || Object.keys(query).length === 0) {
    return true;
  }

  if (Array.isArray(query.$and)) {
    return query.$and.every((condition) => matchesQuery(record, condition));
  }

  if (Array.isArray(query.$or)) {
    return query.$or.some((condition) => matchesQuery(record, condition));
  }

  return Object.entries(query).every(([key, value]) => {
    const actual = record[key];

    if (value instanceof RegExp) {
      return value.test(String(actual || ''));
    }

    if (value && typeof value === 'object' && '$gte' in value) {
      return Number(actual) >= value.$gte;
    }

    return actual === value;
  });
}

async function createServer() {
  const app = express();
  app.use(express.json());
  app.use('/api/destinations', destinationRouter);

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

test('GET /api/destinations returns legacy and canonical destination fields', async () => {
  await withStubbedFind(SAMPLE_DESTINATIONS, async () => {
    const server = await createServer();

    try {
      const response = await fetch(`${server.baseUrl}/api/destinations`);
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.count, 2);
      assert.equal(payload.data[0].category, 'hotel');
      assert.equal(payload.data[0].cat, 'hotel');
      assert.equal(payload.data[0].ecoScore, 9.4);
      assert.equal(payload.data[0].eco, 9.4);
      assert.equal(payload.data[0].description, 'Solar-powered mountain retreat.');
      assert.equal(payload.data[0].desc, 'Solar-powered mountain retreat.');
      assert.equal(payload.data[0].imageUrl, 'https://example.com/bamboo.jpg');
      assert.equal(payload.data[0].image, 'https://example.com/bamboo.jpg');
      assert.equal(payload.data[1].category, 'restaurant');
      assert.equal(payload.data[1].cat, 'restaurant');
    } finally {
      await server.close();
    }
  });
});

test('GET /api/destinations applies search, category, eco, and price filters', async () => {
  await withStubbedFind(SAMPLE_DESTINATIONS, async () => {
    const server = await createServer();

    try {
      const response = await fetch(`${server.baseUrl}/api/destinations?search=cameron&category=hotel&minEco=9&maxPrice=300`);
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.count, 1);
      assert.equal(payload.data[0].id, 1);
    } finally {
      await server.close();
    }
  });
});

test('GET /api/destinations/search/suggestions returns search suggestions from Mongo-backed results', async () => {
  await withStubbedFind(SAMPLE_DESTINATIONS, async () => {
    const server = await createServer();

    try {
      const response = await fetch(`${server.baseUrl}/api/destinations/search/suggestions?q=green`);
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.deepEqual(payload.suggestions, ['Green Roots Cafe']);
    } finally {
      await server.close();
    }
  });
});
