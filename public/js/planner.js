/* ═══════════════════════════════════════════════════════════
   planner.js  —  Owner: Julius Lim Jun Herng
   Itinerary CRUD & drag-drop scheduling
   Used by: planner.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

// Auth guard - redirect to login if no session
(function guardAuth() {
  if (typeof requirePageAuth === 'function') {
    requirePageAuth();
    return;
  }

  const email = localStorage.getItem('ecoUserEmail');
  const token = localStorage.getItem('ecoAuthToken');
  if (!email || !token) window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`;
})();

// XSS-safe HTML escaping - use esc() on user-supplied values in innerHTML templates.
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getCurrentUserEmail() {
  return normalizeEmail(localStorage.getItem('ecoUserEmail'));
}

function isTripOwner(trip) {
  return Boolean(trip) && normalizeEmail(trip.userEmail) === getCurrentUserEmail();
}

let itineraries = [];
let currentTripId = null;
let isEditing = false;
let editItemIndex = null;
let editItemLocation = null;
let weatherWarningsByTripId = {};
let lastPlannerCarbonCalculation = null;

const TRANSPORT_LABELS = {
  car_petrol: '🚗 Petrol Car',
  car_diesel: '🚙 Diesel Car',
  car_ev: '⚡ Electric Vehicle',
  car_hybrid: '🔌 Hybrid Car',
  motorcycle: '🏍️ Motorcycle',
  bus: '🚌 Bus',
  train_electric: '🚆 Train',
  klia_ekspres: '🚄 KLIA Ekspres',
  flight_short: '✈️ Short-haul Flight',
  flight_long: '✈️ Long-haul Flight',
  ferry: '⛴️ Ferry',
  bicycle: '🚲 Bicycle',
  walking: '🚶 Walking'
};

function getTripTotalCO2(trip) {
  const stopsCO2 = (trip?.days || []).reduce((sum, day) => {
    return sum + (day.stops || []).reduce((stopSum, stop) => {
      return stopSum + (parseFloat(stop.carbon) || 0);
    }, 0);
  }, 0);

  const transitCO2 = (trip?.days || []).reduce((sum, day) => {
    return sum + (parseFloat(day.transitCarbon) || 0);
  }, 0);

  return stopsCO2 + transitCO2;
}

function getStopCarbonAverage(stops) {
  if (!stops.length) return 0;
  return stops.reduce((sum, stop) => sum + (parseFloat(stop.carbon) || 0), 0) / stops.length;
}

function hasStopLocation(stop) {
  const lat = Number(stop?.location?.lat);
  const lng = Number(stop?.location?.lng);
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180;
}

function isRainWeatherCode(code) {
  const numericCode = Number(code);
  return Number.isFinite(numericCode) && numericCode >= 51 && numericCode <= 99;
}

async function fetchWeatherWarningsForTrip(trip) {
  const city = String(trip?.city || '').trim();
  if (!city) return {};

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();
    const match = geoData.results?.[0];
    if (!match) return {};

    const forecastRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${match.latitude}&longitude=${match.longitude}&daily=weather_code&timezone=auto&forecast_days=5`);
    const forecastData = await forecastRes.json();
    const dates = forecastData.daily?.time || [];
    const codes = forecastData.daily?.weather_code || [];

    return dates.reduce((warnings, date, index) => {
      if (isRainWeatherCode(codes[index])) {
        warnings[date] = true;
      }
      return warnings;
    }, {});
  } catch (err) {
    console.warn('Weather warning lookup failed:', err);
    return {};
  }
}

async function calculateDayTransitEmissions(stops, transportMode) {
  const validStops = stops.filter(hasStopLocation);
  if (validStops.length < 2) return { distanceKm: 0, carbonFootprintKg: 0 };

  try {
    const res = await fetch('/api/trips/calculate-carbon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stops: validStops, transportMode })
    });
    const data = await res.json();
    return data.success ? {
      distanceKm: Number(data.distanceKm) || 0,
      carbonFootprintKg: Number(data.carbonFootprintKg) || 0
    } : { distanceKm: 0, carbonFootprintKg: 0 };
  } catch (err) {
    console.error("Failed to calculate carbon between stops:", err);
    return { distanceKm: 0, carbonFootprintKg: 0 };
  }
}

function getTransportLabel(mode) {
  return TRANSPORT_LABELS[mode] || TRANSPORT_LABELS.car_petrol;
}

function setPlannerCarbonLoading(isLoading) {
  const btn = document.getElementById('btnPlannerCalculateCarbon');
  if (!btn) return;
  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? '<span class="spinner-border spinner-border-sm"></span> Calculating'
    : '<i class="bi bi-lightning-charge"></i> Calculate';
}

function populatePlannerCarbonTargetDays(trip) {
  const select = document.getElementById('plannerCalcTargetDay');
  if (!select || !trip) return;

  select.innerHTML = '<option value="ideaBank">Add to Idea Bank</option>';
  (trip.days || []).forEach(day => {
    select.innerHTML += `<option value="${esc(day.date)}">Add to ${esc(day.date)}</option>`;
  });
}

function resetPlannerCarbonResult() {
  lastPlannerCarbonCalculation = null;
  const result = document.getElementById('plannerCarbonResult');
  if (!result) return;
  result.classList.add('d-none');
  result.innerHTML = '';
}

function refreshPlannerCarbonPanel(trip) {
  const panel = document.getElementById('plannerCarbonPanel');
  if (!panel) return;

  const canEdit = isTripOwner(trip);
  panel.classList.toggle('d-none', !canEdit);
  if (canEdit) populatePlannerCarbonTargetDays(trip);
}

async function geocodePlannerCarbonLocation(query) {
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  if (!response.ok) throw new Error('Location lookup failed');

  const data = await response.json();
  const match = data.results?.[0];
  if (!match) throw new Error(`Could not find ${query}.`);

  return {
    name: match.name,
    country: match.country || '',
    location: {
      lat: Number(match.latitude),
      lng: Number(match.longitude)
    }
  };
}

function formatPlannerLocation(location) {
  return [location.name, location.country].filter(Boolean).join(', ');
}

function renderPlannerCarbonResult(calculation) {
  const result = document.getElementById('plannerCarbonResult');
  if (!result) return;

  const saved = Number(calculation.carbonSavedKg) || 0;
  const savedText = saved >= 0
    ? `${saved.toFixed(1)} kg saved`
    : `${Math.abs(saved).toFixed(1)} kg added`;
  const savedClass = saved >= 0 ? 'text-success' : 'text-danger';

  result.classList.remove('d-none');
  result.innerHTML = `
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
      <div>
        <div class="fw-bold text-success">${esc(formatPlannerLocation(calculation.from))} → ${esc(formatPlannerLocation(calculation.to))}</div>
        <div class="small text-muted">${esc(getTransportLabel(calculation.transportMode))} compared with petrol car baseline</div>
      </div>
      <button type="button" class="btn-eco py-2" onclick="addPlannerCarbonToTrip()">
        <i class="bi bi-plus-circle"></i> Add to Itinerary
      </button>
    </div>
    <div class="planner-carbon-result-grid">
      <div class="planner-carbon-metric">
        <span>Distance</span>
        <strong>${Number(calculation.distanceKm).toFixed(1)} km</strong>
      </div>
      <div class="planner-carbon-metric">
        <span>Produced</span>
        <strong>${Number(calculation.carbonFootprintKg).toFixed(1)} kg</strong>
      </div>
      <div class="planner-carbon-metric">
        <span>Petrol Baseline</span>
        <strong>${Number(calculation.baselineFootprintKg).toFixed(1)} kg</strong>
      </div>
      <div class="planner-carbon-metric">
        <span>Impact</span>
        <strong class="${savedClass}">${savedText}</strong>
      </div>
    </div>
  `;
}

async function calculatePlannerCarbon() {
  const fromInput = document.getElementById('plannerCalcFrom');
  const toInput = document.getElementById('plannerCalcTo');
  const modeInput = document.getElementById('plannerCalcMode');
  const trip = itineraries.find(t => t._id == currentTripId);

  if (!trip || !isTripOwner(trip)) return;

  const fromQuery = fromInput?.value.trim();
  const toQuery = toInput?.value.trim();
  const transportMode = modeInput?.value || 'car_petrol';

  if (!fromQuery || !toQuery) {
    showToast('Enter both origin and destination first.', 'warn');
    return;
  }

  setPlannerCarbonLoading(true);

  try {
    const [from, to] = await Promise.all([
      geocodePlannerCarbonLocation(fromQuery),
      geocodePlannerCarbonLocation(toQuery)
    ]);

    const response = await fetch('/api/trips/calculate-carbon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transportMode,
        stops: [
          { location: from.location },
          { location: to.location }
        ]
      })
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      showToast(data.message || 'Could not calculate this route.', 'error');
      return;
    }

    lastPlannerCarbonCalculation = { ...data, from, to };
    renderPlannerCarbonResult(lastPlannerCarbonCalculation);
  } catch (err) {
    console.error('Planner carbon calculation failed:', err);
    showToast(err.message || 'Could not calculate this route.', 'error');
  } finally {
    setPlannerCarbonLoading(false);
  }
}

async function addPlannerCarbonToTrip() {
  const trip = itineraries.find(t => t._id == currentTripId);
  if (!trip || !isTripOwner(trip) || !lastPlannerCarbonCalculation) return;

  const targetId = document.getElementById('plannerCalcTargetDay')?.value || 'ideaBank';
  const calculation = lastPlannerCarbonCalculation;
  const newStop = {
    time: 'Flexible',
    icon: '🧭',
    name: `Travel: ${formatPlannerLocation(calculation.from)} → ${formatPlannerLocation(calculation.to)}`,
    sub: `${getTransportLabel(calculation.transportMode)} · ${Number(calculation.distanceKm).toFixed(1)} km · ${Number(calculation.carbonSavedKg).toFixed(1)} kg vs petrol`,
    carbon: Number(calculation.carbonFootprintKg) || 0,
    source: 'calculator'
  };

  if (targetId === 'ideaBank') {
    if (!trip.ideaBank) trip.ideaBank = [];
    trip.ideaBank.push(newStop);
  } else {
    let targetDay = trip.days.find(day => day.date === targetId);
    if (!targetDay) {
      targetDay = { date: targetId, stops: [], transportMode: calculation.transportMode, transitDistance: 0, transitCarbon: 0 };
      trip.days.push(targetDay);
    }
    targetDay.stops.push(newStop);
  }

  renderBoardItems(trip);
  await saveTripState(currentTripId, trip);
  resetPlannerCarbonResult();
  showToast('Calculated route added to itinerary.');
}

async function refreshWeatherWarnings() {
  const pairs = await Promise.all((itineraries || []).map(async (trip) => [
    trip._id,
    await fetchWeatherWarningsForTrip(trip)
  ]));
  weatherWarningsByTripId = Object.fromEntries(pairs.filter(([id]) => id));
}

async function saveState() {
  if (!currentTripId) return;

  const trip = itineraries.find(t => t._id == currentTripId);
  if (!trip) return;

  for (const day of trip.days) {
    const result = await calculateDayTransitEmissions(day.stops, day.transportMode || 'car_petrol');
    day.transitDistance = result.distanceKm;
    day.transitCarbon = result.carbonFootprintKg;
  }

  return saveTripState(currentTripId, trip);
}

async function saveTripState(tripId, trip) {
  try {
    const res = await fetch(`/api/trips/${tripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Backend refused to save:", data.message);
      showToast("Could not save trip. Please try again.", "error");
    } else {
      syncCO2ToProfile();
    }
  } catch (err) {
    console.error("Failed to save to MongoDB:", err);
  }
}

async function syncCO2ToProfile() {
  const email = localStorage.getItem('ecoUserEmail');
  if (!email) return;

  // Sum carbon from planner activities only (exclude calculator imports)
  const totalFootprint = itineraries.reduce((tripSum, trip) => {
    const stopsCO2 = (trip.days || []).reduce((daySum, day) => {
      return daySum + (day.stops || []).reduce((s, stop) => {
        if (stop.source === 'calculator') return s;
        return s + (parseFloat(stop.carbon) || 0);
      }, 0);
    }, 0);
    const transitCO2 = (trip.days || []).reduce((daySum, day) => {
      return daySum + (parseFloat(day.transitCarbon) || 0);
    }, 0);
    return tripSum + stopsCO2 + transitCO2;
  }, 0);

  try {
    await fetch(`/api/users/${email}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ co2Footprint: Math.round(totalFootprint * 10) / 10 })
    });
  } catch (err) {
    console.error("Failed to sync CO₂ to profile:", err);
  }
}

function renderItineraries() {
  const list = document.getElementById('itineraryList');
  if (!list) return;

  if (!itineraries.length) {
    list.innerHTML = `
      <div class="text-center py-5">
        <div style="font-size:3rem; margin-bottom:1rem;">🗺️</div>
        <h5>No itineraries yet</h5>
        <p style="color:#9ab3a0;">Create your first green travel plan!</p>
      </div>`;
    return;
  }

  list.innerHTML = itineraries.map((itin, idx) => {
    const canEdit = isTripOwner(itin);
    return `
    <div class="stat-card mb-3">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <div style="font-size:1.05rem; font-weight:700;">${esc(itin.name)}</div>
          <div style="font-size:.82rem; color:#9ab3a0;">
            <i class="bi bi-geo-alt"></i> ${esc(itin.city)} &nbsp;·&nbsp;
            <i class="bi bi-calendar3"></i> ${esc(itin.start)} – ${esc(itin.end)}
          </div>
        </div>
        <div class="d-flex gap-2">
          <span class="eco-badge"><i class="bi bi-leaf"></i> Eco Trip</span>
          ${(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const s = itin.start ? new Date(itin.start) : null;
        const e = itin.end ? new Date(itin.end) : null;
        let label = 'Planned'; let color = '#6c757d';
        if (e && e < today) { label = 'Completed'; color = '#2d6a4f'; }
        else if (s && s <= today && (!e || e >= today)) { label = 'Active'; color = '#e67e22'; }
        return `<span style="background:${color};color:#fff;border-radius:8px;padding:3px 10px;font-size:.75rem;font-weight:600;">${label}</span>`;
      })()}
          ${canEdit ? `<button onclick="removeItin('${itin._id}')"
                  style="background:#fdecea; border:none; border-radius:8px; padding:4px 10px;
                         color:#c0392b; cursor:pointer; font-size:.8rem;">
            <i class="bi bi-trash3"></i>
          </button>` : ''}
        </div>
      </div>

      ${itin.days.map(day => {
        const rainWarning = weatherWarningsByTripId[itin._id]?.[day.date]
          ? `<span class="badge bg-warning text-dark ms-2" title="Rain forecast: outdoor activities might be affected"><i class="bi bi-cloud-lightning-rain"></i> Weather Alert</span>`
          : '';
        return `
        <div class="itinerary-day">
          <div class="day-header"><i class="bi bi-calendar-day"></i> ${esc(day.date)}${rainWarning}</div>
          ${day.stops.map(stop => `
            <div class="itinerary-stop">
              <div class="stop-time">${esc(stop.time)}</div>
              <div class="stop-icon">${esc(stop.icon)}</div>
              <div class="stop-info">
                <div class="stop-name">${esc(stop.name)}</div>
                <div class="stop-sub">${esc(stop.sub)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}).join('')}

      <div class="d-flex gap-2 mt-2">
        ${canEdit ? `<button class="btn-eco-outline" style="font-size:.82rem; padding:7px 16px;"
                onclick="switchView('board', '${itin._id}')">
          <i class="bi bi-pencil"></i> Edit
        </button>` : ''}
        <button class="btn-eco" style="font-size:.82rem; padding:7px 16px; justify-content:center;"
                onclick="exportTripAsPDF('${itin._id}')">
          <i class="bi bi-download"></i> Export
        </button>
      </div>
    </div>
  `;
  }).join('');
}

async function createItinerary() {
  const name = document.getElementById('itinName').value || 'My Trip';
  const city = document.getElementById('itinCity').value || 'Destination';
  const today = new Date().toISOString().split('T')[0];
  const start = document.getElementById('itinStart').value || today;
  const end = document.getElementById('itinEnd').value || today;
  const style = document.getElementById('itinStyle')?.value || '';

  // Grab the user's email from when they logged in!
  const userEmail = localStorage.getItem('ecoUserEmail');

  try {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: userEmail,
        name: name,
        city: city,
        start: start,
        end: end,
        style: style,
        days: generateDays(start, end),
        ideaBank: [] // Initialize empty idea bank for new trip
      })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast("Could not create trip: " + (data.message || "Unknown error."), "error");
      return;
    }

    itineraries.unshift(data.data);
    weatherWarningsByTripId[data.data._id] = await fetchWeatherWarningsForTrip(data.data);
    renderItineraries();

    showToast("Trip created!");
    closeModal('createItinModal');

  } catch (err) {
    console.error(err);
  }
}

async function loadState() {
  //1. get the logged-in user's email from mongodb hehe
  const userEmail = localStorage.getItem('ecoUserEmail');
  if (!userEmail) {
    console.warn("No user email found in localStorage. Itineraries won't load.");
    return;
  }
  try {
    //2. fetch itineraries from backend for that user email
    const res = await fetch(`/api/trips/${userEmail}`);
    const data = await res.json();
    itineraries = data.data || [];
    await refreshWeatherWarnings();
    renderItineraries();
  } catch (err) {
    console.error("Failed to load trips:", err);
    itineraries = [];
  }
}

function removeItin(id) {
  const removedIndex = itineraries.findIndex(t => t._id === id);
  if (removedIndex === -1) return;
  if (!isTripOwner(itineraries[removedIndex])) return;

  const [removedTrip] = itineraries.splice(removedIndex, 1);
  renderItineraries();

  showToast('Trip deleted', 'info', {
    duration: 6000,
    undoLabel: 'Undo',
    onUndo: () => {
      itineraries.splice(Math.min(removedIndex, itineraries.length), 0, removedTrip);
      renderItineraries();
      showToast('Trip restored', 'info');
    },
    onExpire: async () => {
      try {
        const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Trip delete request failed');
        syncCO2ToProfile();
      } catch (err) {
        console.error(err);
        itineraries.splice(Math.min(removedIndex, itineraries.length), 0, removedTrip);
        renderItineraries();
        showToast('Could not delete trip. Restored it.', 'error');
      }
    }
  });
}

/*
 * Switches between the kanban-view and trip-view
 */
  function switchView(view, tripId = null) {
    const listView = document.getElementById('listView');
    const boardView = document.getElementById('boardView');

    if (view === 'list') {
      listView.classList.remove('d-none');
      boardView.classList.add('d-none');
      listView.style.display = 'block';
      boardView.style.display = 'none';

      // Clear route line and stop animation when leaving board view
      if (mapRouteLines && mapRouteLines.length) {
        mapRouteLines.forEach(line => line.setMap(null));
        mapRouteLines = [];
      }
      if (mapRouteAnimationInterval) {
        clearInterval(mapRouteAnimationInterval);
        mapRouteAnimationInterval = null;
      }

      renderItineraries();
    } else {
      listView.classList.add('d-none');
      boardView.classList.remove('d-none');
      listView.style.display = 'none';
      boardView.style.display = 'block';

      // Sync current trip ID to board view
      currentTripId = tripId;
      switchPlannerTab('ideas');

      // Find the trip data
      const trip = itineraries.find(t => t._id == tripId);
      if (trip) {
        resetPlannerCarbonResult();
        refreshPlannerCarbonPanel(trip);
        processPendingIdeas(trip); // Move any pending ideas into the idea bank before rendering
        document.getElementById('activeTripTitle').innerText = trip.name;
        generateTimelineColumns(trip);
        renderBoardItems(trip); // Put real data in column based on current trip
      }
    }
  }

  function switchPlannerTab(tab) {
    const boardView = document.getElementById('boardView');
    if (!boardView) return;

    boardView.dataset.activeTab = tab;
    document.querySelectorAll('.nav-tabs-eco .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(`'${tab}'`));
    });

    if (tab === 'map' && map && window.google) {
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize');
        const trip = itineraries.find(t => t._id == currentTripId);
        if (trip) syncMapWithItinerary(trip);
      }, 60);
    }
  }

  function updateTripCarbonSummary(trip) {
    const summary = document.getElementById('tripCarbonSummary');
    if (!summary) return;
    summary.textContent = `${getTripTotalCO2(trip).toFixed(1)} kg`;
  }

  function generateDays(start, end) {
    const days = [];
    let temp = new Date(start);
    const endDate = new Date(end);

    while (temp <= endDate) {
      days.push({
        date: temp.toISOString().split('T')[0],
        stops: []
      });
      temp.setDate(temp.getDate() + 1);
    }

    return days;
  }

  function generateTimelineColumns(trip) {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = ''; // Clear existing days

    const start = new Date(trip.start);
    const end = new Date(trip.end);

    let tempDate = new Date(start);
    const canEdit = isTripOwner(trip);

    while (tempDate <= end) {
      const dayId = tempDate.toISOString().split('T')[0];
      const dayData = (trip.days || []).find(d => d.date === dayId) || {
        transportMode: 'car_petrol',
        transitDistance: 0,
        transitCarbon: 0
      };

      const mode = dayData.transportMode || 'car_petrol';
      const distance = dayData.transitDistance || 0;
      const carbon = dayData.transitCarbon || 0;

      const selectDropdown = canEdit ? `
        <select onchange="updateDayTransportMode('${dayId}', this.value)" class="form-select form-select-sm border-0 bg-transparent text-muted fw-semibold p-0" style="width: auto; box-shadow: none; font-size: 0.75rem; cursor: pointer;">
          <option value="car_petrol" ${mode === 'car_petrol' ? 'selected' : ''}>🚗 Petrol Car</option>
          <option value="car_diesel" ${mode === 'car_diesel' ? 'selected' : ''}>🚙 Diesel Car</option>
          <option value="car_ev" ${mode === 'car_ev' ? 'selected' : ''}>⚡ Electric Vehicle</option>
          <option value="car_hybrid" ${mode === 'car_hybrid' ? 'selected' : ''}>🔌 Hybrid Car</option>
          <option value="motorcycle" ${mode === 'motorcycle' ? 'selected' : ''}>🏍️ Motorcycle</option>
          <option value="bus" ${mode === 'bus' ? 'selected' : ''}>🚌 Bus</option>
          <option value="train_electric" ${mode === 'train_electric' ? 'selected' : ''}>🚆 Train</option>
          <option value="klia_ekspres" ${mode === 'klia_ekspres' ? 'selected' : ''}>🚄 KLIA Ekspres</option>
          <option value="flight_short" ${mode === 'flight_short' ? 'selected' : ''}>✈️ Short-haul Flight</option>
          <option value="flight_long" ${mode === 'flight_long' ? 'selected' : ''}>✈️ Long-haul Flight</option>
          <option value="ferry" ${mode === 'ferry' ? 'selected' : ''}>⛴️ Ferry</option>
          <option value="bicycle" ${mode === 'bicycle' ? 'selected' : ''}>🚲 Bicycle</option>
          <option value="walking" ${mode === 'walking' ? 'selected' : ''}>🚶 Walking</option>
        </select>
      ` : `
        <span class="text-muted fw-semibold" style="font-size: 0.75rem;">
          ${getTransportLabel(mode)}
        </span>
      `;

      container.innerHTML += `
        <div class="kanban-column bg-light rounded-3 p-3 d-flex flex-column" style="min-width: 320px; max-height: 80vh;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="text-muted mb-0"><i class="bi bi-calendar-day"></i> ${dayId}</h6>
            <div class="d-flex align-items-center gap-1">
              ${selectDropdown}
            </div>
          </div>
          <div id="col-${dayId}" class="d-flex flex-column gap-2 flex-grow-1 overflow-y-auto min-vh-25" style="min-height: 150px;"
               ondragover="allowDrop(event)" 
               ondrop="handleDrop(event, '${dayId}')">
          </div>
          <div id="banner-${dayId}" class="mt-2 p-2 rounded bg-white border small text-muted d-flex justify-content-between align-items-center">
            <span><i class="bi bi-compass"></i> Transit: <strong>${distance.toFixed(1)} km</strong></span>
            <span class="text-success"><i class="bi bi-leaf"></i> <strong>${carbon.toFixed(1)} kg CO₂</strong></span>
          </div>
        </div>
      `;

      tempDate.setDate(tempDate.getDate() + 1);//move to next day
    }
  }

  async function updateDayTransportMode(dayId, newMode) {
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!trip) return;

    let day = trip.days.find(d => d.date === dayId);
    if (!day) {
      day = { date: dayId, stops: [], transportMode: newMode, transitDistance: 0, transitCarbon: 0 };
      trip.days.push(day);
    } else {
      day.transportMode = newMode;
    }

    // Recalculate transit footprint for this day
    const result = await calculateDayTransitEmissions(day.stops, newMode);
    day.transitDistance = result.distanceKm;
    day.transitCarbon = result.carbonFootprintKg;

    // Update banner text instantly
    const banner = document.getElementById(`banner-${dayId}`);
    if (banner) {
      banner.innerHTML = `
      <span><i class="bi bi-compass"></i> Transit: <strong>${day.transitDistance.toFixed(1)} km</strong></span>
      <span class="text-success"><i class="bi bi-leaf"></i> <strong>${day.transitCarbon.toFixed(1)} kg CO₂</strong></span>
    `;
    }

    // Save changes and update total stats / maps
    updateTripCarbonSummary(trip);
    await saveTripState(currentTripId, trip);
    syncMapWithItinerary(trip);
  }

  function renderBoardItems(trip) {
    updateTripCarbonSummary(trip);
    refreshPlannerCarbonPanel(trip);

    const ideaContainer = document.getElementById('ideaBankContainer');
    if (ideaContainer) {
      ideaContainer.innerHTML = '';
      if (trip.ideaBank) {
        ideaContainer.innerHTML = trip.ideaBank.map((stop, index) =>
          createCardHTML(stop, index, 'ideaBank')
        ).join('');
      }
    }

    trip.days.forEach(day => {
      const col = document.getElementById(`col-${day.date}`);
      if (col) {
        sortStopsByTime(day.stops);
        col.innerHTML = day.stops.map((stop, index) =>
          createCardHTML(stop, index, day.date)).join('');
      }
    });

    // for google maps
    syncMapWithItinerary(trip);
  }

  function createCardHTML(stop, idx, sourceLocation) {
    // Determine color based on carbon weight
    const carbonRaw = parseFloat(stop.carbon) || 0;

    const carbonDisplay = carbonRaw % 1 === 0 ? carbonRaw : carbonRaw.toFixed(2);
    let badgeClass = 'bg-success'; // Low
    if (carbonRaw > 10) badgeClass = 'bg-warning text-dark'; // Medium
    if (carbonRaw > 20) badgeClass = 'bg-danger'; // High
    const trip = itineraries.find(t => t._id == currentTripId);
    const canEdit = isTripOwner(trip);

    return `
        <div class="itinerary-stop p-2 mb-2 bg-white rounded shadow-sm position-relative"
             draggable="${canEdit ? 'true' : 'false'}" style="cursor: ${canEdit ? 'grab' : 'default'};"
             ${canEdit ? `ondragstart="handleDragStart(event, ${idx}, '${sourceLocation}')"` : ''}>

            ${canEdit ? `<div class="position-absolute top-0 end-0 m-1 d-flex gap-2">
                <button onclick="editActivity(${idx}, '${sourceLocation}')" 
                        class="btn btn-sm text-secondary p-0 border-0" style="font-size: 0.8rem; background: transparent;">
                    <i class="bi bi-pencil"></i>
                </button>
                <button onclick="deleteActivity(${idx}, '${sourceLocation}')" 
                        class="btn-close" style="font-size: 0.5rem;"></button>
            </div>` : ''}

            <div class="d-flex gap-2 ${canEdit ? 'pe-4' : ''} w-100">
                
                <div style="font-size: 1.2rem; min-width: 25px;">${esc(stop.icon)}</div>
                
                <div class="flex-grow-1" style="min-width: 0;"> 
                    
                    <div class="fw-bold text-wrap text-break mb-1" style="font-size:0.85rem; line-height: 1.2;">
                        ${esc(stop.name)}
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <div class="text-muted" style="font-size:0.75rem;">${esc(stop.time)}</div>
                        <span class="badge ${badgeClass}" style="font-size: 0.65rem;">${carbonDisplay}kg CO₂</span>
                    </div>

                </div>
            </div>
        </div>
    `;
  }

  let draggedItemIndex = null;
  let sourceDayDate = null;

  function handleDragStart(event, index, date) {
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!isTripOwner(trip)) {
      event.preventDefault();
      return;
    }
    draggedItemIndex = index;
    sourceDayDate = date;
    event.dataTransfer.setData('text/plain', index);
  }

  function allowDrop(event) {
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!isTripOwner(trip)) return;
    event.preventDefault();
  }

  function handleDrop(event, targetLocation) {
    event.preventDefault();

    const trip = itineraries.find(t => t._id == currentTripId);
    if (!trip) return;
    if (!isTripOwner(trip)) return;

    // Gets the correct array whether we drop in the Idea Bank or a Timeline Day
    function getTargetArray(locationId) {
      if (locationId === 'ideaBank') {
        if (!trip.ideaBank) trip.ideaBank = []; // Safety check
        return trip.ideaBank;
      } else {
        let day = trip.days.find(d => d.date === locationId);
        if (!day) {
          day = { date: locationId, stops: [] };
          trip.days.push(day);
        }
        return day.stops;
      }
    }

    //identify two arrays we are moving to and fro
    const sourceArray = getTargetArray(sourceDayDate);
    const targetArray = getTargetArray(targetLocation);

    //removes item from old array, push to new array
    if (sourceArray && sourceArray[draggedItemIndex]) {
      const [movedItem] = sourceArray.splice(draggedItemIndex, 1);
      targetArray.push(movedItem);

      saveState();
      //Redraw the board to reflect the new data structure
      renderBoardItems(trip);
      showToast("Activity moved!");
    }
  }

  function sortStopsByTime(stopsArray) {
    stopsArray.sort((a, b) => {
      // If time is "Flexible" or empty, treat it as 11:59 PM so it goes to the bottom
      const timeA = (a.time === 'Flexible' || !a.time) ? '23:59' : a.time;
      const timeB = (b.time === 'Flexible' || !b.time) ? '23:59' : b.time;

      // Standard alphabetical string sort works perfectly for 24-hour time!
      return timeA.localeCompare(timeB);
    });
  }

  function openAddActivityModal() {
    isEditing = false; // Make sure we aren't editing when adding new!
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!trip) return;
    if (!isTripOwner(trip)) return;

    // populate location dropdown with timeline days
    const select = document.getElementById('actTargetDay');
    select.innerHTML = `<option value="ideaBank">💡 Activites Idea</option>`;
    trip.days.forEach(day => {
      select.innerHTML += `<option value="${day.date}">📅 Day: ${day.date}</option>`;
    });

    // Clear out any old text from the inputs so it's a fresh blank form
    document.getElementById('actName').value = '';
    document.getElementById('actSub').value = '';
    document.getElementById('actTime').value = '';
    document.getElementById('actIconBtn').innerText = '📍';
    document.getElementById('actCarbon').value = '0';
    document.getElementById('actLat').value = '';
    document.getElementById('actLng').value = '';

    openModal('addActivityModal');
  }

  function selectEmoji(emoji) {
    document.getElementById('actIconBtn').innerText = emoji;
  }

  function editActivity(index, sourceLocation) {
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!trip) return;
    if (!isTripOwner(trip)) return;

    // 1. Find the specific activity data
    let stop;
    if (sourceLocation === 'ideaBank') {
      stop = trip.ideaBank[index];
    } else {
      const day = trip.days.find(d => d.date === sourceLocation);
      stop = day.stops[index];
    }

    // 2. Populate the destination dropdown
    const select = document.getElementById('actTargetDay');
    select.innerHTML = `<option value="ideaBank">💡 Activites Idea</option>`;
    trip.days.forEach(day => {
      select.innerHTML += `<option value="${day.date}">📅 Day: ${day.date}</option>`;
    });

    // 3. Fill the form boxes with the old data!
    document.getElementById('actName').value = stop.name;
    document.getElementById('actTime').value = stop.time === 'Flexible' ? '' : stop.time;
    document.getElementById('actIconBtn').innerText = stop.icon || '📍';
    document.getElementById('actSub').value = stop.sub;
    document.getElementById('actCarbon').value = stop.carbon;
    document.getElementById('actTargetDay').value = sourceLocation;
    document.getElementById('actLat').value = stop.location?.lat || '';
    document.getElementById('actLng').value = stop.location?.lng || '';

    // 4. Turn ON Edit Mode so the Save button knows what to do
    isEditing = true;
    editItemIndex = index;
    editItemLocation = sourceLocation;

    openModal('addActivityModal');
  }

  function saveNewActivity() {
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!trip) return;
    if (!isTripOwner(trip)) return;

    // Grab data from form
    const name = document.getElementById('actName').value || 'New Activity';
    const time = document.getElementById('actTime').value || 'Flexible';
    const icon = document.getElementById('actIconBtn').innerText || '📍';
    const sub = document.getElementById('actSub').value || 'Custom';
    const targetId = document.getElementById('actTargetDay').value;
    const carbon = parseFloat(document.getElementById('actCarbon').value) || 0;
    const lat = document.getElementById('actLat').value;
    const lng = document.getElementById('actLng').value;

    // Create the new Stop Object
    const newStop = { time, icon, name, sub, carbon };
    if (lat && lng) {
      newStop.location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    if (isEditing) {
      if (editItemLocation === 'ideaBank') {
        trip.ideaBank.splice(editItemIndex, 1);
      } else {
        const oldDay = trip.days.find(d => d.date === editItemLocation);
        if (oldDay) oldDay.stops.splice(editItemIndex, 1);
      }
      // Turn edit mode off so we can add new activities later
      isEditing = false;
    }

    // Push it to the correct Array
    if (targetId === 'ideaBank') {
      if (!trip.ideaBank) trip.ideaBank = [];
      trip.ideaBank.push(newStop);
    } else {
      let targetDay = trip.days.find(d => d.date === targetId);
      // if day don't exist, create it
      if (!targetDay) {
        targetDay = { date: targetId, stops: [] };
        trip.days.push(targetDay);
      }
      targetDay.stops.push(newStop);
    }

    // refresh UI
    closeModal('addActivityModal');
    renderBoardItems(trip);
    saveState();
    showToast("Activity added! ✨");
  }

  function deleteActivity(index, sourceLocation) {
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!trip) return;
    if (!isTripOwner(trip)) return;

    let targetArray = null;

    if (sourceLocation === 'ideaBank') {
      targetArray = trip.ideaBank;
    } else {
      const day = trip.days.find(d => d.date === sourceLocation);
      if (day) targetArray = day.stops;
    }

    if (!targetArray || !targetArray[index]) return;

    const [removedActivity] = targetArray.splice(index, 1);
    renderBoardItems(trip);

    showToast('Activity deleted', 'info', {
      duration: 6000,
      undoLabel: 'Undo',
      onUndo: async () => {
        const latestTrip = itineraries.find(t => t._id == trip._id);
        if (!latestTrip) return;

        let restoreArray = null;
        if (sourceLocation === 'ideaBank') {
          if (!latestTrip.ideaBank) latestTrip.ideaBank = [];
          restoreArray = latestTrip.ideaBank;
        } else {
          const day = latestTrip.days.find(d => d.date === sourceLocation);
          if (day) restoreArray = day.stops;
        }

        if (!restoreArray) return;
        restoreArray.splice(Math.min(index, restoreArray.length), 0, removedActivity);
        renderBoardItems(latestTrip);
        await saveTripState(latestTrip._id, latestTrip);
        showToast('Activity restored', 'info');
      },
      onExpire: async () => {
        const latestTrip = itineraries.find(t => t._id == trip._id);
        if (latestTrip) await saveTripState(latestTrip._id, latestTrip);
      }
    });
  }

  function processPendingIdeas(trip) {
    // 1. Open the browser's temporary "Shopping Cart"
    const pendingIdeas = JSON.parse(localStorage.getItem('ecoPendingIdeas') || '[]');

    if (pendingIdeas.length > 0) {
      // 2. Ensure the trip has an array ready to hold the ideas
      if (!trip.ideaBank) trip.ideaBank = [];

      // 3. Move everything from the cart into the trip's Idea Bank
      pendingIdeas.forEach(idea => {
        trip.ideaBank.push(normalizeTripStopLocation(idea));
      });

      // 4. Empty the local cart so we don't import them again later!
      localStorage.removeItem('ecoPendingIdeas');

      // 5. Fire off a save to MongoDB to make the new additions permanent
      saveState();

      // 6. Give the user a nice UI alert
      if (typeof showToast === 'function') {
        showToast(`Imported ${pendingIdeas.length} saved activities from Explore! 🌟`);
      }
    }
  }

  function exportTripAsPDF(tripId) {
    const trip = itineraries.find(t => t._id == tripId);
    if (!trip) return;

    const win = window.open('', '_blank');
    if (!win) {
      showToast('Pop-up blocked. Please allow pop-ups for this site to export.', 'warn');
      return;
    }
    const days = (trip.days || []).map(day => `
    <div style="margin-bottom:1.5rem;">
      <h3 style="color:#2d6a4f;border-bottom:1px solid #ccc;padding-bottom:4px;">📅 ${esc(day.date)}</h3>
      ${(day.stops || []).length === 0
        ? '<p style="color:#999;font-style:italic;">No activities scheduled.</p>'
        : (day.stops || []).map(stop => `
          <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;padding:8px;background:#f9f9f9;border-radius:6px;">
            <div style="font-size:1.4rem;">${esc(stop.icon || '📍')}</div>
            <div>
              <div style="font-weight:600;">${esc(stop.name)}</div>
              <div style="font-size:0.85rem;color:#666;">${esc(stop.time || 'Flexible')} &nbsp;·&nbsp; ${esc(stop.sub || '')}</div>
              <div style="font-size:0.8rem;color:#2d6a4f;">🌿 ${stop.carbon || 0} kg CO₂</div>
            </div>
          </div>`).join('')
      }
    </div>`).join('');

    const totalCO2 = (trip.days || []).reduce((sum, d) =>
      sum + (d.stops || []).reduce((s, st) => s + (parseFloat(st.carbon) || 0), 0), 0);

    win.document.write(`
    <!DOCTYPE html><html><head>
    <title>${esc(trip.name)} — EcoPlanner Itinerary</title>
    <style>
      body { font-family: sans-serif; max-width: 700px; margin: 40px auto; color: #222; }
      h1 { color: #1b4332; }
      .meta { color: #555; font-size: 0.9rem; margin-bottom: 2rem; }
      .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 0.8rem; color: #999; }
    </style></head><body>
    <h1>🌿 ${esc(trip.name)}</h1>
    <div class="meta">
      📍 ${esc(trip.city || 'Destination not set')} &nbsp;|&nbsp;
      📅 ${esc(trip.start || '?')} → ${esc(trip.end || '?')} &nbsp;|&nbsp;
      🌿 Total CO₂: ${totalCO2.toFixed(1)} kg
    </div>
    ${days}
    <div class="footer">Exported from EcoPlanner · ${new Date().toLocaleDateString()}</div>
    </body></html>`);

    win.document.close();
    setTimeout(() => win.print(), 500);
  }

  function openOffsetModal() {
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!trip) {
      showToast('Open a trip before offsetting.', 'warn');
      return;
    }

    const totalCO2 = getTripTotalCO2(trip);
    const treeCount = Math.max(1, Math.ceil(totalCO2 / 20));
    const offsetCost = treeCount * 10;
    const body = document.getElementById('offsetModalBody');
    if (!body) return;

    body.innerHTML = `
    <div class="offset-summary">
      <div>
        <span>Total Trip CO₂</span>
        <strong>${totalCO2.toFixed(1)} kg</strong>
      </div>
      <div>
        <span>Tree Equivalent</span>
        <strong>${treeCount} seedling${treeCount === 1 ? '' : 's'}</strong>
      </div>
      <div>
        <span>Estimated Offset</span>
        <strong>RM ${offsetCost}</strong>
      </div>
    </div>
    <div class="offset-projects">
      <label class="offset-project active">
        <input type="radio" name="offsetProject" value="Langkawi Mangrove Planting Center" checked>
        <span>
          <strong>Langkawi Mangrove Planting Center</strong>
          <small>Mangrove seedlings and coastal habitat restoration.</small>
        </span>
      </label>
      <label class="offset-project">
        <input type="radio" name="offsetProject" value="Borneo Reforestation Trust">
        <span>
          <strong>Borneo Reforestation Trust</strong>
          <small>Native rainforest restoration and community nurseries.</small>
        </span>
      </label>
      <label class="offset-project">
        <input type="radio" name="offsetProject" value="Cameron Highlands Tree Nursery">
        <span>
          <strong>Cameron Highlands Tree Nursery</strong>
          <small>Highland slope replanting and watershed protection.</small>
        </span>
      </label>
    </div>
  `;

    body.querySelectorAll('.offset-project').forEach(label => {
      label.addEventListener('click', () => {
        body.querySelectorAll('.offset-project').forEach(item => item.classList.remove('active'));
        label.classList.add('active');
      });
    });

    openModal('offsetModal');
  }

  function confirmOffsetContribution() {
    const selectedProject = document.querySelector('input[name="offsetProject"]:checked')?.value || 'local offset project';
    closeModal('offsetModal');
    showToast(`Thank you for planning green! Offset pledged with ${selectedProject}.`);
  }

  /* Load sample data and render on page load */
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderItineraries();
    loadGoogleMapsScript(); // Fetch API key and load Google Maps script
  });

  /*
  NEW MAP LOGIC!!!
  */
  let map;
  let mapMarkers = [];
  let mapRouteLines = [];
  let mapRouteAnimationInterval;

  window.initMap = function () {
    const mapElement = document.getElementById('map');
    if (!mapElement) return; //safety check

    //Defaults to malaysia
    map = new google.maps.Map(mapElement, {
      center: { lat: 4.2105, lng: 101.9758 },
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
      mapId: "DEMO_MAP_ID"
    });
  }

  function syncMapWithItinerary(trip) {
    //ensure google map is loaded
    if (!map || !window.google) return;

    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.style.display = 'block';

    // Clear old markers
    mapMarkers.forEach(marker => marker.setMap(null));
    mapMarkers = [];

    // Clear old route lines and stop animation
    if (mapRouteLines && mapRouteLines.length) {
      mapRouteLines.forEach(line => line.setMap(null));
    }
    mapRouteLines = [];

    if (mapRouteAnimationInterval) {
      clearInterval(mapRouteAnimationInterval);
      mapRouteAnimationInterval = null;
    }

    // set bounds to auto zooom
    const bounds = new google.maps.LatLngBounds();
    let hasLocations = false;
    let stopCounter = 1; //number pins
    const pathCoordinates = [];

    const MODE_COLORS = {
      walking: '#2d6a4f',
      bicycle: '#2d6a4f',
      train_electric: '#2d6a4f',
      car_hybrid: '#e67e22',
      car_ev: '#e67e22',
      bus: '#e67e22',
      car_petrol: '#c0392b',
      car_diesel: '#c0392b',
      flight_short: '#c0392b',
      flight_long: '#c0392b',
      ferry: '#c0392b',
      motorcycle: '#c0392b'
    };

    // Loop through days and draw pins for scheduled activities
    (trip.days || []).forEach(day => {
      const dayCoordinates = [];

      (day.stops || []).forEach(stop => {
        // Only draw a pin if the stop has latitude and longitude
        if (hasStopLocation(stop)) {
          const position = {
            lat: parseFloat(stop.location.lat),
            lng: parseFloat(stop.location.lng)
          };

          dayCoordinates.push(position);
          pathCoordinates.push(position);

          const pin = new google.maps.marker.PinElement({
            glyphText: stopCounter.toString(),
            glyphColor: "white",
          });

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: position,
            map: map,
            title: stop.name,
            content: pin
          });

          mapMarkers.push(marker);
          bounds.extend(position);
          hasLocations = true;
          stopCounter++;
        }
      });

      // Draw route for this day if there are at least two coordinates
      if (dayCoordinates.length >= 2) {
        const mode = day.transportMode || 'car_petrol';
        const routeColor = MODE_COLORS[mode] || '#c0392b';

        const lineSymbol = {
          path: "M 0,-1 0,1",
          strokeOpacity: 1,
          scale: 3,
          strokeColor: routeColor,
          strokeWeight: 2
        };

        const line = new google.maps.Polyline({
          path: dayCoordinates,
          strokeOpacity: 0,
          icons: [
            {
              icon: lineSymbol,
              offset: "0px",
              repeat: "15px",
            },
          ],
          map: map,
        });

        mapRouteLines.push(line);
      }
    });

    // Animate route paths
    let count = 0;
    if (mapRouteLines.length > 0) {
      mapRouteAnimationInterval = setInterval(() => {
        count = (count + 1) % 15;
        mapRouteLines.forEach(line => {
          if (line && window.google) {
            const icons = line.get("icons");
            if (icons && icons[0]) {
              icons[0].offset = count + "px";
              line.set("icons", icons);
            }
          }
        });
      }, 60);
    }
    //adjust camera
    if (hasLocations) {
      map.fitBounds(bounds);

      const listener = google.maps.event.addListener(map, "idle", function () {
        if (map.getZoom() > 14) map.setZoom(14);
        google.maps.event.removeListener(listener);
      });
    } else {
      // If no locations, center on Malaysia
      map.setCenter({ lat: 4.2105, lng: 101.9758 });
      map.setZoom(6);
    }
  }

  // Function to fetch the API key and load the Google Maps script
  async function loadGoogleMapsScript() {
    try {
      const response = await fetch('/api/config/maps');
      const data = await response.json();
      const apiKey = data.apiKey;

      if (!apiKey) {
        console.error("No API key found!");
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;

      document.head.appendChild(script);

    } catch (error) {
      console.error("Failed to load Google Maps API key:", error);
    }
  }

  // -------------------------------------------------------------
  // MAP PICKER LOGIC
  // -------------------------------------------------------------
  let pickerMap;
  let pickerMarker;

  // Geocoding search function
  window.searchMapLocation = function () {
    const searchInput = document.getElementById('mapSearchInput');
    const address = searchInput ? searchInput.value.trim() : '';
    if (!address) {
      showToast('Please enter a location name or address first!', 'warn');
      return;
    }

    if (!window.google || !window.google.maps) {
      showToast('Google Maps is not loaded yet.', 'error');
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        pickerMap.setCenter(location);
        pickerMap.setZoom(14);
        placePickerMarker(location);
      } else {
        showToast('Location not found. Please try a different query.', 'warn');
      }
    });
  };

  function openMapPicker() {
    // 1. Show modal
    document.getElementById('mapPickerModal').style.display = 'flex';

    // Clear search input
    const searchInput = document.getElementById('mapSearchInput');
    if (searchInput) {
      searchInput.value = '';
    }

    // 2. Initialize picker map if not already done
    if (!pickerMap && window.google) {
      const pickerMapElement = document.getElementById('pickerMap');
      pickerMap = new google.maps.Map(pickerMapElement, {
        center: { lat: 4.2105, lng: 101.9758 }, // Malaysia default
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false,
        mapId: "PICKER_MAP_ID"
      });

      pickerMap.addListener('click', (e) => {
        placePickerMarker(e.latLng);
      });

      // Initialize Google Places Autocomplete
      if (searchInput && window.google.maps.places) {
        const autocomplete = new google.maps.places.Autocomplete(searchInput, {
          fields: ['geometry', 'formatted_address', 'name']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const location = place.geometry.location;
            pickerMap.setCenter(location);
            pickerMap.setZoom(15);
            placePickerMarker(location);
          } else {
            searchMapLocation();
          }
        });

        // Prevent pressing enter from triggering other actions when Autocomplete is active
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            // Check if there is an active suggestion highlight to let Google Autocomplete handle it
            const hasSelection = document.querySelector('.pac-item-selected');
            if (hasSelection) {
              e.stopPropagation();
            } else {
              e.preventDefault();
              searchMapLocation();
            }
          }
        });
      } else if (searchInput) {
        // Fallback: Bind Enter key to search input geocoding
        searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            searchMapLocation();
          }
        });
      }
    }

    if (!pickerMap) {
      showToast('Google Maps is still loading, please try again in a moment', 'warn');
      return;
    }

    // 3. Resize map to prevent grey box issue when map is initialized inside a hidden div
    // We use a small timeout to allow the modal to finish displaying
    setTimeout(() => {
      google.maps.event.trigger(pickerMap, 'resize');

      // 4. Try to read current inputs
      const currentLat = parseFloat(document.getElementById('actLat').value);
      const currentLng = parseFloat(document.getElementById('actLng').value);

      if (!isNaN(currentLat) && !isNaN(currentLng)) {
        const pos = { lat: currentLat, lng: currentLng };
        placePickerMarker(pos);
        pickerMap.setCenter(pos);
        pickerMap.setZoom(12);
      } else {
        // Clear marker if no lat/lng is set
        if (pickerMarker) {
          pickerMarker.map = null;
          pickerMarker = null; // Reset so placePickerMarker creates a new one cleanly or properly maps it
        }

        // Optionally try HTML5 Geolocation to center on user
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              pickerMap.setCenter(pos);
              pickerMap.setZoom(10);
            },
            () => {
              // Ignore errors, just use default center
            }
          );
        }
      }
    }, 50);
  }

  function placePickerMarker(latLng) {
    if (!pickerMarker) {
      pickerMarker = new google.maps.marker.AdvancedMarkerElement({
        map: pickerMap
      });
    }
    pickerMarker.map = pickerMap; // Ensure it's on the map
    pickerMarker.position = latLng;
  }

  function closeMapPicker() {
    document.getElementById('mapPickerModal').style.display = 'none';
  }

  function confirmMapSelection() {
    if (pickerMarker && pickerMarker.position) {
      const pos = pickerMarker.position;
      // Update the form inputs
      // toFixed(6) to prevent extremely long decimals
      document.getElementById('actLat').value = (typeof pos.lat === 'function' ? pos.lat() : pos.lat).toFixed(6);
      document.getElementById('actLng').value = (typeof pos.lng === 'function' ? pos.lng() : pos.lng).toFixed(6);
      closeMapPicker();
    } else {
      showToast('Please click on the map to select a location first!', 'warn');
    }
  }
