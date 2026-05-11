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
    // 1. Find the destination in the master list yeah I know this is inefficient but it's just a demo okay
    const item = LISTINGS.find(l => l.id === id);
    if (!item) return;

    // 2. Grab our "Shopping Cart" of pending ideas
    let savedIdeas = JSON.parse(localStorage.getItem('ecoPendingIdeas') || '[]');

    // 3. Pack the item into the cart
    savedIdeas.push({
        time: 'Flexible',
        icon: item.icon,
        name: item.name,
        sub: item.cat,
        carbon: parseInt(item.co2.replace(/\D/g,'')) || 5 
    });

    // 4. Save the cart back to the browser's memory
    localStorage.setItem('ecoPendingIdeas', JSON.stringify(savedIdeas));

    // 5. Instantly redirect to the Planner page so the Bridge can unpack it!
    window.location.href = 'planner.html';
}

document.addEventListener('DOMContentLoaded', renderFavs);
