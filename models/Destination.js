const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['hotel', 'restaurant', 'transport', 'activity'] },
  ecoScore: { type: Number, min: 0, max: 10 },
  co2Impact: { type: String },
  price: { type: String },
  icon: { type: String },
  rating: { type: Number },
  description: { type: String },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true }
});

module.exports = mongoose.model('Destination', destinationSchema);