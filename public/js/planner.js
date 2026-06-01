/* ═══════════════════════════════════════════════════════════
   planner.js  —  Owner: Julius Lim Jun Herng
   Itinerary CRUD & drag-drop scheduling
   Used by: planner.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

let itineraries = [];
let currentTripId = null;
let isEditing = false;
let editItemIndex = null;
let editItemLocation = null;


async function saveState() {
  if (!currentTripId) return;

  const trip = itineraries.find(t => t._id == currentTripId);
  if (!trip) return;

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
        alert("Database Save Error: " + data.message);
    } else {
        console.log("Trip successfully synced to MongoDB!");
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
    const tripCO2 = (trip.days || []).reduce((daySum, day) => {
      return daySum + (day.stops || []).reduce((s, stop) => {
        if (stop.source === 'calculator') return s;
        return s + (parseFloat(stop.carbon) || 0);
      }, 0);
    }, 0);
    return tripSum + tripCO2;
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

function removeItin(id) {
  const removedIndex = itineraries.findIndex(t => t._id === id);
  if (removedIndex === -1) return;

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
        if (mapRouteLine) {
            mapRouteLine.setMap(null);
            mapRouteLine = null;
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

        // Find the trip data
        const trip = itineraries.find(t => t._id == tripId);
        if (trip) {
          processPendingIdeas(trip); // Move any pending ideas into the idea bank before rendering
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

    return `
        <div class="itinerary-stop p-2 mb-2 bg-white rounded shadow-sm position-relative"
             draggable="true" style="cursor: grab;"
             ondragstart="handleDragStart(event, ${idx}, '${sourceLocation}')">

            <div class="position-absolute top-0 end-0 m-1 d-flex gap-2">
                <button onclick="editActivity(${idx}, '${sourceLocation}')" 
                        class="btn btn-sm text-secondary p-0 border-0" style="font-size: 0.8rem; background: transparent;">
                    <i class="bi bi-pencil"></i>
                </button>
                <button onclick="deleteActivity(${idx}, '${sourceLocation}')" 
                        class="btn-close" style="font-size: 0.5rem;"></button>
            </div>

            <div class="d-flex gap-2 pe-4 w-100"> 
                
                <div style="font-size: 1.2rem; min-width: 25px;">${stop.icon}</div>
                
                <div class="flex-grow-1" style="min-width: 0;"> 
                    
                    <div class="fw-bold text-wrap text-break mb-1" style="font-size:0.85rem; line-height: 1.2;">
                        ${stop.name}
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <div class="text-muted" style="font-size:0.75rem;">${stop.time}</div>
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
    isEditing = false; // Make sure we aren't editing when adding new!
    const trip = itineraries.find(t => t._id == currentTripId);
    if (!trip) return;

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
            trip.ideaBank.push(idea);
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
let mapRouteLine;
let mapRouteAnimationInterval;

window.initMap = function() {
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

  // Clear old route line and stop animation
  if (mapRouteLine) {
    mapRouteLine.setMap(null);
    mapRouteLine = null;
  }
  if (mapRouteAnimationInterval) {
    clearInterval(mapRouteAnimationInterval);
    mapRouteAnimationInterval = null;
  }

  // set bounds to auto zooom
  const bounds = new google.maps.LatLngBounds();
  let hasLocations = false;
  let stopCounter = 1; //number pins
  const pathCoordinates = [];

  // Loop through days and draw pins for scheduled activities
  (trip.days || []).forEach(day => {
    (day.stops || []).forEach(stop => {
      // Only draw a pin if the stop has latitude and longitude
      if (stop.location && stop.location.lat && stop.location.lng) {
        const position = { 
            lat: parseFloat(stop.location.lat), 
            lng: parseFloat(stop.location.lng) 
        };
        
        pathCoordinates.push(position);

        const pin = new google.maps.marker.PinElement({
            glyph: stopCounter.toString(),
            glyphColor: "white",
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: position,
            map: map,
            title: stop.name,
            content: pin.element
        });

        mapMarkers.push(marker);
        bounds.extend(position);
        hasLocations = true;
        stopCounter++;
      }
    });
  });

  // Draw dotted route line connecting pins
  if (pathCoordinates.length >= 2) {
    const lineSymbol = {
      path: "M 0,-1 0,1",
      strokeOpacity: 1,
      scale: 3,
      strokeColor: "#2d6a4f", // Eco green theme color
      strokeWeight: 2
    };

    mapRouteLine = new google.maps.Polyline({
      path: pathCoordinates,
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

    let count = 0;
    mapRouteAnimationInterval = setInterval(() => {
      count = (count + 1) % 15;
      if (mapRouteLine && window.google) {
        const icons = mapRouteLine.get("icons");
        if (icons && icons[0]) {
          icons[0].offset = count + "px";
          mapRouteLine.set("icons", icons);
        }
      }
    }, 60);
  }

  //adjust camera
  if (hasLocations) {
    map.fitBounds(bounds);
    
    const listener = google.maps.event.addListener(map, "idle", function() {
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

function openMapPicker() {
    // 1. Show modal
    document.getElementById('mapPickerModal').style.display = 'flex';
    
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
