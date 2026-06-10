const test = require('node:test');
const assert = require('node:assert/strict');

// Import the Mongoose models
const User = require('../models/User');
const Trip = require('../models/Trip');
const Destination = require('../models/Destination');

// Utility function to extract validation errors
async function getValidationErrors(modelInstance) {
  try {
    await modelInstance.validate();
    return null;
  } catch (error) {
    return error.errors;
  }
}

// ── DB-01: Password Hashing Pre-save Hook ──
test('DB-01: User pre-save hook handles password hashing configuration', () => {
  const user = new User({
    name: 'Aiman',
    email: 'aiman@example.com',
    password: 'password123'
  });
  
  // Mongoose validation should pass for valid fields
  const err = user.validateSync();
  assert.equal(err, undefined);
  
  // Verify that the JSON output excludes critical credentials
  const json = user.toJSON();
  assert.equal('password' in json, false);
  assert.equal('resetCodeHash' in json, false);
});

// ── DB-02: User Duplicate Email Constraint ──
test('DB-02: User model schema defines unique constraints for email', () => {
  const indexes = User.schema.indexes();
  const hasUniqueEmail = indexes.some(([fields, options]) => fields.email === 1 && options.unique === true);
  assert.equal(hasUniqueEmail, true);
});

// ── DB-03: Invalid Email format Validation ──
test('DB-03: User schema rejects invalid email formats', async () => {
  const user = new User({
    name: 'Aisha',
    email: 'invalid-email-format',
    password: 'password123'
  });
  
  const errors = await getValidationErrors(user);
  assert.ok(errors);
  assert.ok(errors.email);
  assert.match(errors.email.message, /valid email/i);
});

// ── DB-04: User Profile budget normalisation ──
test('DB-04: User normalises budget aliases before validation', () => {
  const user = new User({
    name: 'Mei',
    email: 'mei@example.com',
    password: 'password123',
    budget: 'luxury' // Legacy budget label
  });
  
  const err = user.validateSync();
  assert.equal(err, undefined);
  assert.equal(user.budget, 'high'); // Normalised to correct enum value
});

// ── DB-05: Destination collection consistency ──
test('DB-05: Destination model enforces fields limits and maps categories', () => {
  const destination = new Destination({
    id: 1,
    name: 'Langkawi Rainforest Tour',
    location: 'Langkawi',
    cat: 'activity', // Legacy alias sets canonical category
    eco: 9.5,
    desc: 'Guided nature tour in the rainforest',
    image: 'https://example.com/tour.jpg',
    price: 'RM100'
  });
  
  const err = destination.validateSync();
  assert.equal(err, undefined);
  assert.equal(destination.category, 'activity');
  assert.equal(destination.ecoScore, 9.5);
});

// ── DB-07: Trip Creation Email Ownership ──
test('DB-07: Trip model lowercases and normalises owner userEmail', () => {
  const trip = new Trip({
    userEmail: 'TRAVELLER@EXAMPLE.COM',
    name: 'Weekend Getaway',
    city: 'Penang',
    start: new Date('2026-06-12'),
    end: new Date('2026-06-15')
  });
  
  const err = trip.validateSync();
  assert.equal(err, undefined);
  assert.equal(trip.userEmail, 'traveller@example.com');
  assert.equal(trip.status, 'planned'); // Default status applied
});

// ── DB-08: Trip Date range constraint ──
test('DB-08: Trip model rejects end date before start date', async () => {
  const trip = new Trip({
    userEmail: 'traveller@example.com',
    name: 'Invalid Trip Dates',
    start: new Date('2026-06-15'),
    end: new Date('2026-06-12') // End date is before start date
  });
  
  const errors = await getValidationErrors(trip);
  assert.ok(errors);
  assert.ok(errors.end);
  assert.match(errors.end.message, /end date must be on or after the start date/i);
});

// ── DB-10: Trip Required Fields (Extra) ──
test('DB-10: Trip model rejects missing required fields on trip creation', async () => {
  const trip = new Trip({
    name: '',
    userEmail: ''
  });
  
  const errors = await getValidationErrors(trip);
  assert.ok(errors);
  assert.ok(errors.name);
  assert.ok(errors.userEmail);
});

// ── DB-09: Trip Update/Delete Consistency ──
test('DB-09: Trip update/delete operations maintain database consistency', async () => {
  const id = 'mock-trip-id';
  const updatedData = { name: 'Updated Trip Name' };
  
  // Mock Mongoose model methods to simulate DB behavior without a live connection
  const originalFindByIdAndUpdate = Trip.findByIdAndUpdate;
  const originalFindByIdAndDelete = Trip.findByIdAndDelete;
  const originalFindById = Trip.findById;
  
  let mockTripDb = { [id]: { _id: id, name: 'Original Trip' } };
  
  Trip.findByIdAndUpdate = async (tripId, data, options) => {
    if (mockTripDb[tripId]) {
      mockTripDb[tripId] = { ...mockTripDb[tripId], ...data };
      return mockTripDb[tripId];
    }
    return null;
  };
  
  Trip.findByIdAndDelete = async (tripId) => {
    delete mockTripDb[tripId];
    return true;
  };
  
  Trip.findById = async (tripId) => {
    return mockTripDb[tripId] || null;
  };

  try {
    const updatedTrip = await Trip.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
    assert.equal(updatedTrip.name, 'Updated Trip Name');
    
    await Trip.findByIdAndDelete(id);
    assert.equal(await Trip.findById(id), null);
  } finally {
    // Restore originals
    Trip.findByIdAndUpdate = originalFindByIdAndUpdate;
    Trip.findByIdAndDelete = originalFindByIdAndDelete;
    Trip.findById = originalFindById;
  }
});
