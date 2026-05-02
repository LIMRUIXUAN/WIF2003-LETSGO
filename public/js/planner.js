/* ═══════════════════════════════════════════════════════════
   planner.js  —  Owner: Julius Lim Jun Herng
   Itinerary CRUD & drag-drop scheduling
   Used by: planner.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

let itineraries = [];
let currentTripId = null;
//below hardcoded sample lah, later we will fetch real itineraries from MongoDB based on logged in user
const ITINERARY_SAMPLE = [
  {
    id: 1, name: 'Langkawi Green Escape', city: 'Langkawi', style: 'Mid-range',
    start: '2025-07-15', end: '2025-07-20',
    ideaBank: [
      { time: 'Flexible', icon: '🛶', name: 'Mangrove Kayaking', sub: 'Nature', carbon: 2}, //carbon is integer value in kg
      { time: 'Flexible', icon: '🥗', name: 'Vegan Cafe', sub: 'Food', carbon: 1 }
    ],
    days: [
      { date: '2025-07-15', stops: [
        { time: '09:00', icon: '🏨', name: 'Check in — EcoBeach Resort', sub: 'Sustainable beachfront hotel', carbon: 5 }
      ]},
      { date: '2025-07-16', stops: [
        { time: '08:00', icon: '🚣', name: 'Mangrove Kayak Tour', sub: 'Morning paddle through wetlands', carbon: 3 }
      ]}
    ]
  }
];

async function saveState() {
  if (!currentTripId) return;

  const trip = itineraries.find(t => t._id == currentTripId);
  if (!trip) return;

  try {
    const res = await fetch(`/api/trips/${currentTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trip) 
    });

    const data = await res.json();
    
    // kalau the backend fails, throw alert
    if (!res.ok) {
        console.error("Backend refused to save:", data.message);
        alert("Database Save Error: " + data.message);
    } else {
        console.log("Trip successfully synced to MongoDB!");
    }
  } catch (err) {
    console.error("Failed to save to MongoDB:", err);
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
          <button onclick="removeItin('${itin._id}')"
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
                onclick="switchView('board', '${itin._id}')">
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

async function createItinerary() {
  const name  = document.getElementById('itinName').value || 'My Trip';
  const city  = document.getElementById('itinCity').value || 'Destination';
  const today = new Date().toISOString().split('T')[0];
  const start = document.getElementById('itinStart').value || today;
  const end   = document.getElementById('itinEnd').value || today;

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
        days: generateDays(start, end),
        ideaBank: [] // Initialize empty idea bank for new trip
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Backend error: god damn it!" + data.message);
      return;
    }

    itineraries.unshift(data.data);
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
  console.log("DEBUG: Browser thinks the user is:", userEmail);
  if(!userEmail) {
    console.warn("No user email found in localStorage. Itineraries won't load.");
    return;
  }
  try {
    //2. fetch itineraries from backend for that user email
    console.log(`🌐 DEBUG: Sending GET request to /api/trips/${userEmail}`);
    const res = await fetch(`/api/trips/${userEmail}`);
    const data = await res.json();
    itineraries = data.data || [];
    renderItineraries();
  } catch (err) {
    console.error("Failed to load trips:", err);
    itineraries = [];
  }
}

async function removeItin(id) {
  try {
    await fetch(`/api/trips/${id}`, { method: 'DELETE' });
    itineraries = itineraries.filter(t => t._id !== id);
    renderItineraries();
    showToast("Deleted!");
  } catch (err) {
    console.error(err);
  }
}

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
        const trip = itineraries.find(t => t._id == tripId);
        if (trip) {
            document.getElementById('activeTripTitle').innerText = trip.name;
            generateTimelineColumns(trip.start, trip.end);
            renderBoardItems(trip); // Put real data in column based on current trip
        }
    }
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
        const dayId = tempDate.toISOString().split('T')[0];

      container.innerHTML += `
        <div class="kanban-column bg-light rounded-3 p-3" style="min-width: 320px;">
          <h6 class="text-muted mb-3"><i class="bi bi-calendar-day"></i> ${dayId}</h6>
          <div id="col-${dayId}" class="d-flex flex-column gap-2 min-vh-25" style="min-height: 150px;"
               ondragover="allowDrop(event)" 
               ondrop="handleDrop(event, '${dayId}')">
          </div>
        </div>
      `;

      tempDate.setDate(tempDate.getDate() + 1);//move to next day
    }
}

function renderBoardItems(trip) {
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
}

function createCardHTML(stop, idx, sourceLocation) {
    // Determine color based on carbon weight
    const carbon = stop.carbon || 0;
    let badgeClass = 'bg-success'; // Low
    if (carbon > 10) badgeClass = 'bg-warning text-dark'; // Medium
    if (carbon > 20) badgeClass = 'bg-danger'; // High

    return `
        <div class="itinerary-stop p-2 mb-2 bg-white rounded shadow-sm position-relative"
             draggable="true" style="cursor: grab;"
             ondragstart="handleDragStart(event, ${idx}, '${sourceLocation}')">

            <button onclick="deleteActivity(${idx}, '${sourceLocation}')" 
                    class="btn-close position-absolute top-0 end-0 m-1" 
                    style="font-size: 0.5rem;"></button>

            <div class="d-flex gap-2 pe-3 w-100"> 
                
                <div style="font-size: 1.2rem; min-width: 25px;">${stop.icon}</div>
                
                <div class="flex-grow-1" style="min-width: 0;"> 
                    
                    <div class="fw-bold text-wrap text-break mb-1" style="font-size:0.85rem; line-height: 1.2;">
                        ${stop.name}
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <div class="text-muted" style="font-size:0.75rem;">${stop.time}</div>
                        <span class="badge ${badgeClass}" style="font-size: 0.65rem;">${carbon}kg CO₂</span>
                    </div>

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

    const trip = itineraries.find(t => t._id == currentTripId);
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
    const trip = itineraries.find(t => t._id == currentTripId);
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
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!trip) return;

    // Grab data from form
    const name = document.getElementById('actName').value || 'New Activity';
    const time = document.getElementById('actTime').value || 'Flexible';
    const icon = document.getElementById('actIcon').value || '📍';
    const sub = document.getElementById('actSub').value || 'Custom';
    const targetId = document.getElementById('actTargetDay').value;
    const carbon = parseInt(document.getElementById('actCarbon').value) || 0;

    // Create the new Stop Object
    const newStop = { time, icon, name, sub, carbon };

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

/* Load sample data and render on page load */
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderItineraries();
});