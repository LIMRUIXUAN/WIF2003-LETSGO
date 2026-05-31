/* ═══════════════════════════════════════════════════════════
   explore.js  —  Owner: Tan Jin Xiang
   Search, filter logic & flip card rendering
   Used by: explore.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── TYPE-AHEAD SEARCH ──
function handleSearchInput(el) {
  const query = el.value.toLowerCase();
  const dropdown = document.getElementById('searchSuggest');
  
  if (!query) {
    dropdown.style.display = 'none';
    return;
  }
  
  // Get matching cities and keywords
  const options = new Set();
  LISTINGS.forEach(item => {
    if (item.location.toLowerCase().includes(query)) options.add(item.location);
    if (item.name.toLowerCase().includes(query)) options.add(item.name);
    if (item.cat.toLowerCase().includes(query)) options.add(item.cat);
  });

  function escAttr(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  
  const html = Array.from(options).slice(0, 5).map(opt => 
    `<div class="suggestion-item" onclick="selectSuggestion('${escAttr(opt)}')">${escAttr(opt)}</div>`
  ).join('');
  
  document.getElementById('searchSuggest').innerHTML = html;
  dropdown.style.display = html ? 'block' : 'none';
}

function selectSuggestion(value) {
  document.getElementById('exploreSearch').value = value;
  document.getElementById('searchSuggest').style.display = 'none';
  filterListings();
}

// ── FILTER & SEARCH ──
function filterListings() {
  const search = document.getElementById('exploreSearch').value.toLowerCase();
  const budget = document.querySelector('[data-budget]')?.getAttribute('data-budget') || '';
  const category = document.querySelector('.filter-chip.active')?.getAttribute('data-cat') || 'all';
  
  let results = LISTINGS.filter(item => {
    // Search filter
    if (search && !item.name.toLowerCase().includes(search) && 
        !item.location.toLowerCase().includes(search)) return false;
    
    // Category filter
    if (category !== 'all') {
      if (category === 'high' && item.eco < 9) return false;
      if (category !== 'high' && item.cat !== category) return false;
    }
    
    return true;
  });
  
  renderListings(results);
}

// ── RENDER FLIP CARDS ──
function renderListings(list = LISTINGS) {
  const grid = document.getElementById('listingsGrid');
  
  // if the grid doesn't exist on this page, stop the function here to avoid errors hehehe
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = '<div class="col-12 text-center py-5" style="color:#9ab3a0;">No results found</div>';
    return;
  }
  
  grid.innerHTML = list.map(item => `
    <div class="col-sm-6 col-lg-4">
      <div class="flip-card" onclick="toggleFlip(this)">
        <div class="flip-card-inner">
          <!-- FRONT -->
          <div class="flip-card-front">
            <div class="listing-card">
              <div class="card-img">
                <span style="font-size:3.5rem;">${item.icon}</span>
                <button class="fav-btn ${favorites.has(item.id) ? 'saved' : ''}" 
                        onclick="toggleFav(event, ${item.id}, '${item.name}')">
                  <i class="bi bi-heart${favorites.has(item.id) ? '-fill' : ''}"></i>
                </button>
              </div>
              <div class="card-body">
                <h6 class="card-title">${item.name}</h6>
                <p class="card-location"><i class="bi bi-geo-alt"></i> ${item.location}</p>
                <div class="d-flex gap-2">
                  <span class="eco-badge" style="background:${item.eco >= 9 ? '#27ae60' : item.eco >= 8 ? '#f39c12' : '#e74c3c'}; color: #fff;">
                    🌿 ${item.eco}/10
                  </span>
                  <span class="price-badge">${item.price}</span>
                </div>
                <div style="margin-top:0.5rem; font-size:0.8rem; color:#666;">
                  ${item.co2}
                </div>
              </div>
            </div>
          </div>
          
          <!-- BACK -->
          <div class="flip-card-back">
            <h5>${item.name}</h5>
            <p style="font-size:0.85rem; color:#555;">${item.desc}</p>
            <p style="font-size:0.8rem; margin:0.5rem 0;">⭐ ${item.rating}/5 · ${item.co2}</p>
            <button class="btn-eco" onclick="event.stopPropagation(); addToTrip(${item.id})">
              <i class="bi bi-plus"></i> Add to Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ── FLIP CARD TOGGLE ──
function toggleFlip(card) {
  card.classList.toggle('is-flipped');
}

// ── FAVORITES ──
// Upate for this toggleFav func: designed for Phase 1 (mock) and Phase 2 (real API) with optimistic UI updates.
async function toggleFav(e, id, name) {
    e.stopPropagation();
    const btn = e.currentTarget;
    
    // 1. Get the logged-in user's email (from Zi Yu's login)
    const userEmail = localStorage.getItem('ecoUserEmail') || 'demo@ecoplanner.com';

    // 2. Optimistic UI Update (Visuals)
    if (favorites.has(id)) {
        favorites.delete(id);
        btn.classList.remove('saved');
        btn.innerHTML = '<i class="bi bi-heart"></i>';
        if(typeof showToast === 'function') showToast('Removed from favorites', 'info');
    } else {
        favorites.add(id);
        btn.classList.add('saved');
        btn.innerHTML = '<i class="bi bi-heart-fill"></i>';
        if(typeof showToast === 'function') showToast(`${name} bookmarked! 💚`);
    }

    // 3. The Database Update
    try {
        console.log(`Sending PUT request to add ID ${id} for ${userEmail}...`); 
        
        const response = await fetch(`/api/users/${userEmail}/favorites`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationId: Number(id) }) // Force it to be a Number!
        });

        const result = await response.json();
        
        console.log("Server Response from clicking heart:", result); 

        if (!result.success) {
            console.error("Backend refused to save:", result.message);
            // Revert the heart visually if the database failed
            if(typeof showToast === 'function') showToast("Error saving: " + result.message, "error");
        }
        
    } catch (error) {
        console.error("Network Fetch Error:", error);
    }
}

// ── CATEGORY FILTER ──
function filterCat(btn, cat) {
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  btn.setAttribute('data-cat', cat);
  filterListings();
}

// ── ADD TO TRIP ──
function addToTrip(id) {
  // Find the specific destination the user clicked on
  const item = LISTINGS.find(l => l.id === id);
  if (!item) return;

  // 1. Grab our "Shopping Cart" of pending ideas from the browser
  let savedIdeas = JSON.parse(localStorage.getItem('ecoPendingIdeas') || '[]');

  // 2. Add this new destination to the cart
  savedIdeas.push({
      time: 'Flexible',
      icon: item.icon,
      name: item.name,
      sub: item.cat,
      // Extract just the numbers from strings like "↓62 kg CO₂"
      carbon: parseInt(item.co2.replace(/\D/g,'')) || 5 
  });

  // 3. Save the cart back to the browser's memory
  localStorage.setItem('ecoPendingIdeas', JSON.stringify(savedIdeas));

  // 4. Show a helpful prompt directing them to the Planner
  if (typeof showToast === 'function') {
    showToast(`${item.name} saved! Head to the Planner to schedule it. 📍`);
  }
}

// ── FILTER MODAL ──
function openFilterModal() {
  const modal = document.getElementById('filterModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeFilterModal() {
  const modal = document.getElementById('filterModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function updateAdvancedFilters() {
  // Update eco slider value display
  const slider = document.getElementById('ecoSlider');
  const valueDisplay = document.getElementById('ecoSliderValue');
  if (slider && valueDisplay) {
    valueDisplay.textContent = slider.value;
  }
}

function applyFilters() {
  const budgetMin = parseInt(document.getElementById('budgetMin')?.value) || 0;
  const budgetMax = parseInt(document.getElementById('budgetMax')?.value) || Infinity;
  const ecoMin = parseInt(document.getElementById('ecoSlider')?.value) || 0;
  
  const selectedCategories = Array.from(
    document.querySelectorAll('.filter-checkboxes input[type="checkbox"]:checked')
  ).map(cb => cb.value).filter(v => ['hotel', 'restaurant', 'transport', 'activity'].includes(v));
  
  const selectedCerts = Array.from(
    document.querySelectorAll('.filter-checkboxes input[type="checkbox"]:checked')
  ).map(cb => cb.value).filter(v => ['solar', 'organic', 'zerowaste', 'electric'].includes(v));
  
  const selectedCO2 = Array.from(
    document.querySelectorAll('.filter-checkboxes input[type="checkbox"]:checked')
  ).map(cb => cb.value).filter(v => ['highreduction', 'mediumreduction', 'zeroimpact'].includes(v));
  
  // Filter listings
  let filtered = LISTINGS.filter(item => {
    // Budget filter
    const price = parseInt(item.price) || 0;
    if (price < budgetMin || price > budgetMax) return false;
    
    // Eco rating filter
    if (item.eco < ecoMin) return false;
    
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(item.cat)) return false;
    
    return true;
  });
  
  renderListings(filtered);
  closeFilterModal();
  showToast('Filters applied!');
}

function clearAdvancedFilters() {
  document.getElementById('budgetMin').value = '';
  document.getElementById('budgetMax').value = '';
  document.getElementById('ecoSlider').value = '0';
  document.getElementById('ecoSliderValue').textContent = '0';
  
  // Uncheck all checkboxes
  document.querySelectorAll('.filter-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  renderListings();
  closeFilterModal();
  showToast('Filters cleared');
}

function handleSearchKeydown(event) {
  if (event.key === 'Enter') {
    filterListings();
    document.getElementById('searchSuggest').style.display = 'none';
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  // Destinations are already loaded by app.js (loadListingsFromAPI).
  // We just need to render once LISTINGS are ready and load favorites.
  loadDestinations();
  // Close modal when clicking outside
  const modal = document.getElementById('filterModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeFilterModal();
      }
    });
  }
  
  // Load favorites from API
  const userEmail = localStorage.getItem('ecoUserEmail') || 'test@ecoplanner.com';

  fetch(`/api/users/profile/${userEmail}`)
    .then(res => res.json())
    .then(data => {
      if (data.success && data.data.favorites) {
        data.data.favorites.forEach(id => favorites.add(id));
        renderListings();
      }
    })
  .catch(err => {
    console.log('Failed to load favorites:', err);
  });
});

/* ══════════════════════════════════════════
   FETCH DESTINATIONS FROM MONGODB
   (Uses shared loadListingsFromAPI from app.js)
   ══════════════════════════════════════════ */
async function loadDestinations() {
    try {
        await loadListingsFromAPI(); // Shared fetch from app.js
        renderListings();            // Draw the flip cards
    } catch (error) {
        console.error("Database connection error:", error);
        if(typeof showToast === 'function') showToast("Could not load destinations", "error");
    }
}
