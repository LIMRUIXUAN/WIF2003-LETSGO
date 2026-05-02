const express = require('express');
const router = express.Router();

// Mock Destination Data (in production, this would come from MongoDB)
const DESTINATIONS = [
  { id:1, name:'Bamboo Eco Resort',        location:'Cameron Highlands', category:'hotel',      ecoScore:9.4, price:'RM 280/night', co2Impact:'↓34 kg CO₂',   icon:'🏕',  rating:4.9, description:'Fully solar-powered mountain retreat with organic gardens and renewable energy systems.' },
  { id:2, name:'Green Roots Cafe',         location:'Kuala Lumpur',      category:'restaurant', ecoScore:8.8, price:'RM 25–60',     co2Impact:'↓8 kg CO₂',    icon:'🍃',  rating:4.7, description:'100% plant-based menu with zero-waste packaging and local organic ingredients sourced daily.' },
  { id:3, name:'EcoBike Rentals',          location:'Penang',            category:'transport',  ecoScore:9.9, price:'RM 15/day',    co2Impact:'Zero Emission', icon:'🚲',  rating:4.8, description:'Electric bikes and traditional cycles for island exploration. Zero emissions, fully renewable charged.' },
  { id:4, name:'Mangrove Kayak Tour',      location:'Langkawi',          category:'activity',   ecoScore:9.2, price:'RM 120/pax',   co2Impact:'↓62 kg CO₂',   icon:'🚣',  rating:4.9, description:'Guided kayak through pristine mangrove forests. Certified sustainable tourism with minimal carbon footprint.' },
  { id:5, name:'Forest Canopy Lodge',      location:'Taman Negara',      category:'hotel',      ecoScore:9.7, price:'RM 450/night', co2Impact:'↓55 kg CO₂',   icon:'🌲',  rating:4.9, description:'Elevated rainforest lodge using 100% renewable energy with solar panels and organic local produce.' },
  { id:6, name:'Vegan Street Bites',       location:'Penang',            category:'restaurant', ecoScore:8.5, price:'RM 8–20',      co2Impact:'↓5 kg CO₂',    icon:'🥗',  rating:4.6, description:'Award-winning vegan hawker stalls using local organic ingredients with zero-waste packaging solutions.' },
  { id:7, name:'Solar Ferry KL–Putrajaya', location:'Kuala Lumpur',      category:'transport',  ecoScore:9.1, price:'RM 8/trip',    co2Impact:'↓22 kg CO₂',   icon:'⛵',  rating:4.5, description:'Solar-powered river ferry connecting city to Putrajaya. Fully renewable energy with minimal emissions.' },
  { id:8, name:'Coral Reef Snorkeling',    location:'Tioman Island',     category:'activity',   ecoScore:8.9, price:'RM 85/pax',    co2Impact:'Zero Impact',   icon:'🐠',  rating:4.8, description:'Marine biologist-guided snorkeling with reef conservation pledge. Zero carbon emissions and sustainable practices.' },
  { id:9, name:'TeaLeaf Organic Hotel',    location:'Cameron Highlands', category:'hotel',      ecoScore:9.3, price:'RM 320/night', co2Impact:'↓48 kg CO₂',   icon:'🌿',  rating:4.8, description:'100% organic certified hotel with solar heating, rainwater harvesting, and local farm-to-table dining.' },
  { id:10, name:'Electric Scooter Tours',  location:'Georgetown',        category:'transport',  ecoScore:9.8, price:'RM 12/tour',   co2Impact:'Zero Emission', icon:'⚡',  rating:4.7, description:'Full-electric scooter tours of historic Georgetown. Zero emissions, renewable energy charging stations.' },
];

/**
 * GET /api/destinations
 * Fetch all destinations or filter by query parameters
 * Query parameters:
 *   - search: search by name, location, or category
 *   - category: filter by category (hotel, restaurant, transport, activity)
 *   - minEco: minimum eco score (0-10)
 *   - maxPrice: maximum price (as number)
 *   - minPrice: minimum price (as number)
 */
router.get('/', (req, res) => {
  try {
    let results = [...DESTINATIONS];
    
    // Search filter
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      results = results.filter(d =>
        d.name.toLowerCase().includes(searchTerm) ||
        d.location.toLowerCase().includes(searchTerm) ||
        d.category.toLowerCase().includes(searchTerm) ||
        d.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      results = results.filter(d => d.category === req.query.category);
    }
    
    // Eco score filter
    if (req.query.minEco) {
      const minEco = parseFloat(req.query.minEco);
      results = results.filter(d => d.ecoScore >= minEco);
    }
    
    // Price filter (extract numeric value from price string)
    if (req.query.minPrice || req.query.maxPrice) {
      results = results.filter(d => {
        const extractPrice = (priceStr) => {
          const match = priceStr.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        const price = extractPrice(d.price);
        
        if (req.query.minPrice && price < parseInt(req.query.minPrice)) return false;
        if (req.query.maxPrice && price > parseInt(req.query.maxPrice)) return false;
        return true;
      });
    }
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/destinations/search/suggestions
 * Get autocomplete suggestions for search
 */
router.get('/search/suggestions', (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    
    if (!query) {
      return res.json({ suggestions: [] });
    }
    
    // Get unique locations, categories, and names that match
    const allOptions = new Set();
    DESTINATIONS.forEach(d => {
      if (d.location.toLowerCase().includes(query)) allOptions.add(d.location);
      if (d.category.toLowerCase().includes(query)) allOptions.add(d.category);
      if (d.name.toLowerCase().includes(query)) allOptions.add(d.name);
    });
    
    res.json({
      success: true,
      suggestions: Array.from(allOptions).slice(0, 8)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/destinations/:id
 * Get a single destination by ID
 */
router.get('/:id', (req, res) => {
  try {
    const destination = DESTINATIONS.find(d => d.id === parseInt(req.params.id));
    
    if (!destination) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }
    
    res.json({
      success: true,
      data: destination
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/destinations/category/:category
 * Get destinations by category
 */
router.get('/category/:category', (req, res) => {
  try {
    const results = DESTINATIONS.filter(d => d.category === req.params.category);
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
