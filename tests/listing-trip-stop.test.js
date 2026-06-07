const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadAppHelpers() {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'app.js'), 'utf8');
  const noop = () => {};
  const storage = {
    getItem: () => null,
    setItem: noop,
    removeItem: noop,
    clear: noop
  };
  const fetch = () => Promise.resolve({ status: 200, json: async () => ({}) });
  const context = {
    console,
    Headers,
    URL,
    Promise,
    setTimeout,
    clearTimeout,
    localStorage: storage,
    sessionStorage: storage,
    document: {
      addEventListener: noop,
      querySelectorAll: () => [],
      getElementById: () => null,
      createElement: () => ({ style: {}, appendChild: noop, remove: noop, classList: { add: noop } }),
      body: { appendChild: noop }
    },
    window: {
      location: { origin: 'http://localhost:3000', pathname: '/explore.html', search: '', hash: '' },
      fetch
    }
  };
  context.window.fetch.bind = Function.prototype.bind.bind(fetch);
  context.window.localStorage = storage;
  context.window.sessionStorage = storage;

  vm.createContext(context);
  vm.runInContext(appSource, context);
  return context;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('buildTripStopFromListing preserves destination coordinates for itinerary stops', () => {
  const context = loadAppHelpers();

  const stop = context.buildTripStopFromListing({
    id: 1,
    name: 'The Habitat Penang Hill',
    location: 'Penang Hill, Penang',
    cat: 'activity',
    icon: '🌳',
    co2: 'Minimal',
    lat: 5.4242,
    lon: 100.2698
  });

  assert.equal(stop.name, 'The Habitat Penang Hill');
  assert.equal(stop.source, 'destination');
  assert.deepEqual(plain(stop.location), {
    lat: 5.4242,
    lng: 100.2698,
    address: 'Penang Hill, Penang'
  });
});

test('normalizeTripStopLocation converts legacy lon to trip lng', () => {
  const context = loadAppHelpers();

  const stop = context.normalizeTripStopLocation({
    name: 'Legacy destination idea',
    location: { lat: '6.4097', lon: '99.8589', address: 'Kilim, Langkawi' }
  });

  assert.deepEqual(plain(stop.location), {
    lat: 6.4097,
    lng: 99.8589,
    address: 'Kilim, Langkawi'
  });
});
