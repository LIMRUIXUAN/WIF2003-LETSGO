'use strict';

    let GOAL_CO2 = parseInt(localStorage.getItem('ecoGoalCO2') || '500', 10);
    let _lastUser = null, _lastTrips = [];

    if (typeof requirePageAuth === 'function') {
      requirePageAuth();
    }

    async function loadDashboard() {
      const email = localStorage.getItem('ecoUserEmail');
      if (!email) { if (typeof redirectToLogin === 'function') redirectToLogin(); return; }

      const listingsPromise = loadListingsFromAPI().catch((error) => {
        console.error('Failed to load dashboard destination data:', error);
        return [];
      });

      let user = null, trips = [];
      try {
        const [uRes, tRes] = await Promise.all([
          fetch(`/api/users/profile/${email}`),
          fetch(`/api/trips/${email}`)
        ]);
        const uData = await uRes.json();
        const tData = await tRes.json();
        if (uData.success) user = uData.data;
        if (tData.success) trips = tData.data;
        _lastUser = user; _lastTrips = trips;
      } catch (e) {
        showToast('Could not reach server. Some data may be unavailable.', 'warn');
      }

      renderWelcome(user);
      renderStreak(trips);
      renderCountdown(trips);
      renderStats(user, trips);
      renderTrips(trips);
      renderFavs(user);
      renderCO2Chart(user, trips);
      renderWeatherWidget(user);
      renderProfileSummary(user);

      await listingsPromise;
      renderStats(user, trips);
      renderFavs(user);
    }

    function renderWelcome(user) {
      const firstName = user ? user.name.split(' ')[0] : 'Traveller';
      const h = new Date().getHours();
      const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      document.getElementById('welcomeMsg').textContent = `${greet}, ${firstName}! 👋`;
      document.getElementById('welcomeSub').textContent = 'Here\'s your eco travel overview for today.';
      const el = document.getElementById('navInitial');
      if (el && user) el.textContent = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    function renderStreak(trips) {
      const banner = document.getElementById('streakBanner');
      if (!trips.length) return;

      // Get the Monday of the week containing a date
      function weekStart(date) {
        const d = new Date(date); d.setHours(0, 0, 0, 0);
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        return d.getTime();
      }

      const today = new Date();
      const activeWeeks = new Set(trips.map(t => weekStart(new Date(t.createdAt))));

      // Count consecutive weeks going back from current week
      let streak = 0;
      let check = weekStart(today);
      while (activeWeeks.has(check)) {
        streak++;
        check -= 7 * 86400000;
      }

      // Build last-8-week dots
      const dots = document.getElementById('streakDots');
      dots.innerHTML = '';
      for (let i = 7; i >= 0; i--) {
        const wk = weekStart(today) - i * 7 * 86400000;
        const hit = activeWeeks.has(wk);
        const dot = document.createElement('div');
        dot.title = new Date(wk).toLocaleDateString('default', { month: 'short', day: 'numeric' });
        dot.style.cssText = `width:14px;height:14px;border-radius:50%;background:${hit ? '#2d6a4f' : '#e8f0eb'};transition:background .2s;`;
        dots.appendChild(dot);
      }

      const flame = document.getElementById('streakFlame');
      const title = document.getElementById('streakTitle');
      const sub = document.getElementById('streakSub');

      if (streak === 0) {
        flame.textContent = '🌱';
        title.textContent = 'Start your eco streak!';
        sub.textContent = 'Plan or log a trip this week to begin.';
      } else if (streak < 3) {
        flame.textContent = '🔥';
        title.textContent = `${streak}-week eco streak`;
        sub.textContent = 'Keep it up — plan something eco-friendly this week!';
      } else if (streak < 6) {
        flame.textContent = '🔥🔥';
        title.textContent = `${streak}-week eco streak — Great work!`;
        sub.textContent = 'You\'re building a solid green habit.';
      } else {
        flame.textContent = '🔥🔥🔥';
        title.textContent = `${streak}-week eco streak — Legendary!`;
        sub.textContent = 'You\'re a true eco traveller. Keep the streak alive!';
      }

      banner.style.display = 'flex';
    }

    function renderCountdown(trips) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const upcoming = trips
        .filter(t => t.start && new Date(t.start) >= today)
        .sort((a, b) => new Date(a.start) - new Date(b.start));

      const banner = document.getElementById('countdownBanner');
      const text = document.getElementById('countdownText');
      if (!upcoming.length) return;

      const next = upcoming[0];
      const diff = Math.round((new Date(next.start) - today) / 86400000);
      const dest = esc(next.city || next.name);

      let msg;
      if (diff === 0) msg = `🎒 Your trip to <strong>${dest}</strong> starts <strong>today</strong>! Have a great journey.`;
      else if (diff === 1) msg = `✈️ Your trip to <strong>${dest}</strong> starts <strong>tomorrow</strong>!`;
      else msg = `🗓 Your next trip to <strong>${dest}</strong> is in <strong>${diff} days</strong>.`;

      text.innerHTML = msg;
      banner.style.display = 'flex';
    }

    function renderStats(user, trips) {
      const co2 = user ? (user.co2Saved || 0) : 0;
      const footprint = user ? (user.co2Footprint || 0) : 0;
      const favIds = user ? (user.favorites || []) : [];
      const favItems = LISTINGS.filter(l => favIds.includes(l.id));
      const avgEco = favItems.length
        ? (favItems.reduce((s, l) => s + l.eco, 0) / favItems.length).toFixed(1)
        : '–';
      document.getElementById('statTrips').textContent = trips.length;
      document.getElementById('statFavs').textContent = favIds.length;
      document.getElementById('statCO2').textContent = co2;
      document.getElementById('statEco').textContent = avgEco;
      if (footprint > 0) {
        document.getElementById('statFootprint').textContent = footprint;
        document.getElementById('statFootprintCard').style.display = '';
      }
    }

    function tripStatus(start, end) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const s = start ? new Date(start) : null;
      const e = end ? new Date(end) : null;
      if (!s) return 'upcoming';
      if (e && e < today) return 'past';
      if (s <= today && (!e || e >= today)) return 'active';
      return 'upcoming';
    }

    function renderTrips(trips) {
      const c = document.getElementById('tripsList');
      if (!trips.length) {
        c.innerHTML = `<div class="empty-state"><i class="bi bi-map"></i>No trips yet.<br>
      <a href="planner.html" style="color:#40916c;font-weight:600;">Plan your first trip →</a></div>`;
        return;
      }
      const sorted = [...trips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
      c.innerHTML = sorted.map(t => {
        const st = tripStatus(t.start, t.end);
        const cls = st === 'active' ? 'tb-active' : st === 'past' ? 'tb-past' : 'tb-upcoming';
        const lbl = st === 'active' ? 'Active' : st === 'past' ? 'Completed' : 'Upcoming';
        const dt = t.start && t.end ? `${t.start} → ${t.end}` : t.start ? `From ${t.start}` : 'No dates set';
        return `<div class="trip-item">
      <div class="trip-icon">🗺</div>
      <div>
        <div class="trip-name">${esc(t.name)}</div>
        <div class="trip-dates">${esc(t.city || 'Unknown')} · ${dt}</div>
      </div>
      <span class="trip-badge ${cls}">${lbl}</span>
    </div>`;
      }).join('');
    }

    function renderFavs(user) {
      const c = document.getElementById('favsList');
      const ids = user ? (user.favorites || []) : [];
      const list = LISTINGS.filter(l => ids.includes(l.id)).slice(0, 5);
      if (!list.length) {
        c.innerHTML = `<div class="empty-state"><i class="bi bi-heart"></i>No favourites saved yet.<br>
      <a href="explore.html" style="color:#40916c;font-weight:600;">Explore destinations →</a></div>`;
        return;
      }
      c.innerHTML = list.map(l => `
    <div class="fav-mini">
      <div class="fm-icon">${l.icon}</div>
      <div><div class="fm-name">${esc(l.name)}</div><div class="fm-loc">${esc(l.location)}</div></div>
      <div class="fm-score">⭐ ${l.eco}</div>
    </div>`).join('');
    }

    let co2ChartInst = null;

    function renderCO2Chart(user, trips) {
      const co2 = user ? (user.co2Saved || 0) : 0;
      const pct = Math.min(100, Math.round((co2 / GOAL_CO2) * 100));

      document.getElementById('co2Total').textContent = `${co2} kg`;
      document.getElementById('co2Pct').textContent = `${pct}%`;
      document.getElementById('co2GoalLabel').textContent = `${GOAL_CO2} kg`;

      // Build last-6-months labels
      const now = new Date();
      const labels = [];
      const tripCounts = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
        const count = trips.filter(t => {
          const c = new Date(t.createdAt);
          return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
        }).length;
        tripCounts.push(count);
      }

      // Trips this month
      const thisMonth = tripCounts[tripCounts.length - 1];
      document.getElementById('tripsThisMonth').textContent = thisMonth;

      // Cumulative CO2 estimate: spread co2Saved evenly across months with trips
      const totalTrips = tripCounts.reduce((a, b) => a + b, 0) || 1;
      const co2PerTrip = co2 / totalTrips;
      const co2Data = tripCounts.map(c => +(c * co2PerTrip).toFixed(1));

      const ctx = document.getElementById('co2Chart').getContext('2d');
      if (co2ChartInst) co2ChartInst.destroy();

      co2ChartInst = new Chart(ctx, {
        data: {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'CO₂ Saved (kg)',
              data: co2Data,
              borderColor: '#2d6a4f',
              backgroundColor: 'rgba(64,145,108,.12)',
              borderWidth: 2.5,
              pointBackgroundColor: '#2d6a4f',
              pointRadius: 4,
              tension: .35,
              fill: true,
              yAxisID: 'yCO2'
            },
            {
              type: 'bar',
              label: 'Trips Created',
              data: tripCounts,
              backgroundColor: 'rgba(13,110,253,.18)',
              borderColor: '#0d6efd',
              borderWidth: 1.5,
              borderRadius: 6,
              yAxisID: 'yTrips'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
            tooltip: {
              callbacks: {
                label: ctx => ctx.dataset.label === 'CO₂ Saved (kg)'
                  ? ` ${ctx.parsed.y} kg CO₂`
                  : ` ${ctx.parsed.y} trip${ctx.parsed.y !== 1 ? 's' : ''}`
              }
            }
          },
          scales: {
            yCO2: {
              type: 'linear', position: 'left',
              title: { display: true, text: 'CO₂ (kg)', font: { size: 10 } },
              grid: { color: '#f0f5f2' },
              ticks: { font: { size: 10 } }
            },
            yTrips: {
              type: 'linear', position: 'right',
              title: { display: true, text: 'Trips', font: { size: 10 } },
              grid: { drawOnChartArea: false },
              ticks: { font: { size: 10 }, stepSize: 1 }
            },
            x: { grid: { display: false }, ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    const WX_CODES = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
      61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow',
      80: 'Rain showers', 81: 'Rain showers', 82: 'Violent showers',
      95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
    };
    const WX_ICONS = {
      0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️', 45: '🌫', 48: '🌫',
      51: '🌦', 53: '🌦', 55: '🌧', 61: '🌧', 63: '🌧', 65: '🌧',
      71: '🌨', 73: '❄️', 75: '❄️', 80: '🌦', 81: '🌧', 82: '⛈',
      95: '⛈', 96: '⛈', 99: '⛈'
    };

    async function renderWeatherWidget(user) {
      const w = document.getElementById('weatherWidget');
      const city = user && user.city ? user.city.trim() : '';

      if (!city) {
        w.innerHTML = `<div class="empty-state"><i class="bi bi-geo-alt"></i>Set your base city in <a href="profile.html" style="color:#40916c;">Profile</a> to see live weather.</div>`;
        return;
      }

      try {
        // Geocode
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results || !geoData.results.length) {
          w.innerHTML = `<div class="empty-state"><i class="bi bi-geo-alt"></i>Could not find "<strong>${esc(city)}</strong>" — update your city in Profile.</div>`;
          return;
        }
        const { latitude, longitude, name, country } = geoData.results[0];

        // Weather
        const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=4`);
        const wxData = await wxRes.json();
        const c = wxData.current;
        const d = wxData.daily;
        const icon = WX_ICONS[c.weather_code] || '🌡';
        const desc = WX_CODES[c.weather_code] || 'Unknown';

        // 3-day forecast
        const forecastHtml = [1, 2, 3].map(i => {
          const date = new Date(d.time[i]);
          const day = date.toLocaleDateString('default', { weekday: 'short' });
          const fi = WX_ICONS[d.weather_code[i]] || '🌡';
          return `<div style="text-align:center;flex:1;">
        <div style="font-size:.75rem;color:#6b7c6e;">${day}</div>
        <div style="font-size:1.3rem;">${fi}</div>
        <div style="font-size:.78rem;font-weight:600;">${Math.round(d.temperature_2m_max[i])}°</div>
        <div style="font-size:.72rem;color:#9ab3a0;">${Math.round(d.temperature_2m_min[i])}°</div>
      </div>`;
        }).join('');

        w.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
        <div style="font-size:3.5rem;line-height:1;">${icon}</div>
        <div>
          <div style="font-size:2rem;font-weight:700;line-height:1;">${Math.round(c.temperature_2m)}°C</div>
          <div style="font-size:.85rem;color:#6b7c6e;">${desc}</div>
          <div style="font-size:.78rem;color:#9ab3a0;">${esc(name)}, ${esc(country)}</div>
        </div>
        <div style="margin-left:auto;text-align:right;font-size:.78rem;color:#6b7c6e;">
          <div><i class="bi bi-droplet-half"></i> ${c.relative_humidity_2m}%</div>
          <div><i class="bi bi-wind"></i> ${c.wind_speed_10m} km/h</div>
          <div><i class="bi bi-thermometer-half"></i> Feels ${Math.round(c.apparent_temperature)}°C</div>
        </div>
      </div>
      <div style="display:flex;gap:.5rem;border-top:1px solid #f0f5f2;padding-top:.75rem;">${forecastHtml}</div>`;
      } catch (e) {
        w.innerHTML = `<div class="empty-state"><i class="bi bi-wifi-off"></i>Weather unavailable. Check your connection.</div>`;
      }
    }

    function renderProfileSummary(user) {
      const c = document.getElementById('profileSummary');
      if (!user) { c.innerHTML = `<div class="empty-state"><i class="bi bi-person"></i>Could not load profile.</div>`; return; }
      const interests = (user.interests || []).slice(0, 6);
      const chips = interests.length
        ? interests.map(i => `<span style="display:inline-block;background:#d8f3dc;color:#1b4332;border-radius:20px;padding:3px 12px;font-size:.78rem;font-weight:600;margin:2px;">${esc(i)}</span>`).join('')
        : '<span style="color:#9ab3a0;font-size:.85rem;">No interests set yet.</span>';
      const budgetMap = { low: '💚 Budget', mid: '💛 Mid-range', high: '💎 Premium' };
      const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      c.innerHTML = `
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;">
      <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#40916c,#1b4332);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;flex-shrink:0;">${initials}</div>
      <div>
        <div style="font-weight:700;">${esc(user.name)}</div>
        <div style="font-size:.8rem;color:#6b7c6e;">${esc(user.email)}</div>
      </div>
    </div>
    <div style="font-size:.83rem;color:#6b7c6e;margin-bottom:.4rem;">
      <i class="bi bi-geo-alt-fill" style="color:#2d6a4f;"></i> <strong>City:</strong> ${esc(user.city || 'Not set')}
      &nbsp;&nbsp;
      <i class="bi bi-wallet2" style="color:#2d6a4f;"></i> <strong>Budget:</strong> ${budgetMap[user.budget] || user.budget || 'Not set'}
    </div>
    <div style="font-size:.82rem;color:#6b7c6e;margin-bottom:.5rem;"><strong>Interests:</strong></div>
    <div>${chips}</div>`;
    }

    function openGoalEditor() {
      document.getElementById('goalInput').value = GOAL_CO2;
      highlightPreset(GOAL_CO2);
      openModal('goalModal');
    }

    function setGoalPreset(val) {
      document.getElementById('goalInput').value = val;
      highlightPreset(val);
    }

    function highlightPreset(val) {
      document.querySelectorAll('.goal-preset').forEach(b => {
        b.classList.toggle('active', parseInt(b.textContent) === val);
      });
    }

    function saveGoal() {
      const raw = parseInt(document.getElementById('goalInput').value, 10);
      if (!raw || raw < 10 || raw > 9999) {
        showToast('Enter a goal between 10 and 9999 kg.', 'warn');
        return;
      }
      GOAL_CO2 = raw;
      localStorage.setItem('ecoGoalCO2', raw);
      closeModal('goalModal');
      renderCO2Chart(_lastUser, _lastTrips);
      showToast(`CO₂ goal updated to ${raw} kg!`);
    }

    function esc(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function logout() {
      if (typeof clearAuthSession === 'function') clearAuthSession();
      else {
        localStorage.removeItem('ecoUserEmail');
        localStorage.removeItem('ecoAuthToken');
        sessionStorage.clear();
      }
      window.location.href = 'index.html';
    }

    loadDashboard();
