const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Helper to load client-side JS into Node VM context
function loadJSInContext(fileName) {
  const filePath = path.join(__dirname, '..', 'public', 'js', fileName);
  const code = fs.readFileSync(filePath, 'utf8');
  
  const noop = () => {};
  const storage = {
    getItem: (key) => {
      if (key === 'ecoUserEmail') return 'demo@ecoplanner.com';
      if (key === 'ecoAuthToken') return 'mock-token';
      return null;
    },
    setItem: noop,
    removeItem: noop,
    clear: noop
  };

  const context = {
    console,
    localStorage: storage,
    document: {
      addEventListener: noop,
      getElementById: () => ({ addEventListener: noop, style: {}, innerHTML: '' }),
      querySelectorAll: () => []
    },
    window: {
      location: { href: '', pathname: '/' }
    },
    favorites: new Set(),
    LISTINGS: []
  };

  vm.createContext(context);
  vm.runInContext(code, context);
  return context;
}

// Explore.js Helpers Tests
test('getListingPrice parses numeric price correctly from priceLabel', () => {
  const exploreCtx = loadJSInContext('explore.js');
  const price1 = exploreCtx.getListingPrice({ priceLabel: 'RM80' });
  const price2 = exploreCtx.getListingPrice({ price: 'RM120' });
  const price3 = exploreCtx.getListingPrice({ priceLabel: 'Free' });

  assert.equal(price1, 80);
  assert.equal(price2, 120);
  assert.equal(price3, 0);
});

test('esc escapes HTML special characters', () => {
  const exploreCtx = loadJSInContext('explore.js');
  const input = '<script>alert("hello")</script> & extra';
  const escaped = exploreCtx.esc(input);
  assert.equal(escaped, '&lt;script&gt;alert(&quot;hello&quot;)&lt;/script&gt; &amp; extra');
});

// Planner.js Helpers Tests
test('normalizeEmail in planner normalises raw email values', () => {
  const plannerCtx = loadJSInContext('planner.js');
  const result = plannerCtx.normalizeEmail('   Julius@LetGoPlanner.com  ');
  assert.equal(result, 'julius@letgoplanner.com');
});

test('isRainWeatherCode identifies WMO weather codes indicating rain', () => {
  const plannerCtx = loadJSInContext('planner.js');
  
  // Rain codes: 51 to 99
  assert.equal(plannerCtx.isRainWeatherCode(51), true);
  assert.equal(plannerCtx.isRainWeatherCode(65), true);
  assert.equal(plannerCtx.isRainWeatherCode(80), true);
  
  // Non-rain codes: 0 to 50
  assert.equal(plannerCtx.isRainWeatherCode(0), false);
  assert.equal(plannerCtx.isRainWeatherCode(3), false);
  assert.equal(plannerCtx.isRainWeatherCode(45), false);
});

test('getStopCarbonAverage calculates average carbon for list of itinerary stops', () => {
  const plannerCtx = loadJSInContext('planner.js');
  
  const stops = [
    { carbon: 12.5 },
    { carbon: 15.0 },
    { carbon: '7.5' } // String parsing fallback
  ];
  
  const avg = plannerCtx.getStopCarbonAverage(stops);
  assert.equal(avg, 11.666666666666666); // (12.5 + 15.0 + 7.5) / 3
  
  const emptyAvg = plannerCtx.getStopCarbonAverage([]);
  assert.equal(emptyAvg, 0);
});

test('getTripTotalCO2 calculates correct overall trip carbon footprints', () => {
  const plannerCtx = loadJSInContext('planner.js');
  
  const mockTrip = {
    days: [
      {
        stops: [{ carbon: 5 }, { carbon: 10 }],
        transitCarbon: 15
      },
      {
        stops: [{ carbon: 2.5 }],
        transitCarbon: 7.5
      }
    ]
  };
  
  const total = plannerCtx.getTripTotalCO2(mockTrip);
  assert.equal(total, 40); // (5+10) + 15 + 2.5 + 7.5 = 40
});
