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
  
  const html = Array.from(options).slice(0, 5).map(opt => 
    `<div class="suggestion-item" onclick="selectSuggestion('${opt}')">${opt}</div>`
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
                  <span class="eco-badge" style="background:${item.eco >= 9 ? '#27ae60' : item.eco >= 8 ? '#f39c12' : '#e74c3c'};">
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
function toggleFav(e, id, name) {
  e.stopPropagation();
  const btn = e.currentTarget;
  
  if (favorites.has(id)) {
    favorites.delete(id);
    btn.classList.remove('saved');
    btn.innerHTML = '<i class="bi bi-heart"></i>';
    showToast('Removed from favorites', 'info');
  } else {
    favorites.add(id);
    btn.classList.add('saved');
    btn.innerHTML = '<i class="bi bi-heart-fill"></i>';
    showToast(`${name} bookmarked! 💚`);
    
    // Save to backend/localStorage
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (user.id) {
      fetch(`/api/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, destinationId: id })
      }).catch(err => console.log('Offline: saved locally'));
    }
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
  const item = LISTINGS.find(l => l.id === id);
  itineraries.push(item);
  showToast(`Added to your trip! 📍`);
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
  renderListings();
  
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
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  if (user.id) {
    fetch(`/api/favorites?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.favoriteIds) {
          data.favoriteIds.forEach(id => favorites.add(id));
          renderListings();
        }
      })
      .catch(() => console.log('Using local favorites'));
  }
});

