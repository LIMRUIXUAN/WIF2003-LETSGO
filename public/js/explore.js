/* ═══════════════════════════════════════════════════════════
   explore.js  —  Owner: Tan Jin Xiang
   Search, filter logic & flip card rendering
   Used by: explore.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

function ecoColor(score) {
  if (score >= 9) return '';
  if (score >= 8) return 'medium';
  return 'low';
}

function renderListings(catOrList) {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;

  let list;
  if (Array.isArray(catOrList)) {
    list = catOrList;
  } else {
    const cat = catOrList;
    list = cat === 'all'  ? LISTINGS :
           cat === 'high' ? LISTINGS.filter(l => l.eco >= 9) :
                            LISTINGS.filter(l => l.cat === cat);
  }

  if (!list.length) {
    grid.innerHTML = '<div class="col-12 text-center py-5" style="color:#9ab3a0;">No results found.</div>';
    return;
  }

  grid.innerHTML = list.map(l => `
    <div class="col-sm-6 col-lg-4">
      <div class="flip-card" onclick="this.classList.toggle('is-flipped')">
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <div class="listing-card" style="height:100%;">
              <div class="card-img">
                <span style="font-size:3.5rem;">${l.icon}</span>
                <button class="fav-btn ${favorites.has(l.id) ? 'saved' : ''}"
                        onclick="toggleFav(event, ${l.id})">
                  <i class="bi bi-heart${favorites.has(l.id) ? '-fill' : ''}"></i>
                </button>
              </div>
              <div class="card-body">
                <div class="card-title">${l.name}</div>
                <div class="card-location"><i class="bi bi-geo-alt"></i> ${l.location}</div>
                <div class="d-flex gap-2 mt-2">
                  <span class="eco-score ${ecoColor(l.eco)}"><i class="bi bi-leaf"></i> ${l.eco}/10</span>
                  <span class="price-tag">${l.price}</span>
                </div>
                <div class="co2-badge mt-2">${l.co2}</div>
              </div>
            </div>
          </div>
          <div class="flip-card-back">
            <i class="bi bi-info-circle-fill mb-3" style="font-size:2rem; color:var(--eco-leaf);"></i>
            <h5>${l.name}</h5>
            <p style="font-size:.85rem;">${l.desc}</p>
            <div style="font-size:.82rem; margin-bottom:1rem;">
              ⭐ ${l.rating} · ${l.co2}
            </div>
            <button class="btn-eco" onclick="event.stopPropagation(); addToItin(${l.id})">
              <i class="bi bi-plus"></i> Add to Itinerary
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function filterCat(btn, cat) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderListings(cat);
}

function toggleFav(e, id) {
  e.stopPropagation();
  if (favorites.has(id)) {
    favorites.delete(id);
    showToast('Removed from favorites', 'info');
  } else {
    favorites.add(id);
    showToast('Saved to favorites 💚');
  }
  // TODO: POST /api/favorites { destinationId: id }
  const activeCat = document.querySelector('.filter-chip.active')
                             ?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 'all';
  renderListings(activeCat);
}

function addToItin(id) {
  const l = LISTINGS.find(x => x.id === id);
  showToast(`Added "${l.name}" to your itinerary 📍`);
  // TODO: POST /api/trips/items { destinationId: id }
}

function onSearchInput(inp) {
  document.getElementById('searchSuggest').style.display = inp.value.length > 0 ? 'block' : 'none';
}

function selectCity(city) {
  document.getElementById('exploreSearch').value         = city;
  document.getElementById('searchSuggest').style.display = 'none';
  showToast(`Showing eco spots in ${city} 🗺`);
  // TODO: filter listings by city
}

/* Load destinations from API, fall back to local LISTINGS */
async function loadDestinations() {
  try {
    const res          = await fetch('/api/destinations');
    const destinations = await res.json();
    renderListings(destinations);
  } catch {
    renderListings('all');
  }
}

document.addEventListener('DOMContentLoaded', loadDestinations);
