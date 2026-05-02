/* ═══════════════════════════════════════════════════════════
   favorites.js  —  Owner: Ye Qinglan & Lim Rui Xuan
   Rendering saved favorite items
   Used by: favorites.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

function ecoColor(score) {
  if (score >= 9) return '';
  if (score >= 8) return 'medium';
  return 'low';
}

async function renderFavs() {
    const grid  = document.getElementById('favGrid');
    const empty = document.getElementById('emptyFavs');
    
    // 1. Who is logged in?
    const userEmail = localStorage.getItem('ecoUserEmail'); 

    try {
        // 2. Fetch the user's profile from MongoDB
        const response = await fetch(`/api/users/profile/${userEmail}`);
        const userData = await response.json();

        if (userData.success) {
            // 3. Extract the array of saved IDs directly from the database!
            const dbFavorites = userData.data.favorites; 
            
            // 4. Match them against your master LISTINGS array
            const favList = LISTINGS.filter(l => dbFavorites.includes(l.id));

            if (favList.length === 0) {
                grid.innerHTML = '';
                empty.style.display = 'block';
                return;
            }

            // Render cards (same as before)
            empty.style.display = 'none';
            grid.innerHTML = favList.map(l => `
              <div class="col-sm-6 col-lg-4">
                <div class="listing-card">
                  <div class="card-img">
                    <span style="font-size:3.5rem;">${l.icon}</span>
                    <button class="fav-btn saved" onclick="removeFav(event, ${l.id})">
                      <i class="bi bi-heart-fill" style="color: #e74c3c;"></i>
                    </button>
                  </div>
                  <div class="card-body">
                    <div class="card-title">${l.name}</div>
                    <div class="card-location"><i class="bi bi-geo-alt"></i> ${l.location}</div>
                    <a href="planner.html" class="btn-eco w-100 mt-2" style="font-size:.82rem; padding:8px; justify-content:center; text-decoration:none;">
                      <i class="bi bi-plus"></i> Add to Itinerary
                    </a>
                  </div>
                </div>
              </div>
            `).join('');
        }
    } catch (error) {
        console.error("Error loading favorites from database:", error);
    }
}

async function removeFav(e, id) {
    e.stopPropagation();
    const userEmail = localStorage.getItem('ecoUserEmail') || 'test@ecoplanner.com';

    // 1. Tell MongoDB to remove it
    try {
        await fetch(`/api/users/${userEmail}/favorites`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destinationId: id })
        });
        
        // 2. Re-render the page with the fresh database info
        renderFavs();
        if(typeof showToast === 'function') showToast('Removed from favorites');
        
    } catch (error) {
        console.error("Failed to remove from database:", error);
    }
}

document.addEventListener('DOMContentLoaded', renderFavs);