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
  category: {
    type: String,
    required: [true, 'Destination category is required.'],
    enum: DESTINATION_CATEGORIES,
    trim: true,
    index: true
  },
  ecoScore: {
    type: Number,
    required: [true, 'Eco score is required.'],
    min: 0,
    max: 10
  },
  sustainability: { type: String, trim: true, default: '' },
  co2ImpactLabel: { type: String, trim: true, default: '' },
  priceLabel: { type: String, trim: true, default: '' },
  icon: { type: String, trim: true, default: '' },
  imageUrl: {
    type: String,
    required: [true, 'Primary image URL is required.'],
    trim: true,
    validate: {
      validator: (value) => typeof value === 'string' && value.trim().length > 0,
      message: 'Primary image URL is required.'
    }
  },
  rating: { type: Number, min: 0, max: 5 },
  description: {
    type: String,
    required: [true, 'Destination description is required.'],
    trim: true,
    maxlength: [2000, 'Destination description must be 2000 characters or fewer.']
  },
  lat: { type: Number, min: -90, max: 90 },
  lon: { type: Number, min: -180, max: 180 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

destinationSchema.virtual('cat')
  .get(function getCat() { return this.category; })
  .set(function setCat(value) { this.category = value; });

destinationSchema.virtual('eco')
  .get(function getEco() { return this.ecoScore; })
  .set(function setEco(value) { this.ecoScore = value; });

destinationSchema.virtual('desc')
  .get(function getDesc() { return this.description; })
  .set(function setDesc(value) { this.description = value; });

destinationSchema.virtual('image')
  .get(function getImage() { return this.imageUrl; })
  .set(function setImage(value) { this.imageUrl = value; });

destinationSchema.virtual('co2')
  .get(function getCo2() { return this.co2ImpactLabel; })
  .set(function setCo2(value) { this.co2ImpactLabel = value; });

destinationSchema.virtual('price')
  .get(function getPrice() { return this.priceLabel; })
  .set(function setPrice(value) { this.priceLabel = value; });

destinationSchema.pre('validate', function validateCoordinates() {
  const hasLat = this.lat !== undefined && this.lat !== null;
  const hasLon = this.lon !== undefined && this.lon !== null;

  if (hasLat !== hasLon) {
    this.invalidate('lat', 'Latitude and longitude must both be provided together.');
    this.invalidate('lon', 'Latitude and longitude must both be provided together.');
  }
});

destinationSchema.index({ name: 'text', location: 'text' });

destinationSchema.statics.CATEGORIES = DESTINATION_CATEGORIES;

module.exports = mongoose.model('Destination', destinationSchema);
