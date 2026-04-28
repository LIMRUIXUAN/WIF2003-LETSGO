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
    ideaBank: [
      { time: 'Flexible', icon: '🛶', name: 'Mangrove Kayaking', sub: 'Nature' },
      { time: 'Flexible', icon: '🥗', name: 'Vegan Cafe', sub: 'Food' }
    ],
    days: [
      { date: '2025-07-15', stops: [
        { time: '09:00', icon: '🏨', name: 'Check in — EcoBeach Resort', sub: 'Sustainable beachfront hotel' }
      ]},
      { date: '2025-07-16', stops: [
        { time: '08:00', icon: '🚣', name: 'Mangrove Kayak Tour', sub: 'Morning paddle through wetlands' }
      ]}
    ]
  }
];

// utilize local storage
function saveState() {
  localStorage.setItem('ecoPlannerData', JSON.stringify(itineraries));
}

function loadState() {
  const savedData = localStorage.getItem('ecoPlannerData');
  if (savedData) {
    itineraries = JSON.parse(savedData);
  }
  else {
    itineraries = JSON.parse(JSON.stringify(ITINERARY_SAMPLE)); // Deep copy of sample data
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
        <button class="btn-eco-outline" style="font-size:.82rem; padding:7px 16px;"
                onclick="switchView('board', ${itin.id})">
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
  saveState();
  renderItineraries();
}

function removeItin(idx) {
  // TODO: replace with real API call — DELETE /api/trips/:id
  itineraries.splice(idx, 1);
  saveState();
  renderItineraries();
  showToast('Itinerary removed');
}

/* Load sample data and render on page load */
document.addEventListener('DOMContentLoaded', () => {
  loadState(); //load from disk first, if exist. Otherwise load sample data
  renderItineraries();
});

/*
 * Switches between the kanban-view and trip-view
 */
function switchView(view, tripId = null) {
    const listView = document.getElementById('listView');
    const boardView = document.getElementById('boardView');

    if (view === 'list') {
        listView.style.display = 'block';
        boardView.style.display = 'none';
        renderItineraries();
    } else {
        listView.style.display = 'none';
        boardView.style.display = 'block';
        
        // Sync current trip ID to board view
        currentTripId = tripId;

        // Find the trip data
        const trip = itineraries.find(t => t.id == tripId);
        if (trip) {
            document.getElementById('activeTripTitle').innerText = trip.name;
            generateTimelineColumns(trip.start, trip.end);
            renderBoardItems(trip); // Put real data in column based on current trip
        }
    }
}

let currentTripId = null;
/**
 * Calculates the days between two dates and generates the columns
 */
function generateTimelineColumns(startStr, endStr) {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = ''; // Clear existing days

    const start = new Date(startStr);
    const end = new Date(endStr);
    
    //if end is before start, just show 1 day just to be safe lah
    let tempDate = new Date(start);
    
    while (tempDate <= end) {
        const dateLabel = tempDate.toLocaleDateString('en-MY', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });

        const dayId = tempDate.toISOString().split('T')[0]; // YYYY-MM-DD for ID

        container.innerHTML += `
            <div class="kanban-column" 
                 ondragover="allowDrop(event)" 
                 ondrop="handleDrop(event, '${dayId}')">
                <div class="column-header">
                    <i class="bi bi-calendar-event"></i> ${dateLabel}
                </div>
                <div class="column-body" id="col-${dayId}">
                    </div>
            </div>
        `;

        tempDate.setDate(tempDate.getDate() + 1); // Move to next day
    }
}

function renderBoardItems(trip) {
    // clear all columns
    document.querySelectorAll('.column-body').forEach(col => col.innerHTML = '');
    
    // Clear the Idea Bank column
    const ideaBankContainer = document.getElementById('ideaBankContainer');
    if (ideaBankContainer) ideaBankContainer.innerHTML = '';

    // Render items inside the timeline days columns
    trip.days.forEach(day => {
        const col = document.getElementById(`col-${day.date}`);
        if (col) {
            col.innerHTML = day.stops.map((stop, idx) => createCardHTML(stop, idx, day.date)).join('');
        }
    });

    // render items inside the Idea Bank
    if (trip.ideaBank && ideaBankContainer) {
        ideaBankContainer.innerHTML = trip.ideaBank.map((stop, idx) => createCardHTML(stop, idx, 'ideaBank')).join('');
    }
}

function createCardHTML(stop, idx, sourceLocation) {
    return `
        <div class="itinerary-stop p-2 mb-2 bg-white rounded shadow-sm position-relative"
             draggable="true" style="cursor: grab;"
             ondragstart="handleDragStart(event, ${idx}, '${sourceLocation}')">

            <button onclick="deleteActivity(${idx}, '${sourceLocation}')" 
                    class="btn-close position-absolute top-0 end-0 m-1" 
                    style="font-size: 0.5rem;"></button>

            <div class="d-flex gap-2">
                <span>${stop.icon}</span>
                <div>
                    <div class="fw-bold" style="font-size:0.85rem;">${stop.name}</div>
                    <div class="text-muted" style="font-size:0.75rem;">${stop.time}</div>
                </div>
            </div>
        </div>
    `;
}

let draggedItemIndex = null;
let sourceDayDate = null;

function handleDragStart(event, index, date) {
  draggedItemIndex = index;
  sourceDayDate = date;
  event.dataTransfer.setData('text/plain', index);
}

function allowDrop(event) {
  event.preventDefault();
}

function handleDrop(event, targetLocation) {
    event.preventDefault();

    const trip = itineraries.find(t => t.id == currentTripId);
    if (!trip) return;

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

function openAddActivityModal() {
    const trip = itineraries.find(t => t.id == currentTripId);
    if (!trip) return;

    // populate location dropdown with timeline days
    const select = document.getElementById('actTargetDay');
    
    // Always offer the Idea Bank as an option default
    select.innerHTML = `<option value="ideaBank">💡 Activites Idea</option>`;
    
    //loop through the trip days and add them as options
    trip.days.forEach(day => {
        select.innerHTML += `<option value="${day.date}">📅 Day: ${day.date}</option>`;
    });

    // Clear out any old text from the inputs
    document.getElementById('actName').value = '';
    document.getElementById('actSub').value = '';
    
    openModal('addActivityModal');
}

function saveNewActivity() {
    const trip = itineraries.find(t => t.id == currentTripId);
    if (!trip) return;

    // Grab data from form
    const name = document.getElementById('actName').value || 'New Activity';
    const time = document.getElementById('actTime').value || 'Flexible';
    const icon = document.getElementById('actIcon').value || '📍';
    const sub = document.getElementById('actSub').value || 'Custom';
    const targetId = document.getElementById('actTargetDay').value;

    // Create the new Stop Object
    const newStop = { time, icon, name, sub };

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
  const trip = itineraries.find(t => t.id == currentTripId);
  if (!trip) return;

  if (sourceLocation === 'ideaBank') {
    trip.ideaBank.splice(index, 1);
  } else {
    const day = trip.days.find(d => d.date === sourceLocation);
    if (day) {
      day.stops.splice(index, 1);
    }
  }
  renderBoardItems(trip);
  saveState();
  showToast("Activity deleted!");
}