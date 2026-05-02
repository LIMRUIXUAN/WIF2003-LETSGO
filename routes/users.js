const express = require('express');
const router = express.Router();
const User = require('../models/User');// ini using for standardise the User json format

// GET endpoint to fetch a user's profile by their email
router.get('/profile/:email', async (req, res) => {
    try {
        // 1. Ask MongoDB to find the user
        const user = await User.findOne({ email: req.params.email});
        
        // 2. If no user exists, send an error
        if (!user) return res.status(404).json({ success: false, message: 'User not found, there got invalid route 404 yeah bang'})
        
        // 3. If found, send the data back as JSON
        res.json({ success: true, data: user});
        
    } catch (err) {
        res.status(500).json({ success: false, error: err.message});
    }
});

// PUT utk Toggle a favorite destination ID info
router.put('/:email/favorites', async (req, res) =>{
    try{
         // 1. Ask MongoDB to find the user actually copy and paste upper part lah
        const {destinationId} = req.body;
        const user = await User.findOne({ email: req.params.email});

        // 2. If no user exists, send an error
        if(!user) return res.status(404).json({ success:false, message: 'User not found'});

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

module.exports = router;