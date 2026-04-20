const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const Trip = require('../models/Trip');

// ────────────────────────────────────────────────────────────────
// 1. DESTINATIONS (For Explore Flip Cards)
// ────────────────────────────────────────────────────────────────

router.get('/destinations', async (req, res) => {
  try {
    const spots = await Destination.find();
    
    // IMPORTANT: Mapping DB names to the names your app.js expects
    // This ensures your Flip Cards don't show "undefined"
    const formattedSpots = spots.map(s => ({
      id: s._id,
      name: s.name,
      location: s.location,
      cat: s.category,
      eco: s.ecoScore,
      price: s.price,
      co2: s.co2Impact,
      icon: s.icon,
      rating: s.rating,
      desc: s.description
    }));

    res.json(formattedSpots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// 2. ITINERARIES (For Trip Planning)
// ────────────────────────────────────────────────────────────────

// POST a new green itinerary
router.post('/itineraries', async (req, res) => {
  const trip = new Trip(req.body);
  try {
    const newTrip = await trip.save();
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE an itinerary by ID
router.delete('/itineraries/:id', async (req, res) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
    if (!deletedTrip) return res.status(404).json({ message: 'Itinerary not found' });
    res.json({ message: 'Itinerary deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;