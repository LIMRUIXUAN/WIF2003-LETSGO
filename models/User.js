const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In a real app, we would hash this
    interests: [{ type: String }], // e.g., ['Nature', 'Cycling']
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);