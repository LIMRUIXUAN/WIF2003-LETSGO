const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['hotel', 'restaurant', 'transport', 'activity'] },
  ecoScore: { type: Number, min: 0, max: 10 },
  co2Impact: { type: String }, // e.g., "↓34 kg CO2"
  price: { type: String },
  icon: { type: String },
  rating: { type: Number },
  description: { type: String }
});

module.exports = mongoose.model('Destination', destinationSchema);