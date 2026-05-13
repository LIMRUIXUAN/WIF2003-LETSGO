const mongoose = require('mongoose');

const DESTINATION_CATEGORIES = ['hotel', 'restaurant', 'transport', 'activity'];

const destinationSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: [true, 'Destination display ID is required.'],
    unique: true,
    index: true,
    min: 1
  },
  name: {
    type: String,
    required: [true, 'Destination name is required.'],
    trim: true,
    maxlength: [160, 'Destination name must be 160 characters or fewer.']
  },
  location: {
    type: String,
    required: [true, 'Destination location is required.'],
    trim: true,
    maxlength: [160, 'Destination location must be 160 characters or fewer.']
  },
  country: { type: String, trim: true, default: 'Malaysia' },
  cat: {
    type: String,
    required: [true, 'Destination category is required.'],
    enum: DESTINATION_CATEGORIES,
    trim: true,
    alias: 'category'
  },
  eco: {
    type: Number,
    required: [true, 'Eco score is required.'],
    min: 0,
    max: 10,
    alias: 'ecoScore'
  },
  sustainability: { type: String, trim: true, default: '' },
  co2: { type: String, trim: true, default: '', alias: 'co2Impact' },
  price: { type: String, trim: true, default: '' },
  icon: { type: String, trim: true, default: '' },
  image: { type: String, trim: true, default: '' },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  desc: {
    type: String,
    required: [true, 'Destination description is required.'],
    trim: true,
    maxlength: [2000, 'Destination description must be 2000 characters or fewer.'],
    alias: 'description'
  },
  lat: { type: Number, min: -90, max: 90 },
  lon: { type: Number, min: -180, max: 180 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Destination', destinationSchema);
