/* ═══════════════════════════════════════════════════════════
   favorites.js  —  Owner: Ye Qinglan
   Rendering saved favorite items
   Used by: favorites.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

function ecoColor(score) {
  if (score >= 9) return '';
  if (score >= 8) return 'medium';
  return 'low';
}

function renderFavs() {
  const grid    = document.getElementById('favGrid');
  const empty   = document.getElementById('emptyFavs');
  const favList = LISTINGS.filter(l => favorites.has(l.id));
  // TODO: replace with real API call — GET /api/favorites

  if (!favList.length) {
    grid.innerHTML      = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = favList.map(l => `
    <div class="col-sm-6 col-lg-4">
      <div class="listing-card">
        <div class="card-img">
          <span style="font-size:3.5rem;">${l.icon}</span>
          <button class="fav-btn saved" onclick="removeFav(event, ${l.id})">
            <i class="bi bi-heart-fill"></i>
          </button>
        </div>
        <div class="card-body">
          <div class="card-title">${l.name}</div>
          <div class="card-location"><i class="bi bi-geo-alt"></i> ${l.location}</div>
          <div class="d-flex gap-2 mt-2">
            <span class="eco-score ${ecoColor(l.eco)}"><i class="bi bi-leaf"></i> ${l.eco}/10</span>
            <span class="price-tag">${l.price}</span>
          </div>
          <a href="planner.html" class="btn-eco w-100 mt-2"
             style="font-size:.82rem; padding:8px; justify-content:center; text-decoration:none;">
            <i class="bi bi-plus"></i> Add to Itinerary
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

function removeFav(e, id) {
  e.stopPropagation();
  favorites.delete(id);
  // TODO: DELETE /api/favorites/:id
  renderFavs();
  showToast('Removed from favorites');
}

document.addEventListener('DOMContentLoaded', renderFavs);
