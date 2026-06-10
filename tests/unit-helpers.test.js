const test = require('node:test');
const assert = require('node:assert/strict');

// UT-01 & UT-02 Precondition
const { helpers: authHelpers } = require("../routes/auth");

test("short password is rejected", () => {
  assert.match(authHelpers.validatePasswordLength("abc123"), /at least 8 characters/);
});

test("valid password length passes", () => {
  assert.equal(authHelpers.validatePasswordLength("password123"), "");
});


// UT-03, UT-04 & UT-05 Precondition
const { helpers: tripHelpers } = require("../routes/trips");

test("email is normalised", () => {
  assert.equal(tripHelpers.normalizeEmail("  Demo@EcoPlanner.COM  "), "demo@ecoplanner.com");
});

test("carbon calculation for walking route", () => {
  const stops = [
    { location: { lat: 3.1579, lng: 101.7116 } }, // KLCC coordinates
    { location: { lat: 3.1491, lng: 101.6960 } }  // Merdeka Square coordinates
  ];
  const result = tripHelpers.calculateRouteCarbon(stops, "walking");
  assert.equal(result.transportMode, "walking");
  assert.equal(result.carbonFootprintKg, 0);
  assert.ok(result.distanceKm > 0);
});

test("unknown transport mode fallback", () => {
  const stops = [
    { location: { lat: 3.1579, lng: 101.7116 } }, // KLCC coordinates
    { location: { lat: 3.1491, lng: 101.6960 } }  // Merdeka Square coordinates
  ];
  const result = tripHelpers.calculateRouteCarbon(stops, "spaceship");
  assert.equal(result.transportMode, "car_petrol");
  assert.ok(result.carbonFootprintKg >= 0);
});


// UT-06 Precondition
const { helpers: destHelpers } = require("../routes/destinations");

test("destination price filter", () => {
  const destinations = [
    { id: 1, name: "Budget Spot", priceLabel: "RM20" },
    { id: 2, name: "Medium Spot", priceLabel: "RM80" },
    { id: 3, name: "Luxury Spot", priceLabel: "RM200" }
  ];
  const filtered = destHelpers.filterByPrice(destinations, 50, 150);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].priceLabel, "RM80");
});
