const test = require('node:test');
const assert = require('node:assert/strict');

const Destination = require('../models/Destination');
const User = require('../models/User');
const Trip = require('../models/Trip');

function collectMessages(error) {
  return Object.values(error.errors).map((entry) => entry.message);
}

async function getValidationMessages(document) {
  try {
    await document.validate();
    return [];
  } catch (error) {
    return collectMessages(error);
  }
}

test('Destination accepts canonical fields and exposes legacy aliases', () => {
  const destination = new Destination({
    id: 1,
    name: 'Rainforest Retreat',
    location: 'Taman Negara',
    category: 'hotel',
    ecoScore: 9.3,
    description: 'Quiet eco lodge near the rainforest canopy.',
    imageUrl: 'https://example.com/lodge.jpg',
    priceLabel: 'RM 300/night',
    co2ImpactLabel: '↓40 kg CO₂',
    lat: 4.381,
    lon: 102.394
  });

  const error = destination.validateSync();

  assert.equal(error, undefined);
  assert.equal(destination.cat, 'hotel');
  assert.equal(destination.eco, 9.3);
  assert.equal(destination.desc, 'Quiet eco lodge near the rainforest canopy.');
  assert.equal(destination.image, 'https://example.com/lodge.jpg');
  assert.equal(destination.co2, '↓40 kg CO₂');
  assert.equal(destination.price, 'RM 300/night');
});

test('Destination rejects missing required fields and invalid ranges', async () => {
  const destination = new Destination({
    id: 2,
    name: '  ',
    location: 'Penang',
    category: 'museum',
    ecoScore: 12,
    description: '',
    imageUrl: '   ',
    rating: 6
  });

  const messages = await getValidationMessages(destination);

  assert.ok(messages.some((message) => message.includes('Destination category is required.') || message.includes('`museum` is not a valid enum value')));
  assert.ok(messages.some((message) => message.includes('Path `ecoScore`') || message.includes('maximum allowed value')));
  assert.ok(messages.includes('Primary image URL is required.'));
  assert.ok(messages.some((message) => message.includes('Path `rating`') || message.includes('maximum allowed value')));
});

test('Destination requires latitude and longitude together', async () => {
  const destination = new Destination({
    id: 3,
    name: 'Mangrove Cruise',
    location: 'Langkawi',
    category: 'activity',
    ecoScore: 8.7,
    description: 'Boat tour through preserved mangroves.',
    imageUrl: 'https://example.com/cruise.jpg',
    lat: 6.35
  });

  const messages = await getValidationMessages(destination);
  assert.ok(messages.includes('Latitude and longitude must both be provided together.'));
});

test('User rejects invalid email, invalid budget, and non-numeric favourites', async () => {
  const user = new User({
    name: 'Aisha',
    email: 'not-an-email',
    password: 'password123',
    budget: 'ultra',
    favorites: [1, 'two']
  });

  const messages = await getValidationMessages(user);
  assert.ok(messages.some((message) => message.includes('valid email')));
  assert.ok(messages.some((message) => message.includes('`ultra` is not a valid enum value')));
  assert.ok(messages.some((message) => message.includes('Favorite destination IDs must be integers.') || message.includes('Cast to [Number] failed')));
});

test('User accepts numeric favourite IDs', () => {
  const user = new User({
    name: 'Faris',
    email: 'faris@example.com',
    password: 'password123',
    favorites: [1, 2, 8]
  });

  assert.equal(user.validateSync(), undefined);
});

test('Trip rejects missing userEmail and name', async () => {
  const trip = new Trip({});
  const messages = await getValidationMessages(trip);
  assert.ok(messages.includes('User email is required.'));
  assert.ok(messages.includes('Trip name is required.'));
});

test('Trip rejects end date before start date', async () => {
  const trip = new Trip({
    userEmail: 'traveller@example.com',
    name: 'Weekend Escape',
    start: new Date('2026-06-10'),
    end: new Date('2026-06-08')
  });

  const messages = await getValidationMessages(trip);
  assert.ok(messages.includes('Trip end date must be on or after the start date.'));
});

test('Trip rejects malformed nested day dates', async () => {
  const trip = new Trip({
    userEmail: 'traveller@example.com',
    name: 'Weekend Escape',
    days: [
      { date: '06/10/2026', stops: [] }
    ]
  });

  const messages = await getValidationMessages(trip);
  assert.ok(messages.includes('Trip day date must use YYYY-MM-DD format.'));
});

test('Destination model declares unique id and search indexes', () => {
  const indexes = Destination.schema.indexes();
  const hasUniqueIdIndex = indexes.some(([fields, options]) => fields.id === 1 && options.unique === true);
  const hasCategoryIndex = indexes.some(([fields]) => fields.category === 1);
  const hasTextIndex = indexes.some(([fields]) => fields.name === 'text' && fields.location === 'text');

  assert.equal(hasUniqueIdIndex, true);
  assert.equal(hasCategoryIndex, true);
  assert.equal(hasTextIndex, true);
});
