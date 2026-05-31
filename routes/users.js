const express = require('express');
const router = express.Router();
const User = require('../models/User');// ini using for standardise the User json format
const Trip = require('../models/Trip');
const { requireAuth, requireSelfEmail, signToken } = require('../middleware/auth');

// GET endpoint to fetch a user's profile by their email
router.get('/profile/:email', requireAuth, requireSelfEmail, async (req, res) => {
    try {
        const email = String(req.params.email || '').trim().toLowerCase();
        // 1. Ask MongoDB to find the user
        const user = await User.findOne({ email: email });
        
        // 2. If no user exists, send an error
        if (!user) return res.status(404).json({ success: false, message: 'User not found, there got invalid route 404 yeah bang'})
        
        // 3. If found, send the data back as JSON
        res.json({ success: true, data: user});
        
    } catch (err) {
        res.status(500).json({ success: false, error: err.message});
    }
});

// PUT utk Toggle a favorite destination ID info
router.put('/:email/favorites', requireAuth, requireSelfEmail, async (req, res) =>{
    try{
         // 1. Ask MongoDB to find the user actually copy and paste upper part lah
        const destinationId = Number(req.body.destinationId);
        const email = String(req.params.email || '').trim().toLowerCase();
        const user = await User.findOne({ email: email });

        // 2. If no user exists, send an error
        if(!user) return res.status(404).json({ success:false, message: 'User not found'});
        if (!Number.isInteger(destinationId) || destinationId < 0) {
            return res.status(400).json({ success: false, message: 'Valid destinationId is required' });
        }

        // 3. Check jika the destinationId got at least one favorites array
        const isFavorite = user.favorites.includes(destinationId);
        let action = '';

        if(isFavorite){
            // It exists! Remove it from the array.
            user.favorites = user.favorites.filter(id => id !== destinationId);
            action = 'removed';
        }else{
            // if favorite doesn't exist u kena, gurau je just add it to the array.
            user.favorites.push(destinationId);
            action = 'added';
        }

        await user.save();
        res.json({ success: true, action: action, favorites: user.favorites});
    }catch (err){
        console.error('Favorite Toggle Error:', err);
        res.status(500).json({ success: false, message: 'Server error'});
    }
});

router.put('/:email/password', requireAuth, requireSelfEmail, async (req, res) => {
    try {
        const email = String(req.params.email || '').trim().toLowerCase();
        const currentPassword = String(req.body.currentPassword || '');
        const newPassword = String(req.body.newPassword || '');

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const passwordMatches = await user.comparePassword(currentPassword);
        if (!passwordMatches) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Password Change Error:', error);
        res.status(500).json({ success: false, message: 'Server error while changing password.' });
    }
});

router.put('/:email', requireAuth, requireSelfEmail, async (req, res) => {
    try {
        const userEmail = String(req.params.email || '').trim().toLowerCase();

        // Map the fields allowed to be updated from the frontend
        const requestedEmail = req.body.email === undefined
            ? undefined
            : String(req.body.email || '').trim().toLowerCase();

        const updateData = {
            name:         req.body.name,
            email:        requestedEmail,
            city:         req.body.city,
            budget:       req.body.budget === undefined ? undefined : User.normalizeBudget(req.body.budget),
            avatar:       req.body.avatar,
            interests:    req.body.interests,
            notifTrip:    req.body.notifTrip,
            notifEco:     req.body.notifEco,
            co2Saved:     req.body.co2Saved,
            co2Footprint: req.body.co2Footprint
        };

        // Remove undefined fields so partial updates don't wipe existing values
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

        // Find the user and update, returning the new version
        const updatedUser = await User.findOneAndUpdate(
            { email: userEmail },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found in database." });
        }

        if (requestedEmail && requestedEmail !== userEmail) {
            await Trip.updateMany({ userEmail }, { $set: { userEmail: requestedEmail } });
        }

        res.json({
            success: true,
            data: updatedUser,
            token: requestedEmail && requestedEmail !== userEmail ? signToken(updatedUser) : undefined
        });

    } catch (error) {
        console.error("Backend Profile Update Error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }
        res.status(500).json({ success: false, message: "Server error while saving profile." });
    }
});

router.delete('/:email', requireAuth, requireSelfEmail, async (req, res) => {
    try {
        const email = String(req.params.email || '').trim().toLowerCase();
        const user = await User.findOneAndDelete({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        await Trip.deleteMany({ userEmail: email });

        res.json({ success: true, message: 'Account deleted.' });
    } catch (error) {
        console.error('Account Delete Error:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting account.' });
    }
});

module.exports = router;
