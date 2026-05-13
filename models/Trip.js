const mongoose = require('mongoose');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const locationSchema = new mongoose.Schema({
  lat: { type: Number, min: -90, max: 90 },
  lng: { type: Number, min: -180, max: 180 },
  address: { type: String, trim: true, default: '' }
}, { _id: false });

const stopSchema = new mongoose.Schema({
  time: { type: String, trim: true, default: 'Flexible' },
  icon: { type: String, trim: true, default: '' },
  name: {
    type: String,
    required: [true, 'Activity name is required.'],
    trim: true,
    maxlength: [160, 'Activity name must be 160 characters or fewer.']
  },
  sub: { type: String, trim: true, default: '' },
  carbon: { type: Number, min: 0, default: 0 },
  source: { type: String, trim: true, default: '' },
  location: { type: locationSchema, default: undefined }
}, { _id: false });

const tripDaySchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Trip day date is required.'],
    trim: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Trip day date must use YYYY-MM-DD format.']
  },
  stops: { type: [stopSchema], default: [] }
}, { _id: false });

const tripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userEmail: {
    type: String,
    required: [true, 'User email is required.'],
    lowercase: true,
    trim: true,
    match: [EMAIL_REGEX, 'Please enter a valid user email address.'],
    index: true
  },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },
  destinationId: { type: Number, min: 1 },
  name: {
    type: String,
    required: [true, 'Trip name is required.'],
    trim: true,
    maxlength: [160, 'Trip name must be 160 characters or fewer.']
  },
  city: { type: String, trim: true, default: '' },
  start: { type: Date },
  end: { type: Date },
  style: { type: String, trim: true, default: '' },
  travelers: { type: Number, min: 1, default: 1 },
  budget: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned'
  },
  days: { type: [tripDaySchema], default: [] },
  ideaBank: { type: [stopSchema], default: [] }
}, {
  timestamps: true
});

tripSchema.pre('validate', function validateDateRange() {
  if (this.start && this.end && this.end < this.start) {
    this.invalidate('end', 'Trip end date must be on or after the start date.');
  }
});

module.exports = mongoose.model('Trip', tripSchema);
