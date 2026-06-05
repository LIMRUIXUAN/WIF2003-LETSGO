const express = require('express');
const Destination = require('../models/Destination');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  buildDestinationMongoQuery,
  extractPriceValue,
  mapDestinationForClient
} = require('../utils/destinationCompat');
const { getCache, setCache, delCachePattern } = require('../utils/redis');

const router = express.Router();

const DEST_TTL = 60 * 60; // 1 hour

async function fetchDestinations(query = {}) {
  const documents = await Destination.find(query).sort({ id: 1 }).lean();
  return documents.map(mapDestinationForClient);
}

function filterByPrice(destinations, minPrice, maxPrice) {
  if (minPrice === undefined && maxPrice === undefined) {
    return destinations;
  }

  return destinations.filter((destination) => {
    const price = extractPriceValue(destination.priceLabel);

    if (minPrice !== undefined && price < minPrice) {
      return false;
    }

    if (maxPrice !== undefined && price > maxPrice) {
      return false;
    }

    return true;
  });
}

router.get('/', async (req, res) => {
  try {
    const { search, category, minEco, minPrice, maxPrice } = req.query;

    // Build a deterministic cache key from the query params
    const cacheKey = `cache:destinations:list:${search || ''}:${category || ''}:${minEco || ''}:${minPrice || ''}:${maxPrice || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[Redis] Cache Hit: ${cacheKey}`);
      return res.json(cached);
    }

    const destinations = await fetchDestinations(buildDestinationMongoQuery({ search, category, minEco }));

    const minPriceNum = minPrice ? Number.parseInt(minPrice, 10) : undefined;
    const maxPriceNum = maxPrice ? Number.parseInt(maxPrice, 10) : undefined;
    const filtered = filterByPrice(destinations, minPriceNum, maxPriceNum);

    const payload = { success: true, count: filtered.length, data: filtered };
    await setCache(cacheKey, payload, DEST_TTL);

    res.set('Cache-Control', 'public, max-age=300');
    res.json(payload);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.get('/search/suggestions', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim().toLowerCase();

    if (!query) {
      return res.json({ success: true, suggestions: [] });
    }

    const cacheKey = `cache:destinations:suggest:${query}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[Redis] Cache Hit: ${cacheKey}`);
      return res.json(cached);
    }

    const destinations = await fetchDestinations(buildDestinationMongoQuery({ search: query }));
    const allOptions = new Set();

    destinations.forEach((destination) => {
      if (destination.location.toLowerCase().includes(query)) allOptions.add(destination.location);
      if (destination.category.toLowerCase().includes(query)) allOptions.add(destination.category);
      if (destination.name.toLowerCase().includes(query)) allOptions.add(destination.name);
    });

    const payload = { success: true, suggestions: Array.from(allOptions).slice(0, 8) };
    await setCache(cacheKey, payload, DEST_TTL);

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.get('/category/:category', async (req, res) => {
  try {
    const cacheKey = `cache:destinations:cat:${req.params.category}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[Redis] Cache Hit: ${cacheKey}`);
      return res.json(cached);
    }

    const destinations = await fetchDestinations(buildDestinationMongoQuery({
      category: req.params.category
    }));

    const payload = { success: true, count: destinations.length, data: destinations };
    await setCache(cacheKey, payload, DEST_TTL);

    res.json(payload);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `cache:destinations:id:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[Redis] Cache Hit: ${cacheKey}`);
      return res.json(cached);
    }

    const destinations = await fetchDestinations(buildDestinationMongoQuery({ id: req.params.id }));
    const destination = destinations[0];

    if (!destination) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }

    const payload = { success: true, data: destination };
    await setCache(cacheKey, payload, DEST_TTL);

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const destination = await Destination.create(req.body);
    // Invalidate all destination caches after a new destination is created
    await delCachePattern('cache:destinations:*');

    return res.status(201).json({
      success: true,
      data: mapDestinationForClient(destination.toObject())
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Could not create destination.'
    });
  }
});

router.put('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const destination = await Destination.findOneAndUpdate(
      buildDestinationMongoQuery({ id: req.params.id }),
      req.body,
      { new: true, runValidators: true }
    ).lean();

    if (!destination) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }

    // Invalidate all destination caches after an update
    await delCachePattern('cache:destinations:*');

    return res.json({
      success: true,
      data: mapDestinationForClient(destination)
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Could not update destination.'
    });
  }
});

router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const destination = await Destination.findOneAndDelete(
      buildDestinationMongoQuery({ id: req.params.id })
    ).lean();

    if (!destination) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }

    // Invalidate all destination caches after deletion
    await delCachePattern('cache:destinations:*');

    return res.json({
      success: true,
      data: mapDestinationForClient(destination)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
module.exports.helpers = {
  fetchDestinations,
  filterByPrice
};
