// File: routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST: /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Check if the email is already in the database
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        // 2. Create the new user object
        const newUser = new User({
            name: name,
            email: email,
            password: password // Phase 2 upgrade: We will use bcrypt to encrypt this later
        });

        // 3. Save to MongoDB
        await newUser.save();

        res.status(201).json({ success: true, message: 'Account created successfully!' });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

// POST: /api/auth/login
// ini will act as security guard checking if user's credentials match what is in MongoDB
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user in the database
        const user = await User.findOne({ email: email });

        // 2. Check if user exists AND password matches
        // (Note: In a real app, we would use bcrypt.compare here)
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // 3. If successful, send the user data back to the browser
        res.json({ 
            success: true, 
            message: 'Login successful!', 
            email: user.email, 
            name: user.name 
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});
module.exports = router;