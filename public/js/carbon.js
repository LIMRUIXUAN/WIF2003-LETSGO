/* ═══════════════════════════════════════════════════════════
   carbon.js  —  Owner: Chin Kin Hiung
   Advanced CO2 math, Group Logic, Distance Auto-Calculation
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── DATA & STATE ── */
// Emission factors based on DEFRA/EPA standard averages (g CO2/km)
const TRANSPORT_FACTORS = { flight: 255, car: 171, train: 41, bus: 68 };
const ACCOM_FACTOR      = 21; // kg CO₂ per night per room
let selectedTransport   = { type: 'flight', factor: 255 };

// Store coordinates for automated distance calculation
let locationCoords = {
  from: null, // { lat, lon }
  to: null    // { lat, lon }
};

/* ── 1. DISTANCE & MATH LOGIC ── */

// Haversine Formula: Calculates distance between two points on Earth
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Multiply by 1.2 to account for routing (roads/flight paths aren't perfectly straight)
  return Math.round((R * c) * 1.2); 
}

function updateDistance() {
  if (locationCoords.from && locationCoords.to) {
    const dist = calculateHaversineDistance(
      locationCoords.from.lat, locationCoords.from.lon,
      locationCoords.to.lat, locationCoords.to.lon
    );
    document.getElementById('carbonDist').value = dist;
    calcCarbon(); // Trigger calculation when distance updates
  }
}

/* ── 2. AUTOCOMPLETE GEOLOCATION LOGIC ── */
let debounceTimer;

async function fetchLocationSuggestions(query, targetId) {
  const suggestBox = document.getElementById(targetId === 'carbonFrom' ? 'suggestFrom' : 'suggestTo');
  
  if (query.length < 2) {
    suggestBox.style.display = 'none';
    return;
  }

  try {
    // Increased count to 10 so we have enough data to filter out duplicates
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`);
    const data = await res.json();
    
    if (!data.results || data.results.length === 0) {
      suggestBox.style.display = 'none';
      return;
    }

    // --- NEW: Deduplication Logic ---
    const uniqueCities = [];
    const seenIdentifiers = new Set();

    for (const city of data.results) {
      // Create a unique identifier based on name and country
      const identifier = `${city.name}-${city.country || ''}`;
      
      // If we haven't seen this specific city/country combo yet, add it
      if (!seenIdentifiers.has(identifier)) {
        seenIdentifiers.add(identifier);
        uniqueCities.push(city);
      }
      
      // Stop once we have 5 unique suggestions
      if (uniqueCities.length >= 5) break; 
    }

    // Render the unique cities
    suggestBox.innerHTML = uniqueCities.map(city => `
      <div class="suggestion-item" style="padding:10px 16px; font-size:0.88rem; cursor:pointer; color:#1a2e1e; border-bottom:1px solid #f0f7f4;" 
           onmouseover="this.style.background='#f0f7f4'" onmouseout="this.style.background='transparent'"
           onclick="selectLocation('${targetId}', '${city.name}, ${city.country || ''}', ${city.latitude}, ${city.longitude})">
        <i class="bi bi-geo-alt" style="color:#9ab3a0; margin-right:8px;"></i> 
        <strong>${city.name}</strong> <span style="color:#9ab3a0; font-size:0.8rem;">${city.admin1 ? ', ' + city.admin1 : ''} ${city.country ? '(' + city.country + ')' : ''}</span>
      </div>
    `).join('');
    
    suggestBox.style.display = 'block';
  } catch (error) {
    console.error("Geocoding fetch failed", error);
  }
}

function selectLocation(targetId, fullName, lat, lon) {
  document.getElementById(targetId).value = fullName;
  document.getElementById(targetId === 'carbonFrom' ? 'suggestFrom' : 'suggestTo').style.display = 'none';
  
  // Save coordinates
  if (targetId === 'carbonFrom') locationCoords.from = { lat, lon };
  if (targetId === 'carbonTo') locationCoords.to = { lat, lon };
  
  updateDistance();
}

// Close dropdowns if clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.position-relative')) {
    document.getElementById('suggestFrom').style.display = 'none';
    document.getElementById('suggestTo').style.display = 'none';
  }
});


/* ── 3. CARBON CALCULATION & UI ── */
function selectTransport(el, type, factor) {
  document.querySelectorAll('.transport-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedTransport = { type, factor };
  calcCarbon();
}

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 4);
    obj.innerHTML = Math.floor(easeOut * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerHTML = end;
    }
  };
  window.requestAnimationFrame(step);
}

function calcCarbon() {
  const distInput = document.getElementById('carbonDist');
  const paxInput  = document.getElementById('carbonPax');
  if (!distInput || !paxInput) return;

  const dist   = parseFloat(distInput.value) || 0;
  const pax    = parseInt(paxInput.value) || 1;
  const nights = parseInt(document.getElementById('accomNights').value) || 0;

  let travelEmit = 0;
  if (selectedTransport.type === 'car') {
    const carsNeeded = Math.ceil(pax / 4);
    travelEmit = (dist * TRANSPORT_FACTORS.car * carsNeeded) / 1000;
  } else {
    travelEmit = (dist * selectedTransport.factor * pax) / 1000;
  }

  const roomsNeeded = Math.ceil(pax / 2);
  const accomEmit  = nights * ACCOM_FACTOR * roomsNeeded;
  
  const total = Math.round(travelEmit + accomEmit);
  const trees = Math.ceil(total / 21);

  const totalDisplay = document.getElementById('carbonTotal');
  const oldTotal = parseInt(totalDisplay.innerText) || 0;
  animateValue(totalDisplay, oldTotal, total, 800);

  document.getElementById('treesCount').textContent = trees;

  renderComparison(dist, pax);
  renderOffsetSuggestions(total, trees);
}

function renderComparison(dist, pax) {
  const container = document.getElementById('comparisonBars');
  const modes = [
    { name: '✈️ Flight', type: 'flight', color: '#e74c3c', calc: (dist * TRANSPORT_FACTORS.flight * pax) / 1000 },
    { name: '🚗 Car',    type: 'car',    color: '#e67e22', calc: (dist * TRANSPORT_FACTORS.car * Math.ceil(pax/4)) / 1000 },
    { name: '🚌 Bus',    type: 'bus',    color: '#f39c12', calc: (dist * TRANSPORT_FACTORS.bus * pax) / 1000 },
    { name: '🚂 Train',  type: 'train',  color: '#27ae60', calc: (dist * TRANSPORT_FACTORS.train * pax) / 1000 },
  ];
  
  const max = Math.max(...modes.map(m => m.calc));

  container.innerHTML = modes.map(m => {
    const val = Math.round(m.calc);
    const pct = max > 0 ? Math.round((val / max) * 100) : 0;
    const isSelected = m.type === selectedTransport.type;
    return `
      <div style="margin-bottom:.75rem;">
        <div style="display:flex; justify-content:space-between; font-size:.8rem; margin-bottom:4px;">
          <span style="font-weight:${isSelected ? '700' : '400'}">${m.name}</span>
          <span style="font-weight:600; color:${m.color}">${val} kg CO₂</span>
        </div>
        <div class="progress-eco">
          <div style="width:${pct}%; height:100%; border-radius:10px; background:${m.color}; transition:width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
        </div>
      </div>`;
  }).join('');
}

function renderOffsetSuggestions(total, trees) {
  // Replace carbon credits with Operational Cost Savings logic
  // Estimate: Optimizing eco-efficiency saves roughly RM 0.85 per kg of CO2 reduced
  const costSavings = Math.round(total * 0.85).toLocaleString(); 
  
  const smartphones = (total * 121).toLocaleString();
  const burgers = Math.round(total / 3.6).toLocaleString();

  document.getElementById('offsetSuggestions').innerHTML = `
    <div style="background:#fff; border-radius:16px; padding:1.2rem; border:1px solid #e8f0eb;">
      <strong style="font-size:.9rem; display:block; margin-bottom:.75rem;">Impact & Savings 🌱</strong>
      
      <div class="offset-tip mb-3" style="background:#f0f7f4; border-color:var(--eco-green-light);">
        <strong>🌳 Plant ${trees} trees</strong> — offsets this trip for 1 year
      </div>
      <div class="offset-tip mb-3" style="background:#e3f0fb; border-color:#2196f3;">
        <strong>💰 RM ${costSavings}</strong> — Est. Operational Cost Savings via eco-efficiency
      </div>

      <hr style="border-top:1px dashed #d4e6d9; margin: 1rem 0;">
      
      <strong style="font-size:.85rem; color:#4a5e4f; display:block; margin-bottom:8px;">This trip's emission is equivalent to:</strong>
      <div style="display:flex; justify-content:space-between; text-align:center; gap:8px;">
        <div style="flex:1; background:#fafffe; padding:8px; border-radius:12px; border:1px solid #e8f0eb;">
          <div style="font-size:1.5rem;">📱</div>
          <div style="font-weight:700; font-size:1rem; color:#2d6a4f;">${smartphones}</div>
          <div style="font-size:.7rem; color:#9ab3a0;">Phones Charged</div>
        </div>
        <div style="flex:1; background:#fafffe; padding:8px; border-radius:12px; border:1px solid #e8f0eb;">
          <div style="font-size:1.5rem;">🍔</div>
          <div style="font-weight:700; font-size:1rem; color:#2d6a4f;">${burgers}</div>
          <div style="font-size:.7rem; color:#9ab3a0;">Beef Burgers</div>
        </div>
      </div>
    </div>`;
}

/* ── 4. INITIALIZATION & EVENT LISTENERS ── */
document.addEventListener('DOMContentLoaded', () => {
  calcCarbon();

  // Setup debounce listeners for both origin and destination inputs
  ['carbonFrom', 'carbonTo'].forEach(id => {
    const inputEl = document.getElementById(id);
    if (inputEl) {
      inputEl.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchLocationSuggestions(e.target.value.trim(), id);
        }, 300);
      });
    }
  });
});