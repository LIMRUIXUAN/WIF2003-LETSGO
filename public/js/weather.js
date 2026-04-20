/* ═══════════════════════════════════════════════════════════
   weather.js  —  Owner: Chin Kin Hiung
   Weather API fetch and forecast rendering
   Used by: weather.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── DATA ── */
const WEATHER_DATA = {
  'Kuala Lumpur':     { temp:30, feels:34, condition:'Partly Cloudy', humidity:78, wind:14, icon:'⛅', forecast:[{d:'Wed',icon:'⛅',hi:30,lo:24},{d:'Thu',icon:'🌧',hi:28,lo:23},{d:'Fri',icon:'☀️',hi:32,lo:25},{d:'Sat',icon:'⛅',hi:29,lo:24},{d:'Sun',icon:'🌤',hi:31,lo:25}] },
  'Langkawi':         { temp:33, feels:37, condition:'Sunny',         humidity:65, wind:18, icon:'☀️', forecast:[{d:'Wed',icon:'☀️',hi:33,lo:27},{d:'Thu',icon:'🌤',hi:32,lo:26},{d:'Fri',icon:'☀️',hi:34,lo:27},{d:'Sat',icon:'☀️',hi:33,lo:26},{d:'Sun',icon:'⛅',hi:31,lo:25}] },
  'Cameron Highlands':{ temp:18, feels:16, condition:'Foggy',         humidity:92, wind:8,  icon:'🌫', forecast:[{d:'Wed',icon:'🌫',hi:18,lo:12},{d:'Thu',icon:'🌧',hi:16,lo:11},{d:'Fri',icon:'⛅',hi:19,lo:13},{d:'Sat',icon:'🌤',hi:20,lo:13},{d:'Sun',icon:'⛅',hi:18,lo:12}] },
};

/* ── FUNCTIONS ── */
function loadWeather() {
  const cityInput = document.getElementById('weatherCity');
  if (!cityInput) return; // Failsafe if element doesn't exist
  
  const city = cityInput.value.trim() || 'Kuala Lumpur';
  const data = WEATHER_DATA[city] || WEATHER_DATA['Kuala Lumpur'];

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
        <div style="font-size:.85rem; opacity:.8; margin-bottom:.5rem;">${city}</div>
        <div style="display:flex; align-items:flex-end; gap:12px;">
          <div class="weather-temp">${data.icon} ${data.temp}°C</div>
        </div>
        <div class="weather-desc">${data.condition}</div>
        <div style="margin-top:1rem; display:flex; gap:1rem; font-size:.82rem; opacity:.85;">
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

/* ── INITIALIZATION ── */
document.addEventListener('DOMContentLoaded', () => {
  loadWeather();
});