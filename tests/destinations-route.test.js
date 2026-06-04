const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const Destination = require('../models/Destination');
const destinationRouter = require('../routes/destinations');
const { signToken } = require('../middleware/auth');

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

function withFailingFind(callback) {
  const originalFind = Destination.find;

  Destination.find = () => ({
    sort() {
      return this;
    },
    lean: async () => {
      throw new Error('raw database failure');
    }
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
      assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
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

test('GET /api/destinations/category/:category returns destinations in that category', async () => {
  await withStubbedFind(SAMPLE_DESTINATIONS, async () => {
    const server = await createServer();

    try {
      const response = await fetch(`${server.baseUrl}/api/destinations/category/restaurant`);
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.count, 1);
      assert.equal(payload.data[0].id, 2);
      assert.equal(payload.data[0].category, 'restaurant');
    } finally {
      await server.close();
    }
  });
});

test('GET /api/destinations/:id returns one destination by numeric display ID', async () => {
  await withStubbedFind(SAMPLE_DESTINATIONS, async () => {
    const server = await createServer();

    try {
      const response = await fetch(`${server.baseUrl}/api/destinations/1`);
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data.id, 1);
      assert.equal(payload.data.name, 'Bamboo Eco Resort');
    } finally {
      await server.close();
    }
  });
});

test('GET /api/destinations/:id returns 404 for unknown destination IDs', async () => {
  await withStubbedFind(SAMPLE_DESTINATIONS, async () => {
    const server = await createServer();

    try {
      const response = await fetch(`${server.baseUrl}/api/destinations/999`);
      const payload = await response.json();

      assert.equal(response.status, 404);
      assert.equal(payload.success, false);
      assert.equal(payload.error, 'Destination not found');
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

test('GET /api/destinations/search/suggestions returns empty suggestions for blank queries', async () => {
  await withStubbedFind(SAMPLE_DESTINATIONS, async () => {
    const server = await createServer();

    try {
      const response = await fetch(`${server.baseUrl}/api/destinations/search/suggestions?q=%20%20`);
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.deepEqual(payload.suggestions, []);
    } finally {
      await server.close();
    }
  });
});

test('GET /api/destinations hides raw database errors', async () => {
  await withFailingFind(async () => {
    const server = await createServer();

    try {
      const response = await fetch(`${server.baseUrl}/api/destinations`);
      const payload = await response.json();

      assert.equal(response.status, 500);
      assert.equal(payload.success, false);
      assert.equal(payload.error, 'Internal server error.');
      assert.equal(JSON.stringify(payload).includes('raw database failure'), false);
    } finally {
      await server.close();
    }
  });
});

test('POST /api/destinations requires an admin role', async () => {
  const server = await createServer();
  const token = signToken({ id: '1', email: 'test@example.com', name: 'Test', role: 'user' });

  try {
    const response = await fetch(`${server.baseUrl}/api/destinations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(SAMPLE_DESTINATIONS[0])
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, 'You do not have permission to perform this action.');
  } finally {
    await server.close();
  }
});

test('PUT /api/destinations/:id requires an admin role', async () => {
  const server = await createServer();
  const token = signToken({ id: '1', email: 'test@example.com', name: 'Test', role: 'user' });

  try {
    const response = await fetch(`${server.baseUrl}/api/destinations/1`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Updated' })
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.success, false);
    assert.equal(payload.message, 'You do not have permission to perform this action.');
  } finally {
    await server.close();
  }
});

test('DELETE /api/destinations/:id requires an admin role', async () => {
  const server = await createServer();
  const token = signToken({ id: '1', email: 'test@example.com', name: 'Test', role: 'user' });

  try {
    const response = await fetch(`${server.baseUrl}/api/destinations/1`, {
      method: 'DELETE',
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
