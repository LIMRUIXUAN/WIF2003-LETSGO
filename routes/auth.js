const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const { sendMail } = require('../utils/mailer');

function hashResetCode(code) {
    return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function createResetCode() {
    return crypto.randomInt(100000, 1000000).toString();
}

// POST: /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

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
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

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

// POST: /api/auth/password-reset/request
router.post('/password-reset/request', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ success: false, message: "You haven't created an account yet." });
        }

        const code = createResetCode();
        const ttlMinutes = Number(process.env.RESET_CODE_TTL_MINUTES || 10);
        user.resetCodeHash = hashResetCode(code);
        user.resetCodeExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        await user.save();

        await sendMail({
            to: user.email,
            subject: 'EcoPlanner password reset code',
            text: [
                `Hi ${user.name},`,
                '',
                `Your EcoPlanner password reset code is: ${code}`,
                '',
                `This code expires in ${ttlMinutes} minutes.`,
                'If you did not request this, you can ignore this email.',
                '',
                'EcoPlanner'
            ].join('\n')
        });

        res.json({
            success: true,
            message: 'Verification code sent to your email.',
            expiresInMinutes: ttlMinutes
        });
    } catch (error) {
        console.error("Password Reset Request Error:", error);
        res.status(500).json({
            success: false,
            message: error.message.includes('Missing email setup')
                ? 'Email verification is not available yet. Please contact the system admin.'
                : 'Server error while sending verification email.'
        });
    }
});

// POST: /api/auth/password-reset/confirm
router.post('/password-reset/confirm', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const code = String(req.body.code || '').trim();
        const password = String(req.body.password || '');

        if (!email || !code || !password) {
            return res.status(400).json({ success: false, message: 'Email, code, and new password are required.' });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({ success: false, message: 'Verification code must be 6 digits.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        }

        const user = await User.findOne({ email: email });
        if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
            return res.status(400).json({ success: false, message: 'Please request a new verification code.' });
        }

        if (Date.now() > user.resetCodeExpiresAt.getTime()) {
            user.resetCodeHash = '';
            user.resetCodeExpiresAt = null;
            await user.save();
            return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new one.' });
        }

        if (user.resetCodeHash !== hashResetCode(code)) {
            return res.status(400).json({ success: false, message: 'Invalid verification code.' });
        }

        user.password = password;
        user.resetCodeHash = '';
        user.resetCodeExpiresAt = null;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully. Please sign in.' });
    } catch (error) {
        console.error("Password Reset Confirm Error:", error);
        res.status(500).json({ success: false, message: 'Server error while resetting password.' });
    }
});

module.exports = router;
