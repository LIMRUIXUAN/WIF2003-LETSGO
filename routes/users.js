const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Make sure your User model is set up

// GET endpoint to fetch a user's profile by their email
router.get('/profile/:email', async (req, res) => {
    try {
        // 1. Ask MongoDB to find the user
        const targetUser = await User.findOne({ email: req.params.email });
        
        // 2. If no user exists, send an error
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // 3. If found, send the data back as JSON
        res.json({ success: true, data: targetUser });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;