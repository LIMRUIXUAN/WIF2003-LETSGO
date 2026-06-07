const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const User = require('../models/User');// ini using for standardise the User json format
const Trip = require('../models/Trip');
const { requireAuth, requireSelfEmail, signToken } = require('../middleware/auth');
const { getCache, setCache, delCache } = require('../utils/redis');

const USER_PROFILE_TTL = 60 * 10; // 10 minutes

const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many profile update attempts. Please try again later.'
  }
});

function validateAvatarBase64(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) return null;
  if (value.length > 2 * 1024 * 1024) return null;

  const type = match[1].toLowerCase();
  const payload = match[2];
  if (payload.length % 4 === 1) return null;

  const bytes = Buffer.from(payload, 'base64');
  if (!bytes.length) return null;

  const isPng = type === 'png'
    && bytes.length >= 8
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47;
  const isJpeg = (type === 'jpeg' || type === 'jpg')
    && bytes.length >= 3
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff;
  const isGif = type === 'gif'
    && bytes.length >= 6
    && (bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a');
  const isWebp = type === 'webp'
    && bytes.length >= 12
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP';

  if (!isPng && !isJpeg && !isGif && !isWebp) return null;
  return value;
}

// GET endpoint to fetch a user's profile by their email
router.get('/profile/:email', requireAuth, requireSelfEmail, async (req, res) => {
    try {
        const email = String(req.params.email || '').trim().toLowerCase();

        // Check Redis cache first
        const cacheKey = `cache:user:profile:${email}`;
        const cached = await getCache(cacheKey);
        if (cached) {
            console.log(`[Redis] Cache Hit: ${cacheKey}`);
            return res.json(cached);
        }

        // 1. Ask MongoDB to find the user
        const user = await User.findOne({ email: email });
        
        // 2. If no user exists, send an error
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        
        // 3. Cache and return the result
        const payload = { success: true, data: user };
        await setCache(cacheKey, payload, USER_PROFILE_TTL);

        res.json(payload);
        
    } catch (err) {
        res.status(500).json({ success: false, error: 'Internal server error.' });
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
        if (!Number.isInteger(destinationId) || destinationId <= 0) {
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
        // Invalidate cached profile since favorites changed
        await delCache(`cache:user:profile:${email}`);
        res.json({ success: true, action: action, favorites: user.favorites});
    }catch (err){
        console.error('Favorite Toggle Error:', err);
        res.status(500).json({ success: false, message: 'Server error'});
    }
});

router.put('/:email/interests', profileUpdateLimiter, requireAuth, requireSelfEmail, async (req, res) => {
    try {
        const email = String(req.params.email || '').trim().toLowerCase();
        const interests = req.body.interests;

        if (!Array.isArray(interests)) {
            return res.status(400).json({ success: false, message: 'Interests must be an array.' });
        }

        const normalizedInterests = [...new Set(
            interests
                .map(interest => String(interest || '').trim())
                .filter(Boolean)
        )];

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: { interests: normalizedInterests } },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        await delCache(`cache:user:profile:${email}`);

        res.json({
            success: true,
            data: updatedUser
        });
    } catch (err) {
        console.error('Interest Save Error:', err);
        res.status(500).json({ success: false, message: 'Server error while saving interests.' });
    }
});

router.put('/:email/password', profileUpdateLimiter, requireAuth, requireSelfEmail, async (req, res) => {
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
        // Invalidate cached profile since credentials changed
        await delCache(`cache:user:profile:${email}`);

        res.json({
            success: true,
            message: 'Password updated successfully.',
            token: signToken(user)
        });
    } catch (error) {
        console.error('Password Change Error:', error);
        res.status(500).json({ success: false, message: 'Server error while changing password.' });
    }
});

router.put('/:email', profileUpdateLimiter, requireAuth, requireSelfEmail, async (req, res) => {
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
            avatar:       (() => {
                if (req.body.avatar === undefined) return undefined;
                const validated = validateAvatarBase64(req.body.avatar);
                if (validated === null) {
                    res.status(400).json({ success: false, message: 'Invalid avatar format. Must be a PNG, JPEG, GIF, or WebP image under 2MB.' });
                    return '__INVALID__';
                }
                return validated;
            })(),
            interests:    req.body.interests,
            notifTrip:    req.body.notifTrip,
            notifEco:     req.body.notifEco,
            co2Saved:     req.body.co2Saved,
            co2Footprint: req.body.co2Footprint
        };

        // Early exit if avatar validation failed (response already sent)
        if (updateData.avatar === '__INVALID__') return;

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
            // Invalidate old email profile cache when email changes
            await delCache(`cache:user:profile:${userEmail}`);
        } else {
            await delCache(`cache:user:profile:${userEmail}`);
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
        // Invalidate cached profile on account deletion
        await delCache(`cache:user:profile:${email}`);

        res.json({ success: true, message: 'Account deleted.' });
    } catch (error) {
        console.error('Account Delete Error:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting account.' });
    }
});

module.exports = router;
