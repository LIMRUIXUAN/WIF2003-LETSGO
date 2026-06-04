const express = require('express');
const Destination = require('../models/Destination');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  buildDestinationMongoQuery,
  extractPriceValue,
  mapDestinationForClient
} = require('../utils/destinationCompat');

const router = express.Router();

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
    const destinations = await fetchDestinations(buildDestinationMongoQuery({
      search: req.query.search,
      category: req.query.category,
      minEco: req.query.minEco
    }));

    const minPrice = req.query.minPrice ? Number.parseInt(req.query.minPrice, 10) : undefined;
    const maxPrice = req.query.maxPrice ? Number.parseInt(req.query.maxPrice, 10) : undefined;
    const filtered = filterByPrice(destinations, minPrice, maxPrice);

    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      success: true,
      count: filtered.length,
      data: filtered
    });
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

    const destinations = await fetchDestinations(buildDestinationMongoQuery({ search: query }));
    const allOptions = new Set();

    destinations.forEach((destination) => {
      if (destination.location.toLowerCase().includes(query)) allOptions.add(destination.location);
      if (destination.category.toLowerCase().includes(query)) allOptions.add(destination.category);
      if (destination.name.toLowerCase().includes(query)) allOptions.add(destination.name);
    });

    return res.json({
      success: true,
      suggestions: Array.from(allOptions).slice(0, 8)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.get('/category/:category', async (req, res) => {
  try {
    const destinations = await fetchDestinations(buildDestinationMongoQuery({
      category: req.params.category
    }));

    res.json({
      success: true,
      count: destinations.length,
      data: destinations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const destinations = await fetchDestinations(buildDestinationMongoQuery({ id: req.params.id }));
    const destination = destinations[0];

    if (!destination) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }

    return res.json({
      success: true,
      data: destination
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

router.post('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const destination = await Destination.create(req.body);

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
