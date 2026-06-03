const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const Destination = require('../models/Destination');

const seedDataPath = path.join(__dirname, '..', 'seed_data.json');

function loadSeedData() {
  return JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));
}

test('seed_data.json contains 30+ valid destination records with sequential IDs', async () => {
  const destinations = loadSeedData();
  const requiredKeys = [
    'id',
    'name',
    'location',
    'category',
    'ecoScore',
    'imageUrl',
    'priceLabel',
    'co2ImpactLabel',
    'icon',
    'rating',
    'description'
  ];

  assert.equal(Array.isArray(destinations), true);
  assert.ok(destinations.length >= 30);

  for (const [index, destination] of destinations.entries()) {
    assert.equal(destination.id, index + 1);
    for (const key of requiredKeys) {
      assert.equal(Object.hasOwn(destination, key), true, `Destination ${destination.id} missing ${key}`);
    }
    assert.ok(Destination.CATEGORIES.includes(destination.category));
    assert.equal(Number.isFinite(destination.ecoScore), true);
    assert.ok(destination.ecoScore >= 0 && destination.ecoScore <= 10);
    assert.equal(Number.isFinite(destination.rating), true);
    assert.ok(destination.rating >= 0 && destination.rating <= 5);

    const model = new Destination(destination);
    await model.validate();
  }
});
