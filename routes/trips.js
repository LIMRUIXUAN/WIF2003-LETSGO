const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { requireAuth, requireSelfEmail } = require('../middleware/auth');
const { getCache, setCache, delCache } = require('../utils/redis');

const TRIPS_TTL = 60 * 15; // 15 minutes

const EMISSION_FACTORS = {
  car_petrol: 0.1405,
  car_diesel: 0.1418,
  car_ev: 0.0449,
  car_hybrid: 0.10,
  motorcycle: 0.103,
  bus: 0.105,
  train_electric: 0.0275,
  klia_ekspres: 0.044,
  flight_short: 0.13,
  flight_long: 0.11,
  ferry: 0.1523,
  bicycle: 0.0,
  walking: 0.0
};

const BASELINE_FACTOR = EMISSION_FACTORS.car_petrol;
const BASELINE_TRANSPORT_MODE = 'car_petrol';

function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1.2;
}

function hasValidCoordinates(location) {
  if (!location) return false;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180;
}

function roundCarbonMetric(value) {
  return Math.round(value * 10) / 10;
}

function resolveTransportMode(transportMode) {
  return EMISSION_FACTORS[transportMode] !== undefined
    ? transportMode
    : BASELINE_TRANSPORT_MODE;
}

function calculateRouteCarbon(stops, transportMode) {
  const resolvedTransportMode = resolveTransportMode(transportMode);
  const factor = EMISSION_FACTORS[resolvedTransportMode];
  let totalDistance = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const current = stops[i].location;
    const next = stops[i + 1].location;
    totalDistance += calculateHaversineDistance(
      Number(current.lat),
      Number(current.lng),
      Number(next.lat),
      Number(next.lng)
    );
  }

  const footprint = totalDistance * factor;
  const baseline = totalDistance * BASELINE_FACTOR;

  return {
    distanceKm: roundCarbonMetric(totalDistance),
    carbonFootprintKg: roundCarbonMetric(footprint),
    baselineFootprintKg: roundCarbonMetric(baseline),
    carbonSavedKg: roundCarbonMetric(baseline - footprint),
    transportMode: resolvedTransportMode
  };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

// ────────────────────────────────────────────────────────────────
// TRIP CRUD (Create, Read, Update, Delete)
// ────────────────────────────────────────────────────────────────

// POST - Create a new trip
router.post('/', requireAuth, async (req, res) => {
  try {
    const userEmail = normalizeEmail(req.authUser.email);
    const trip = await Trip.create({
      ...req.body,
      userEmail
    });
    // Invalidate the user's trips cache after creating a new trip
    await delCache(`cache:user:trips:${userEmail}`);
    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(400).json({ success: false, message: 'Bad request.' });
  }
});

// GET - Get trips for a specific user
router.get('/:email', requireAuth, requireSelfEmail, async (req, res) => {
  try {
    const email = normalizeEmail(req.params.email);

    // Check Redis cache first
    const cacheKey = `cache:user:trips:${email}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[Redis] Cache Hit: ${cacheKey}`);
      return res.json(cached);
    }

    const trips = await Trip.find({ userEmail: email });
    const payload = { success: true, data: trips };

    await setCache(cacheKey, payload, TRIPS_TTL);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// PUT - Update a trip (Used for adding/moving activities)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    const ownerEmail = normalizeEmail(existingTrip.userEmail);
    const tokenEmail = normalizeEmail(req.authUser.email);

    if (ownerEmail !== tokenEmail) {
      return res.status(403).json({ success: false, message: 'You can only update your own trips.' });
    }

    const updatedData = { ...req.body };
    delete updatedData._id;
    updatedData.userEmail = tokenEmail;

    // Find the trip by its ID and overwrite it with the new data
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );
    // Invalidate the user's trips cache after update
    await delCache(`cache:user:trips:${tokenEmail}`);
    res.json({ success: true, data: updatedTrip });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// DELETE - Delete a trip
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    const ownerEmail = normalizeEmail(trip.userEmail);
    const tokenEmail = normalizeEmail(req.authUser.email);

    if (ownerEmail !== tokenEmail) {
      return res.status(403).json({ success: false, message: 'You can only delete your own trips.' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    // Invalidate the user's trips cache after deletion
    await delCache(`cache:user:trips:${tokenEmail}`);
    res.json({ success: true, message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// POST - Calculate dynamic carbon footprint between points
router.post('/calculate-carbon', requireAuth, (req, res) => {
  try {
    const { stops, transportMode } = req.body;
    if (!Array.isArray(stops) || stops.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least two stops are required for route calculations.'
      });
    }

    if (stops.some(stop => !hasValidCoordinates(stop.location))) {
      return res.status(400).json({
        success: false,
        message: 'Each stop must include valid latitude and longitude.'
      });
    }

    return res.json({
      success: true,
      ...calculateRouteCarbon(stops, transportMode)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
module.exports.helpers = {
  calculateHaversineDistance,
  calculateRouteCarbon,
  EMISSION_FACTORS,
  normalizeEmail
};
