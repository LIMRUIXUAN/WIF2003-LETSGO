/* ═══════════════════════════════════════════════════════════
   weather.js  —  Owner: Chin Kin Hiung
   Live API Fetch, Autocomplete, Recent Searches & Eco-Packing
   ═══════════════════════════════════════════════════════════ */

'use strict';

// Auth guard - redirect to login if no session
(function guardAuth() {
  const email = localStorage.getItem('ecoUserEmail');
  const token = localStorage.getItem('ecoAuthToken');
  if (!email || !token) {
    window.location.href = 'login.html';
  }
})();

/* ── 1. HELPERS & FULL WMO MAPPING (No more ❓) ── */
function getWeatherInterpretation(code, isDay = 1) {
  const weatherCodes = {
    0: { desc: 'Clear sky', icon: isDay ? '☀️' : '🌙' },
    1: { desc: 'Mainly clear', icon: isDay ? '🌤' : '🌙' },
    2: { desc: 'Partly cloudy', icon: '⛅' },
    3: { desc: 'Overcast', icon: '☁️' },
    45: { desc: 'Fog', icon: '🌫' },
    48: { desc: 'Depositing rime fog', icon: '🌫' },
    51: { desc: 'Light drizzle', icon: '🌧' },
    53: { desc: 'Moderate drizzle', icon: '🌧' },
    55: { desc: 'Dense drizzle', icon: '🌧' },
    56: { desc: 'Light freezing drizzle', icon: '🌧❄️' },
    57: { desc: 'Dense freezing drizzle', icon: '🌧❄️' },
    61: { desc: 'Slight rain', icon: '🌧' },
    63: { desc: 'Moderate rain', icon: '🌧' },
    65: { desc: 'Heavy rain', icon: '🌧' },
    66: { desc: 'Light freezing rain', icon: '🌧❄️' },
    67: { desc: 'Heavy freezing rain', icon: '🌧❄️' },
    71: { desc: 'Slight snow', icon: '❄️' },
    73: { desc: 'Moderate snow', icon: '❄️' },
    75: { desc: 'Heavy snow', icon: '❄️' },
    77: { desc: 'Snow grains', icon: '❄️' },
    80: { desc: 'Slight rain showers', icon: '🌦' },
    81: { desc: 'Moderate rain showers', icon: '🌦' },
    82: { desc: 'Violent rain showers', icon: '⛈' },
    85: { desc: 'Slight snow showers', icon: '❄️' },
    86: { desc: 'Heavy snow showers', icon: '❄️' },
    95: { desc: 'Thunderstorm', icon: '⛈' },
    96: { desc: 'Thunderstorm with hail', icon: '⛈' },
    99: { desc: 'Heavy thunderstorm with hail', icon: '⛈' }
  };
  return weatherCodes[code] || { desc: 'Unknown', icon: '☁️' }; // Safer fallback
}

function getDayOfWeek(dateString) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateString).getDay()];
}

/* ── 2. LIVE AUTOCOMPLETE / SUGGESTIONS ── */
let debounceTimer;

async function fetchSuggestions(query) {
  const suggestBox = document.getElementById('citySuggestions');
  
  if (query.length < 2) {
    suggestBox.style.display = 'none';
    return;
  }

  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    const data = await res.json();
    
    if (!data.results || data.results.length === 0) {
      suggestBox.style.display = 'none';
      return;
    }

    suggestBox.innerHTML = data.results.map(city => `
      <div class="suggestion-item" style="padding:10px 16px; font-size:0.88rem; cursor:pointer; color:#1a2e1e; border-bottom:1px solid #f0f7f4;" 
           onmouseover="this.style.background='#f0f7f4'" onmouseout="this.style.background='transparent'"
           onclick="selectSuggestion('${city.name}, ${city.country || ''}')">
        <i class="bi bi-geo-alt" style="color:#9ab3a0; margin-right:8px;"></i> 
        <strong>${city.name}</strong> <span style="color:#9ab3a0; font-size:0.8rem;">${city.admin1 ? ', ' + city.admin1 : ''} ${city.country ? '(' + city.country + ')' : ''}</span>
      </div>
    `).join('');
    
    suggestBox.style.display = 'block';
  } catch (error) {
    console.error("Suggestion fetch failed", error);
  }
}

function selectSuggestion(fullName) {
  const input = document.getElementById('weatherCity');
  input.value = fullName;
  document.getElementById('citySuggestions').style.display = 'none';
  loadWeather(); // Trigger search immediately
}

// Close dropdown if clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-bar-wrap')) {
    const suggestBox = document.getElementById('citySuggestions');
    if (suggestBox) suggestBox.style.display = 'none';
  }
});


/* ── 3. RECENT SEARCHES (LOCALSTORAGE) ── */
function updateRecentSearches(cityName) {
  // Tie the search history to the currently logged-in user
  const userEmail = localStorage.getItem('ecoUserEmail') || 'guest';
  const storageKey = `eco_recent_searches_${userEmail}`;

  let searches = JSON.parse(localStorage.getItem(storageKey) || '[]');
  searches = searches.filter(s => s.toLowerCase() !== cityName.toLowerCase());
  searches.unshift(cityName);
  searches = searches.slice(0, 4); // Keep top 4
  
  localStorage.setItem(storageKey, JSON.stringify(searches));
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = document.getElementById('recentSearches');
  if (!container) return;
  
  // Retrieve the search history for the currently logged-in user
  const userEmail = localStorage.getItem('ecoUserEmail') || 'guest';
  const storageKey = `eco_recent_searches_${userEmail}`;

  let searches = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (searches.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = `
    <span style="font-size: 0.85rem; color: #9ab3a0; margin-right: 4px;">Recent:</span>
    ${searches.map(city => `
      <button class="filter-chip" style="padding: 4px 12px; font-size: 0.8rem;" onclick="selectSuggestion('${city}')">
        <i class="bi bi-clock-history"></i> ${city}
      </button>
    `).join('')}
  `;
}


/* ── 4. ECO-PACKING LOGIC ── */
function getPackingList(temp, weatherCode) {
  let items = ['Reusable water bottle', 'Bamboo utensils / Metal straw']; 
  if (temp > 28) items.push('Reef-safe sunscreen', 'Hat or Visor');
  else if (temp < 20) items.push('Light jacket', 'Reusable thermal flask');
  
  const rainCodes = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
  if (rainCodes.includes(weatherCode)) {
      items.push('Eco-friendly rain poncho', 'Water-resistant walking shoes');
  } else if ([0,1,2].includes(weatherCode) && !items.includes('Hat or Visor')) {
      items.push('Sunglasses');
  }
  return items;
}


/* ── 5. MAIN WEATHER FETCH ── */
async function loadWeather() {
  const cityInput = document.getElementById('weatherCity');
  if (!cityInput) return;

  const city = cityInput.value.trim() || 'Kuala Lumpur';
  const display = document.getElementById('weatherDisplay');

  display.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-2" style="color:#9ab3a0;">Fetching live eco-weather for ${city}...</p>
    </div>`;

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      display.innerHTML = `<div class="col-12 text-center py-4 text-danger">City not found. Please try another location.</div>`;
      return;
    }

    const { latitude, longitude, name } = geoData.results[0];
    updateRecentSearches(name); // Save to recent

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
    const weatherData = await weatherRes.json();

    const current = weatherData.current;
    const daily = weatherData.daily;
    const currentInterp = getWeatherInterpretation(current.weather_code, current.is_day);

    const ecoTip = current.temperature_2m > 28
      ? '🌞 Great day for cycling! Avoid peak heat 12–3 pm.'
      : current.temperature_2m < 20
      ? '🧥 Cool weather — perfect for low-impact forest hiking.'
      : '🌿 Ideal conditions for outdoor eco activities!';

    const packingList = getPackingList(current.temperature_2m, current.weather_code);
    const packingHtml = packingList.map(item => `<li style="margin-bottom:4px;">${item}</li>`).join('');

    let forecastHtml = '';
    let bestDaysArr = [];

    for (let i = 1; i <= 5; i++) {
      const dayName = getDayOfWeek(daily.time[i]);
      const interp = getWeatherInterpretation(daily.weather_code[i], 1);
      
      if (['☀️', '🌤', '⛅'].includes(interp.icon)) bestDaysArr.push(dayName);

      forecastHtml += `
        <div class="col">
          <div class="forecast-day">
            <div style="font-size:.75rem; color:#9ab3a0;">${dayName}</div>
            <div class="day-icon">${interp.icon}</div>
            <div class="day-temp">${Math.round(daily.temperature_2m_max[i])}°</div>
            <div style="font-size:.72rem; color:#9ab3a0;">${Math.round(daily.temperature_2m_min[i])}°</div>
          </div>
        </div>`;
    }

    const bestDays = bestDaysArr.length > 0 ? bestDaysArr.join(', ') : 'Check back for clear skies';

    display.innerHTML = `
      <div class="col-md-5">
        <div class="weather-card mb-3">
          <div style="font-size:.85rem; opacity:.8; margin-bottom:.5rem;">${name}</div>
          <div style="display:flex; align-items:flex-end; gap:12px;">
            <div class="weather-temp">${currentInterp.icon} ${Math.round(current.temperature_2m)}°C</div>
          </div>
          <div class="weather-desc">${currentInterp.desc}</div>
          <div style="margin-top:1rem; display:flex; justify-content:space-between; font-size:.82rem; opacity:.85;">
            <span>💧 ${current.relative_humidity_2m}%</span>
            <span>💨 ${Math.round(current.wind_speed_10m)} km/h</span>
            <span>🌡 Feels ${Math.round(current.apparent_temperature)}°C</span>
          </div>
        </div>
        
        <div class="stat-card">
          <strong style="font-size:.85rem; display:block; margin-bottom:.5rem;">Eco Travel Tip</strong>
          <p style="font-size:.82rem; color:#4a5e4f; margin-bottom:1rem;">${ecoTip}</p>
          
          <div style="background:var(--eco-mist); padding:12px; border-radius:12px; border-left:3px solid var(--eco-green-light);">
            <strong style="font-size:.82rem; color:var(--eco-green); display:block; margin-bottom:6px;">🎒 Smart Packing</strong>
            <ul style="font-size:.8rem; color:#4a5e4f; margin:0; padding-left:16px;">
              ${packingHtml}
            </ul>
          </div>
        </div>
      </div>
      
      <div class="col-md-7">
        <div class="stat-card">
          <strong style="font-size:.9rem; display:block; margin-bottom:1rem;">5-Day Forecast</strong>
          <div class="row g-2 mb-3">
            ${forecastHtml}
          </div>
          <div class="offset-tip">
            <strong>🌿 Best eco activity days:</strong> ${bestDays}
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error(error);
    display.innerHTML = `<div class="col-12 text-center py-4 text-danger">Failed to fetch weather data. Check your connection.</div>`;
  }
}

/* ── 6. INITIALIZATION ── */
document.addEventListener('DOMContentLoaded', () => {
  renderRecentSearches();
  loadWeather();
  
  const cityInput = document.getElementById('weatherCity');
  if (cityInput) {
    // Handle Enter key
    cityInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        document.getElementById('citySuggestions').style.display = 'none';
        loadWeather();
      }
    });

    // Handle typing for autocomplete with debounce
    cityInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchSuggestions(e.target.value.trim());
      }, 300); // Waits 300ms after you stop typing
    });
  }
});
