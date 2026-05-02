const express = require('express');
const router = express.Router();

// Mock in-memory storage for user favorites
// In production, this would be stored in MongoDB
const userFavorites = {};

/**
 * GET /api/favorites
 * Get all favorites for the logged-in user
 * Requires: userId in query or header
 */
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }
    
    const favorites = userFavorites[userId] || [];
    
    res.json({
      success: true,
      userId: userId,
      count: favorites.length,
      favoriteIds: favorites
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/favorites
 * Add a destination to user favorites
 * Body: { destinationId: number }
 * Query: userId=<userId> or Header: x-user-id
 */
router.post('/', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    const { destinationId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }
    
    if (!destinationId && destinationId !== 0) {
      return res.status(400).json({ success: false, error: 'destinationId required' });
    }
    
    if (!userFavorites[userId]) {
      userFavorites[userId] = [];
    }
    
    if (!userFavorites[userId].includes(destinationId)) {
      userFavorites[userId].push(destinationId);
    }
    
    res.json({
      success: true,
      message: `Destination ${destinationId} added to favorites`,
      userId: userId,
      favoriteIds: userFavorites[userId]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/favorites/:destinationId
 * Remove a destination from user favorites
 * Query: userId=<userId> or Header: x-user-id
 */
router.delete('/:destinationId', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    const { destinationId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }
    
    if (!userFavorites[userId]) {
      return res.status(404).json({ success: false, error: 'No favorites found for this user' });
    }
    
    userFavorites[userId] = userFavorites[userId].filter(id => id !== parseInt(destinationId));
    
    res.json({
      success: true,
      message: `Destination ${destinationId} removed from favorites`,
      userId: userId,
      favoriteIds: userFavorites[userId]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/favorites
 * Clear all favorites for a user
 * Query: userId=<userId> or Header: x-user-id
 */
router.delete('/', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }
    
    userFavorites[userId] = [];
    
    res.json({
      success: true,
      message: 'All favorites cleared',
      userId: userId,
      favoriteIds: []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
