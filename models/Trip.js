const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  city: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  style: { type: String },
  stops: [{
    time: String,
    icon: String,
    name: String,
    description: String
  }]
});

module.exports = mongoose.model('Trip', tripSchema);