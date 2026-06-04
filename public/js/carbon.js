/* ═══════════════════════════════════════════════════════════
   carbon.js  —  Owner: Chin Kin Hiung
   Advanced CO2 math, Group Logic, Distance Auto-Calculation
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

/* ── DATA & STATE ── */
// Emission factors based on DEFRA/EPA standard averages (g CO2/km)
// 1. Your Research Data (Source: DEFRA / Industry Standards)
const EMISSION_FACTORS = {
  "car_petrol": 0.1405,
  "car_diesel": 0.1418,
  "car_ev": 0.0449,
  "car_hybrid": 0.10,
  "motorcycle": 0.103,
  "bus": 0.105,
  "train_electric": 0.0275,
  "klia_ekspres": 0.044,
  "flight_short": 0.13,
  "flight_long": 0.11,
  "ferry": 0.1523,
  "bicycle": 0.0,
  "walking": 0.0
};
const BASELINE = EMISSION_FACTORS.car_petrol;// Baseline for comparison (petrol car)
let currentUserData = null;
let co2ChartInst = null;
let currentTrips = [];

// Store coordinates for automated distance calculation
async function loadCarbon() {
  const email = localStorage.getItem('ecoUserEmail');
  if (!email) return;

  try {
    const [uRes, tRes] = await Promise.all([
      fetch(`/api/users/profile/${email}`),
      fetch(`/api/trips/${email}`)
    ]);
    const uData = await uRes.json();
    const tData = await tRes.json();
    if (uData.success) {
      currentUserData = uData.data;
      currentTrips = tData.success ? tData.data : [];
      updateStatsUI();
      renderCO2Chart(currentTrips);
    }
  } catch (e) {
    console.error("Failed to load user data:", e);
  }
}

// 3. The Calculation Engine
async function calculateCarbon() {
  const from = document.getElementById('calcFrom').value.trim();
  const to = document.getElementById('calcTo').value.trim();
  const mode = document.getElementById('transportMode').value;
  const btn = document.getElementById('btnCalculate');
  const resultDiv = document.getElementById('carbonResult');

  if (!from || !to) {
    showToast("Please enter both origin and destination.", "warn");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Finding Route...';

  try {
    // 🌍 Step A: Geocode cities to get Lat/Lon
    const [res1, res2] = await Promise.all([
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(from)}&count=1`),
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(to)}&count=1`)
    ]);
    
    const d1 = await res1.json();
    const d2 = await res2.json();

    if (!d1.results || !d2.results) {
      showToast("Could not find one of those cities. Try adding the country name.", "error");
      btn.disabled = false;
      btn.innerHTML = 'Calculate Eco Impact';
      return;
    }

    // Step B: Ask the backend to calculate distance, footprint, baseline, and savings.
    const calcRes = await fetch('/api/trips/calculate-carbon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transportMode: mode,
        stops: [
          { location: { lat: d1.results[0].latitude, lng: d1.results[0].longitude } },
          { location: { lat: d2.results[0].latitude, lng: d2.results[0].longitude } }
        ]
      })
    });
    const calcData = await calcRes.json();

    if (!calcRes.ok || !calcData.success) {
      showToast(calcData.message || "Could not calculate that route.", "error");
      return;
    }

    const dist = Number(calcData.distanceKm) || 0;
    const userEmissions = Number(calcData.carbonFootprintKg) || 0;
    const petrolBaseline = Number(calcData.baselineFootprintKg) || 0;
    const savings = Number(calcData.carbonSavedKg) || 0;
    const resolvedMode = calcData.transportMode || mode;

    // 🎨 Step D: Update UI
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
      <div class="stat-card border-success" style="border-width:2px;">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="text-muted small">Route: <strong>${d1.results[0].name} → ${d2.results[0].name}</strong></span>
          <span class="badge bg-light text-dark">${Math.round(dist)} km</span>
        </div>
        <div class="text-center py-3">
          <div class="small text-muted mb-1">By choosing <strong>${resolvedMode.replace('_',' ')}</strong>, you:</div>
          <h2 class="${savings >= 0 ? 'text-success' : 'text-danger'} fw-bold mb-0">
            ${savings >= 0 ? 'Saved ' : 'Added '} ${Math.abs(savings).toFixed(2)} kg CO₂
          </h2>
          <p class="text-muted small mt-2">${userEmissions.toFixed(2)}kg produced vs. ${petrolBaseline.toFixed(2)}kg petrol baseline</p>
        </div>
        <button class="btn btn-success w-100" onclick="logEcoProgress(${savings.toFixed(2)})">
          <i class="bi bi-plus-circle-fill"></i> Add to My Eco Progress
        </button>
      </div>
    `;

    showToast("Calculation complete! 🌿");
  } catch (e) {
    showToast("Network error. Please try again.", "error");
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-lightning-charge"></i> Calculate Eco Impact';
  }
}

/* ── 1. DISTANCE & MATH LOGIC ── */

// Haversine Formula: Calculates distance between two points on Earth
function calculateHaversine(p1, p2) {
  const R = 6371; // km
  const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
  const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  // okay we multiply by 1.2 to account for routing assume that paths are not perfectly straight
  return R * c * 1.2;
}
  
// okay it will send the calculation to the Planner page to be added as an activity idea, and then the user can choose to add it to their progress when they complete the activity
// In carbon.js: Silently save to Planner Ideas without redirecting
async function logEcoProgress(savings) {
    const from = document.getElementById('calcFrom').value;
    const to = document.getElementById('calcTo').value;
    const mode = document.getElementById('transportMode').options[document.getElementById('transportMode').selectedIndex].text;

    const savingsKg = Math.max(0, parseFloat(savings));

    // 1. Directly update user.co2Saved in MongoDB
    const email = localStorage.getItem('ecoUserEmail');
    if (email && currentUserData) {
        const newTotal = Math.round(((currentUserData.co2Saved || 0) + savingsKg) * 10) / 10;
        try {
            await fetch(`/api/users/${email}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ co2Saved: newTotal })
            });
            currentUserData.co2Saved = newTotal;
            updateStatsUI();
        } catch (e) {
            console.error("Failed to update co2Saved:", e);
        }
    }

    // 2. Also save as a planner activity idea (tagged so planner won't count it as footprint)
    const newActivity = {
        id: 'eco_' + Date.now(),
        icon: '🚌',
        name: `Travel: ${from.split(',')[0]} → ${to.split(',')[0]}`,
        sub: `Transport: ${mode}`,
        time: 'Flexible',
        carbon: savingsKg,
        source: 'calculator'
    };
    let pendingIdeas = JSON.parse(localStorage.getItem('ecoPendingIdeas') || '[]');
    pendingIdeas.push(newActivity);
    localStorage.setItem('ecoPendingIdeas', JSON.stringify(pendingIdeas));

    // 3. UI feedback
    showToast("Eco savings logged & saved to Planner! 🌿");
    document.getElementById('carbonResult').style.display = 'none';
    document.getElementById('calcFrom').value = '';
    document.getElementById('calcTo').value = '';
}

// UI rendering for stats and progress bars
function updateStatsUI() {
  const goal      = parseInt(localStorage.getItem('ecoGoalCO2') || '500');
  const saved     = currentUserData.co2Saved     || 0;
  const footprint = currentUserData.co2Footprint || 0;
  const pct       = Math.min(100, Math.round((saved / goal) * 100));
  const trees     = (saved / 22).toFixed(1);

  document.getElementById('totalSaved').textContent    = saved;
  document.getElementById('goalText').textContent      = goal;
  document.getElementById('goalProgress').style.width  = pct + '%';

  const treeEl = document.getElementById('treesSaved');
  if (treeEl) treeEl.textContent = trees;

  const fpEl = document.getElementById('totalFootprint');
  if (fpEl) fpEl.textContent = footprint;
}

function renderCO2Chart(trips = []) {
  const ctx = document.getElementById('co2Chart');
  if (!ctx) return;
  if (co2ChartInst) co2ChartInst.destroy();

  // Build last-6-month labels
  const now    = new Date();
  const labels = [];
  const co2Data = [];
  const goalLine = [];
  const monthlyGoal = parseInt(localStorage.getItem('ecoGoalCO2') || '500') / 6;

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));

    // Sum carbon from all stops in trips created this month
    const monthCO2 = trips.reduce((sum, trip) => {
      const created = new Date(trip.createdAt);
      if (created.getFullYear() !== d.getFullYear() || created.getMonth() !== d.getMonth()) return sum;
      return sum + (trip.days || []).reduce((ds, day) =>
        ds + (day.stops || []).reduce((ss, stop) => ss + (parseFloat(stop.carbon) || 0), 0), 0);
    }, 0);

    co2Data.push(+monthCO2.toFixed(1));
    goalLine.push(+monthlyGoal.toFixed(1));
  }

  co2ChartInst = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'CO₂ Saved (kg)',
          data: co2Data,
          backgroundColor: 'rgba(45,106,79,.75)',
          borderRadius: 6
        },
        {
          type: 'line',
          label: 'Monthly Target',
          data: goalLine,
          borderColor: '#f39c12',
          borderDash: [5, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } }
      },
      scales: {
        y: { grid: { color: '#f0f5f2' }, ticks: { font: { size: 10 } }, beginAtZero: true },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

// Modal Helpers
function openGoalModal() { document.getElementById('goalModal').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function saveGoal() {
  const val = document.getElementById('goalInput').value;
  if (val > 0) {
    localStorage.setItem('ecoGoalCO2', val);
    updateStatsUI();
    renderCO2Chart(currentTrips);
    closeModal('goalModal');
    showToast("New goal set! 🎯");
  }
}

loadCarbon();

async function fetchLocationHints(inputId, suggestionId) {
    const query = document.getElementById(inputId).value.trim();
    const suggestionBox = document.getElementById(suggestionId);

    // Only search if user types 3+ characters to save API calls
    if (query.length < 3) {
        suggestionBox.style.display = 'none';
        return;
    }

    try {
        // Calling the Geocoding Map API
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            suggestionBox.innerHTML = data.results.map(loc => `
                <div class="suggestion-item" onclick="selectLocation('${inputId}', '${suggestionId}', '${loc.name}', '${loc.country}', ${loc.latitude}, ${loc.longitude})">
                    <i class="bi bi-geo-alt-fill me-2 text-muted"></i>
                    <div>
                        <div class="fw-bold" style="font-size:0.85rem;">${loc.name}</div>
                        <div class="text-muted" style="font-size:0.75rem;">${loc.admin1 ? loc.admin1 + ', ' : ''}${loc.country}</div>
                    </div>
                </div>
            `).join('');
            suggestionBox.style.display = 'block';
        } else {
            suggestionBox.style.display = 'none';
        }
    } catch (error) {
        console.error("Map API Error:", error);
    }
}

/**
 * Handles clicking a suggestion
 */
function selectLocation(inputId, suggestionId, name, country, lat, lon) {
    const input = document.getElementById(inputId);
    input.value = `${name}, ${country}`;
    
    // Store the precise lat/lon on the element to avoid re-fetching during calculation!
    input.dataset.lat = lat;
    input.dataset.lon = lon;
    
    document.getElementById(suggestionId).style.display = 'none';
}

// Scripts load after DOM when placed at bottom of <body> — attach directly
const calcFromEl = document.getElementById('calcFrom');
const calcToEl = document.getElementById('calcTo');
if (calcFromEl) calcFromEl.addEventListener('input', () => fetchLocationHints('calcFrom', 'fromSuggestions'));
if (calcToEl) calcToEl.addEventListener('input', () => fetchLocationHints('calcTo', 'toSuggestions'));

document.addEventListener('click', (e) => {
    if (!e.target.closest('.position-relative')) {
        const fromSug = document.getElementById('fromSuggestions');
        const toSug = document.getElementById('toSuggestions');
        if (fromSug) fromSug.style.display = 'none';
        if (toSug) toSug.style.display = 'none';
    }
});
