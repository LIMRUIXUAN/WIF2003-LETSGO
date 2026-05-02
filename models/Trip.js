const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userEmail: { type: String, required: true }, 
  name: { type: String, required: true },
  city: { type: String },
  start: { type: String },
  end: { type: String },
  style: { type: String },
  days: { type: Array, default: [] },
  ideaBank: { type: Array, default: [] }
}, { 
  timestamps: true //Automatically adds createdAt and updatedAt dates!
});

module.exports = mongoose.model('Trip', tripSchema);