/* ═══════════════════════════════════════════════════════════
   carbon_weather.js  —  Owner: Chin Kin Hiung
   Weather API fetch & CO2 calculation math
   Used by: carbon-weather.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── DATA ── */
const WEATHER_DATA = {
  'Kuala Lumpur':     { temp:30, feels:34, condition:'Partly Cloudy', humidity:78, wind:14, icon:'⛅', forecast:[{d:'Wed',icon:'⛅',hi:30,lo:24},{d:'Thu',icon:'🌧',hi:28,lo:23},{d:'Fri',icon:'☀️',hi:32,lo:25},{d:'Sat',icon:'⛅',hi:29,lo:24},{d:'Sun',icon:'🌤',hi:31,lo:25}] },
  'Langkawi':         { temp:33, feels:37, condition:'Sunny',         humidity:65, wind:18, icon:'☀️', forecast:[{d:'Wed',icon:'☀️',hi:33,lo:27},{d:'Thu',icon:'🌤',hi:32,lo:26},{d:'Fri',icon:'☀️',hi:34,lo:27},{d:'Sat',icon:'☀️',hi:33,lo:26},{d:'Sun',icon:'⛅',hi:31,lo:25}] },
  'Cameron Highlands':{ temp:18, feels:16, condition:'Foggy',         humidity:92, wind:8,  icon:'🌫', forecast:[{d:'Wed',icon:'🌫',hi:18,lo:12},{d:'Thu',icon:'🌧',hi:16,lo:11},{d:'Fri',icon:'⛅',hi:19,lo:13},{d:'Sat',icon:'🌤',hi:20,lo:13},{d:'Sun',icon:'⛅',hi:18,lo:12}] },
};

const TRANSPORT_FACTORS = { flight: 255, car: 171, train: 41, bus: 68 };
const ACCOM_FACTOR      = 21; // kg CO₂ per night (average hotel)

let selectedTransport = { type: 'flight', factor: 255 };

/* ══════════════════════════════════════════════════════════
   WEATHER
   ══════════════════════════════════════════════════════════ */

function loadWeather() {
  const city = document.getElementById('weatherCity').value.trim() || 'Kuala Lumpur';
  const data = WEATHER_DATA[city] || WEATHER_DATA['Kuala Lumpur'];
  // TODO: replace with real API — GET /api/weather?city=${city}

  const ecoTip = data.temp > 28
    ? '🌞 Great day for cycling or walking! Avoid peak heat 12–3 pm.'
    : data.temp < 20
    ? '🧥 Cool weather — perfect for forest hiking. Bring a light layer.'
    : '🌿 Ideal conditions for outdoor eco activities!';

  const bestDays = data.forecast
    .filter(f => f.icon === '☀️' || f.icon === '🌤')
    .map(f => f.d).join(', ') || 'Check back for clear skies';

  document.getElementById('weatherDisplay').innerHTML = `
    <div class="col-md-5">
      <div class="weather-card mb-3">
        <div style="font-size:.85rem; opacity:.8; margin-bottom:.5rem; position:relative; z-index:1;">${city}</div>
        <div style="display:flex; align-items:flex-end; gap:12px; position:relative; z-index:1;">
          <div class="weather-temp">${data.icon} ${data.temp}°C</div>
        </div>
        <div class="weather-desc" style="position:relative; z-index:1;">${data.condition}</div>
        <div style="margin-top:1rem; display:flex; gap:1rem; font-size:.82rem; opacity:.85; position:relative; z-index:1;">
          <span>💧 ${data.humidity}%</span>
          <span>💨 ${data.wind} km/h</span>
          <span>🌡 Feels ${data.feels}°C</span>
        </div>
      </div>
      <div class="stat-card">
        <strong style="font-size:.85rem; display:block; margin-bottom:.75rem;">Eco Travel Tip</strong>
        <p style="font-size:.82rem; color:#4a5e4f; line-height:1.6;">${ecoTip}</p>
      </div>
    </div>
    <div class="col-md-7">
      <div class="stat-card">
        <strong style="font-size:.9rem; display:block; margin-bottom:1rem;">5-Day Forecast</strong>
        <div class="row g-2">
          ${data.forecast.map(f => `
            <div class="col">
              <div class="forecast-day">
                <div style="font-size:.75rem; color:#9ab3a0;">${f.d}</div>
                <div class="day-icon">${f.icon}</div>
                <div class="day-temp">${f.hi}°</div>
                <div style="font-size:.72rem; color:#9ab3a0;">${f.lo}°</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="mt-3 offset-tip">
          <strong>🌿 Best eco activity days:</strong> ${bestDays}
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════
   CARBON CALCULATOR
   ══════════════════════════════════════════════════════════ */

function selectTransport(el, type, factor) {
  document.querySelectorAll('.transport-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedTransport = { type, factor };
  calcCarbon();
}

function calcCarbon() {
  const dist   = parseFloat(document.getElementById('carbonDist').value) || 0;
  const nights = parseInt(document.getElementById('accomNights').value)  || 0;

  const travelEmit = (dist * selectedTransport.factor) / 1000;
  const accomEmit  = nights * ACCOM_FACTOR;
  const total      = Math.round(travelEmit + accomEmit);
  const trees      = Math.ceil(total / 21);

  document.getElementById('carbonTotal').textContent = total;
  document.getElementById('treesCount').textContent  = trees;

  renderComparison(dist);
  renderOffsetSuggestions(total, trees);
}

function renderComparison(dist) {
  const container = document.getElementById('comparisonBars');
  const modes = [
    { name: '✈️ Flight', type: 'flight', color: '#e74c3c' },
    { name: '🚗 Car',    type: 'car',    color: '#e67e22' },
    { name: '🚌 Bus',    type: 'bus',    color: '#f39c12' },
    { name: '🚂 Train',  type: 'train',  color: '#27ae60' },
  ];
  const max = Math.max(...modes.map(m => (dist * TRANSPORT_FACTORS[m.type]) / 1000));

  container.innerHTML = modes.map(m => {
    const val        = Math.round((dist * TRANSPORT_FACTORS[m.type]) / 1000);
    const pct        = max > 0 ? Math.round((val / max) * 100) : 0;
    const isSelected = m.type === selectedTransport.type;
    return `
      <div style="margin-bottom:.75rem;">
        <div style="display:flex; justify-content:space-between; font-size:.8rem; margin-bottom:4px;">
          <span style="font-weight:${isSelected ? '700' : '400'}">${m.name}</span>
          <span style="font-weight:600; color:${m.color}">${val} kg CO₂</span>
        </div>
        <div class="progress-eco">
          <div style="width:${pct}%; height:100%; border-radius:10px; background:${m.color};
               transition:width .8s ease;"></div>
        </div>
      </div>`;
  }).join('');
}

function renderOffsetSuggestions(total, trees) {
  const credits   = Math.round(total * 0.025);
  const trainSave = Math.round(total * 0.8);

  document.getElementById('offsetSuggestions').innerHTML = `
    <div style="background:#fff; border-radius:16px; padding:1.2rem; border:1px solid #e8f0eb;">
      <strong style="font-size:.9rem; display:block; margin-bottom:.75rem;">Offset Suggestions 🌱</strong>
      <div class="offset-tip"><strong>🌳 Plant ${trees} trees</strong> — partners with Eden Reforestation Projects</div>
      <div class="offset-tip mt-2"><strong>💳 Buy RM ${credits} carbon credits</strong> — verified Gold Standard offsets</div>
      <div class="offset-tip mt-2"><strong>🚲 Switch to train/bus</strong> — saves ${trainSave} kg CO₂ vs flying</div>
      <div style="font-size:.75rem; color:#9ab3a0; margin-top:.75rem;">
        Your trip emits ${total} kg CO₂ — equivalent to planting ${trees} trees for a year to offset.
      </div>
    </div>`;
}

/* Auto-run calculator and weather on page load */
document.addEventListener('DOMContentLoaded', () => {
  calcCarbon();
  loadWeather();
});
