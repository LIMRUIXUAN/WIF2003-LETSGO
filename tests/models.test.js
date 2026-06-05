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

test('Destination accepts legacy alias setters and stores canonical fields', () => {
  const destination = new Destination({
    id: 10,
    name: 'Legacy Cafe',
    location: 'Ipoh',
    cat: 'restaurant',
    eco: 8.5,
    desc: 'Local vegetarian menu with reusable containers.',
    image: 'https://example.com/legacy-cafe.jpg',
    price: 'RM 20-40',
    co2: '↓6 kg CO₂'
  });

  const error = destination.validateSync();

  assert.equal(error, undefined);
  assert.equal(destination.category, 'restaurant');
  assert.equal(destination.ecoScore, 8.5);
  assert.equal(destination.description, 'Local vegetarian menu with reusable containers.');
  assert.equal(destination.imageUrl, 'https://example.com/legacy-cafe.jpg');
  assert.equal(destination.priceLabel, 'RM 20-40');
  assert.equal(destination.co2ImpactLabel, '↓6 kg CO₂');
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

test('User rejects passwords longer than bcrypt input limit', async () => {
  const user = new User({
    name: 'Long Password',
    email: 'longpassword@example.com',
    password: 'a'.repeat(73)
  });

  const messages = await getValidationMessages(user);
  assert.ok(messages.includes('Password must be 72 characters or fewer.'));
});

test('User normalizes budget aliases before validation', async () => {
  const user = new User({
    name: 'Mei',
    email: 'mei@example.com',
    password: 'password123',
    budget: 'luxury'
  });

  const messages = await getValidationMessages(user);

  assert.deepEqual(messages, []);
  assert.equal(user.budget, 'high');
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

test('User defaults to user role and accepts admin role', () => {
  const regularUser = new User({
    name: 'Regular User',
    email: 'regular@example.com',
    password: 'password123'
  });
  const adminUser = new User({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  });

  assert.equal(regularUser.validateSync(), undefined);
  assert.equal(regularUser.role, 'user');
  assert.equal(adminUser.validateSync(), undefined);
  assert.equal(adminUser.role, 'admin');
});

test('User rejects invalid roles', async () => {
  const user = new User({
    name: 'Bad Role',
    email: 'badrole@example.com',
    password: 'password123',
    role: 'owner'
  });

  const messages = await getValidationMessages(user);
  assert.ok(messages.some((message) => message.includes('`owner` is not a valid enum value')));
});

test('User JSON output excludes password and reset-code fields', () => {
  const user = new User({
    name: 'Aiman',
    email: 'aiman@example.com',
    password: 'password123',
    resetCodeHash: 'hashed-reset-code',
    resetCodeExpiresAt: new Date('2026-06-10T00:00:00Z')
  });

  const json = user.toJSON();

  assert.equal(json.email, 'aiman@example.com');
  assert.equal('password' in json, false);
  assert.equal('resetCodeHash' in json, false);
  assert.equal('resetCodeExpiresAt' in json, false);
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

test('Trip accepts planner-shaped days, stops, idea bank, and defaults status', async () => {
  const trip = new Trip({
    userEmail: 'TRAVELLER@EXAMPLE.COM',
    name: 'Green Weekend',
    city: 'Penang',
    start: new Date('2026-06-10'),
    end: new Date('2026-06-12'),
    days: [
      {
        date: '2026-06-10',
        stops: [
          {
            time: '09:00',
            icon: 'leaf',
            name: 'Bike to breakfast',
            sub: 'Use a shared bike',
            carbon: 0.5,
            location: { lat: 5.416, lng: 100.332, address: 'George Town' }
          }
        ]
      }
    ],
    ideaBank: [
      { name: 'Refill station', carbon: 0 }
    ]
  });

  const messages = await getValidationMessages(trip);

  assert.deepEqual(messages, []);
  assert.equal(trip.userEmail, 'traveller@example.com');
  assert.equal(trip.status, 'planned');
  assert.equal(trip.days[0].stops[0].name, 'Bike to breakfast');
  assert.equal(trip.ideaBank[0].name, 'Refill station');
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
