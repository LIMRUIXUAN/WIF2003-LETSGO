const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const Trip = require('../models/Trip');
const { requireAuth, requireSelfEmail } = require('../middleware/auth');

// ────────────────────────────────────────────────────────────────
// TRIP CRUD (Create, Read, Update, Delete)
// ────────────────────────────────────────────────────────────────

// POST - Create a new trip
router.post('/', requireAuth, async (req, res) => {
  try {
    const userEmail = String(req.authUser.email || '').trim().toLowerCase();
    const trip = await Trip.create({
      ...req.body,
      userEmail
    });
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
    const email = String(req.params.email || '').trim().toLowerCase();
    const trips = await Trip.find({ userEmail: email });
    res.json({ success: true, data: trips });
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
    if (existingTrip.userEmail !== req.authUser.email) {
      return res.status(403).json({ success: false, message: 'You can only update your own trips.' });
    }

    const updatedData = { ...req.body };
    delete updatedData._id;
    updatedData.userEmail = req.authUser.email;

    // Find the trip by its ID and overwrite it with the new data
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );
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
    if (trip.userEmail !== req.authUser.email) {
      return res.status(403).json({ success: false, message: 'You can only delete your own trips.' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
