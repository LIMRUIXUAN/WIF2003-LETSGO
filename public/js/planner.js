/* ═══════════════════════════════════════════════════════════
   planner.js  —  Owner: Julius Lim Jun Herng
   Itinerary CRUD & drag-drop scheduling
   Used by: planner.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

const ITINERARY_SAMPLE = [
  {
    id: 1, name: 'Langkawi Green Escape', city: 'Langkawi', style: 'Mid-range',
    start: '2025-07-15', end: '2025-07-20',
    days: [
      { date: 'Jul 15', stops: [
        { time: '09:00', icon: '🏨', name: 'Check in — EcoBeach Resort',  sub: 'Sustainable beachfront hotel' },
        { time: '14:00', icon: '🚲', name: 'Mangrove Cycling Tour',        sub: '3-hour eco cycling route' },
        { time: '19:00', icon: '🍃', name: 'Dinner at Green Palm Cafe',    sub: 'Farm-to-table cuisine' },
      ]},
      { date: 'Jul 16', stops: [
        { time: '08:00', icon: '🚣', name: 'Mangrove Kayak Tour',          sub: 'Morning paddle through wetlands' },
        { time: '13:00', icon: '🌿', name: 'Langkawi Geopark Visit',       sub: 'UNESCO heritage site' },
        { time: '18:00', icon: '🌅', name: 'Sunset Watch at Tanjung Rhu',  sub: 'Low-impact eco trail' },
      ]},
    ]
  }
];

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

  list.innerHTML = itineraries.map((itin, idx) => `
    <div class="stat-card mb-3">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <div style="font-size:1.05rem; font-weight:700;">${itin.name}</div>
          <div style="font-size:.82rem; color:#9ab3a0;">
            <i class="bi bi-geo-alt"></i> ${itin.city} &nbsp;·&nbsp;
            <i class="bi bi-calendar3"></i> ${itin.start} – ${itin.end}
          </div>
        </div>
        <div class="d-flex gap-2">
          <span class="eco-badge"><i class="bi bi-leaf"></i> Eco Trip</span>
          <button onclick="removeItin(${idx})"
                  style="background:#fdecea; border:none; border-radius:8px; padding:4px 10px;
                         color:#c0392b; cursor:pointer; font-size:.8rem;">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>

      ${itin.days.map(day => `
        <div class="itinerary-day">
          <div class="day-header"><i class="bi bi-calendar-day"></i> ${day.date}</div>
          ${day.stops.map(stop => `
            <div class="itinerary-stop">
              <div class="stop-time">${stop.time}</div>
              <div class="stop-icon">${stop.icon}</div>
              <div class="stop-info">
                <div class="stop-name">${stop.name}</div>
                <div class="stop-sub">${stop.sub}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}

      <div class="d-flex gap-2 mt-2">
        <button class="btn-eco-outline" style="font-size:.82rem; padding:7px 16px;">
          <i class="bi bi-pencil"></i> Edit
        </button>
        <button class="btn-eco" style="font-size:.82rem; padding:7px 16px; justify-content:center;"
                onclick="showToast('Itinerary exported! 📄')">
          <i class="bi bi-download"></i> Export
        </button>
      </div>
    </div>
  `).join('');
}

function createItinerary() {
  const name  = document.getElementById('itinName').value  || 'My Green Trip';
  const city  = document.getElementById('itinCity').value  || 'Destination';
  const start = document.getElementById('itinStart').value || '2025-08-01';
  const end   = document.getElementById('itinEnd').value   || '2025-08-05';

  // TODO: replace with real API call — POST /api/trips { name, city, start, end }
  itineraries.unshift({
    id: Date.now(), name, city, start, end,
    days: [{ date: start, stops: [
      { time: '09:00', icon: '✈️', name: 'Arrival & Check-in',  sub: 'Eco-certified accommodation' },
      { time: '14:00', icon: '🌿', name: 'Local Nature Walk',    sub: 'Low-impact guided tour' },
    ]}]
  });

  closeModal('createItinModal');
  showToast(`Itinerary "${name}" created! 🗺`);
  renderItineraries();
}

function removeItin(idx) {
  // TODO: replace with real API call — DELETE /api/trips/:id
  itineraries.splice(idx, 1);
  renderItineraries();
  showToast('Itinerary removed');
}

/* Load sample data and render on page load */
document.addEventListener('DOMContentLoaded', () => {
  itineraries = [...ITINERARY_SAMPLE];
  renderItineraries();
});
