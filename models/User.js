// File: models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Basic Auth Info (Cha Zi Yu's buat ni)
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // later bagi hashing for security ah
    
    // Profile & Preferences (Rui Xuan buat ni)
    city: { type: String, default: '' },
    budget: { type: String, default: 'mid' },
    interests: { type: [String], default: [] },
    co2Saved: { type: Number, default: 0 },
    notifTrip: { type: Boolean, default: true },
    notifEco: { type: Boolean, default: false },
    
    // Favorites (Jin Xiang & Ye Qinglan's punya part)
    // This stores an array of destination IDs (macam this format [1, 5, 12] ai generated punya example just looking like that)
    favorites: { type: [Number], default: [], 
    avatar: {type: String, default: ''}
    } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);