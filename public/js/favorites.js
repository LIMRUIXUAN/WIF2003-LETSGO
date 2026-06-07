/* ═══════════════════════════════════════════════════════════
   favorites.js  —  Owner: Ye Qinglan & Lim Rui Xuan
   Rendering saved favorite items
   Used by: favorites.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

// Auth guard - redirect to login if no session
(function guardAuth() {
  if (typeof requirePageAuth === 'function') {
    requirePageAuth();
    return;
  }

  const email = localStorage.getItem('ecoUserEmail');
  const token = localStorage.getItem('ecoAuthToken');
  if (!email || !token) window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)}`;
})();

function ecoColor(score) {
  if (score >= 9) return '';
  if (score >= 8) return 'medium';
  return 'low';
}

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return esc(str).replace(/`/g, '&#96;');
}

function renderFavoritesLoading() {
    const grid = document.getElementById('favGrid');
    const empty = document.getElementById('emptyFavs');
    if (!grid) return;

    if (empty) empty.style.display = 'none';
    grid.innerHTML = Array.from({ length: 3 }).map(() => `
      <div class="col-sm-6 col-lg-4">
        <div class="listing-card loading-card-skeleton" aria-hidden="true">
          <div class="loading-skeleton-img"></div>
          <div class="card-body">
            <div class="loading-skeleton-line loading-skeleton-title"></div>
            <div class="loading-skeleton-line loading-skeleton-short"></div>
            <div class="loading-skeleton-pill-row">
              <div class="loading-skeleton-pill"></div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
}

function renderFavoritesError() {
    const grid = document.getElementById('favGrid');
    const empty = document.getElementById('emptyFavs');
    if (!grid) return;

    if (empty) empty.style.display = 'none';
    grid.innerHTML = `
      <div class="col-12">
        <div class="loading-state-panel">
          <i class="bi bi-wifi-off"></i>
          <span>Could not load favorites. Please try again.</span>
        </div>
      </div>
    `;
}

async function renderFavs() {
    const grid  = document.getElementById('favGrid');
    const empty = document.getElementById('emptyFavs');
    
    // 1. Who is logged in?
    const userEmail = localStorage.getItem('ecoUserEmail'); 

    try {
        renderFavoritesLoading();

        // 2. Load destinations and the user's profile in parallel.
        const [, response] = await Promise.all([
            loadListingsFromAPI(),
            fetch(`/api/users/profile/${userEmail}`)
        ]);
        const userData = await response.json();

        if (userData.success) {
            // 4. Extract the array of saved IDs directly from the database!
            const dbFavorites = userData.data.favorites; 
            
            // 5. Match them against destinations fetched from MongoDB
            const favList = LISTINGS.filter(l => dbFavorites.includes(l.id));

            if (favList.length === 0) {
                grid.innerHTML = '';
                empty.style.display = 'block';
                return;
            }

            // Render cards
            empty.style.display = 'none';
            grid.innerHTML = favList.map(l => `
              <div class="col-sm-6 col-lg-4">
                <div class="listing-card">
                  <div class="card-img" style="background-image: url('${escAttr(l.image || l.imageUrl)}'); background-size: cover; background-position: center; border-bottom: 1px solid rgba(230, 222, 206, 0.92);">
                    <button class="fav-btn saved" onclick="removeFav(event, ${l.id})">
                      <i class="bi bi-heart-fill" style="color: #e74c3c;"></i>
                    </button>
                  </div>
                  <div class="card-body">
                    <div class="card-title">${esc(l.name)}</div>
                    <div class="card-location"><i class="bi bi-geo-alt"></i> ${esc(l.location)}</div>
                    <button onclick="addToTripFromFav(${l.id})" class="btn-eco w-100 mt-2" style="font-size:.82rem; padding:8px; justify-content:center; border:none;">
                      <i class="bi bi-plus"></i> Add to Trip
                    </button>
                  </div>
                </div>
              </div>
            `).join('');
        }
    } catch (error) {
        console.error("Error loading favorites from database:", error);
        renderFavoritesError();
    }
}

async function removeFav(e, id) {
    e.stopPropagation();
    const userEmail = localStorage.getItem('ecoUserEmail');
    if (!userEmail) return;

    // 1. Tell MongoDB to remove it
    try {
        await fetch(`/api/users/${userEmail}/favorites`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationId: id })
        });
        
        // 2. Re-render the page with the fresh database info
        renderFavs();
        if(typeof showToast === 'function') {
            showToast('Removed from favorites', 'info', {
                duration: 6000,
                undoLabel: 'Undo',
                onUndo: async () => {
                    try {
                        await fetch(`/api/users/${userEmail}/favorites`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ destinationId: id })
                        });
                        renderFavs();
                        showToast('Favorite restored', 'info');
                    } catch (error) {
                        console.error("Failed to restore favorite:", error);
                        showToast('Could not restore favorite.', 'error');
                    }
                }
            });
        }
        
    } catch (error) {
        console.error("Failed to remove from database:", error);
    }
}

// Add to Trip from Favorites
function addToTripFromFav(id) {
    // 1. Find the destination in the list fetched from MongoDB
    const item = LISTINGS.find(l => l.id === id);
    if (!item) return;

    // 2. Grab our "Shopping Cart" of pending ideas
    let savedIdeas = JSON.parse(localStorage.getItem('ecoPendingIdeas') || '[]');

    // 3. Pack the item into the cart
    savedIdeas.push(buildTripStopFromListing(item));

    // 4. Save the cart back to the browser's memory
    localStorage.setItem('ecoPendingIdeas', JSON.stringify(savedIdeas));

    // 5. Instantly redirect to the Planner page so the Bridge can unpack it!
    window.location.href = 'planner.html';
}

document.addEventListener('DOMContentLoaded', renderFavs);
