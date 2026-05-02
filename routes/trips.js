const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const Trip = require('../models/Trip');

// ────────────────────────────────────────────────────────────────
// 1. DESTINATIONS (For Explore Flip Cards)
// ────────────────────────────────────────────────────────────────

// POST - Create a new trip
router.post('/', async (req, res) => {
  try {
    const trip = await Trip.create(req.body);
    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET - Get trips for a specific user
router.get('/:email', async (req, res) => {
  try {
    const trips = await Trip.find({ userEmail: req.params.email });
    res.json({ success: true, data: trips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT - Update a trip (Used for adding/moving activities)
router.put('/:id', async (req, res) => {
  try {
    const updatedData = { ...req.body };
    delete updatedData._id;

    // Find the trip by its ID and overwrite it with the new data
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id, 
      updatedData,
      { new: true }
    );
    res.json({ success: true, data: updatedTrip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE - Delete a trip
router.delete('/:id', async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;