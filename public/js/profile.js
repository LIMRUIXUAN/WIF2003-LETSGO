/* ═══════════════════════════════════════════════════════════
   profile.js  —  Owner: Lim Rui Xuan
   Profile edit logic & mock soft delete
   Used by: profile.html
   ═══════════════════════════════════════════════════════════ */

'use strict';
 
/* ══════════════════════════════════════════
   STORAGE HELPERS  (sessionStorage mock)
   In Phase 2 replace these with fetch() calls
   ══════════════════════════════════════════ */
const Store = {
  get: key => {
    try { return JSON.parse(sessionStorage.getItem(key)); }
    catch { return null; }
  },
  set: (key, val) => sessionStorage.setItem(key, JSON.stringify(val)),
  clear: () => sessionStorage.clear()
};
 
/* ══════════════════════════════════════════
   AVAILABLE INTERESTS
   ══════════════════════════════════════════ */
const ALL_INTERESTS = [
  '🏞 Nature', '🚲 Cycling', '🍃 Vegan Food', '🏕 Camping',
  '🐠 Snorkeling', '🌿 Eco-lodges', '🚶 Hiking', '🌊 Beach',
  '🦋 Wildlife', '☕ Café Culture', '🎭 Arts & Culture', '🧘 Wellness'
];
 
let tempInterests = [];   // used by interest modal
let currentUserData = {};

async function loadProfile() {
    // 1. Who is logged in?
    const userEmail = localStorage.getItem('ecoUserEmail');
    if (!userEmail) return;

    try {
        // 2. Ask MongoDB for the real profile
        const response = await fetch(`/api/users/profile/${userEmail}`);
        const data = await response.json();

        if (data.success) {
            currentUserData = data.data; // Save it globally for editing later
            const allHints = ['hintName', 'hintEmail', 'hintCurrentPw', 'hintNewPw', 'hintConfirmPw'];
            allHints.forEach(id => clearHint(id));
            // 3. Draw the screen with the REAL data!
            renderProfile(currentUserData);
            renderInterestDisplay(currentUserData);
        }
    } catch (error) {
        console.error("Failed to load profile from database:", error);
    }
}

// ── INIT ──
(function init() {
  // Fire off the database fetch!
  loadProfile();

  // Make the avatar clickable
  const avatarEl = document.getElementById('profileAvatar');
  if(avatarEl) {
      avatarEl.addEventListener('click', function() {
        document.getElementById('avatarInput').click();
      });
  }

  // Listen for when a file is selected
  const inputEl = document.getElementById('avatarInput');
  if(inputEl) {
      inputEl.addEventListener('change', handleAvatarUpload);
  }

  const autoSaveFields = ['editName', 'editEmail', 'editCity', 'editBudget', 'notifTrip', 'notifEco'];
  
  //bagi any change be autosaved
  autoSaveFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    // For text inputs: save after user stops typing (blur)
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') {
      el.addEventListener('blur', autoSaveProfile);
    } 
    // For selects and toggles: save immediately on change
    else {
      el.addEventListener('change', autoSaveProfile);
    }
  });
})();

 
function renderProfile(user) {
  if (!user) return; // Safety check
  const initials = getInitials(user.name || 'U');
 
  // Nav & sidebar avatar
  document.getElementById('navInitial').textContent = initials;
 
  // Summary card avatar
  const avatarDiv = document.getElementById('profileAvatar');
  if (user.avatar && user.avatar.trim() !== "") {
    avatarDiv.innerHTML = `<img src="${user.avatar}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
    avatarDiv.textContent = ""; // Clear initials if image exists
  } else {
    avatarDiv.innerHTML = ""; 
    avatarDiv.textContent = initials;
  }

  // Summary card
  document.getElementById('profileName').textContent   = user.name  || '—';
  document.getElementById('profileEmail').textContent  = user.email || '—';
  document.getElementById('memberSince').textContent   = 'Member since ' + (user.joinedAt || '2026');
  document.getElementById('tripCount').textContent     = (user.trips || 0) + ' trips completed';
 
  // Stats
  const favCount = user.favorites ? user.favorites.length : 0;
  document.getElementById('statFavs').textContent  = favCount;
  document.getElementById('statTrips').textContent = user.trips     || 0;
  document.getElementById('statDays').textContent  = user.days      || 0;
  document.getElementById('statCO2').textContent   = user.co2Saved      || 0;
  const fpEl = document.getElementById('statFootprint');
  if (fpEl) fpEl.textContent = user.co2Footprint || 0;
 
  // Badge based on trips
  const trips = user.trips || 0;
  let badge = 'New Explorer';
  if (trips >= 20) badge = '🌍 Eco Champion';
  else if (trips >= 10) badge = '🌱 Green Traveler';
  else if (trips >= 5)  badge = '🌿 Eco Curious';
  document.getElementById('profileBadge').textContent = badge;
 
  // Edit form pre-fill
  document.getElementById('editName').value  = user.name  || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editCity').value  = user.city  || '';
 
  // Budget select
  const budgetSel = document.getElementById('editBudget');
  if (user.budget) budgetSel.value = user.budget;

  // Toggle switches
  const tripToggle = document.getElementById('notifTrip');
  const ecoToggle = document.getElementById('notifEco');
  if(tripToggle) tripToggle.checked = user.notifTrip !== false;
  if(ecoToggle) ecoToggle.checked = user.notifEco === true;
}
 
function renderInterestDisplay(user) {
  if (!user) return;
  const interests = user.interests || [];
  const container = document.getElementById('interestDisplay');
  
  // What to show if they have no interests yet
  if (interests.length === 0) {
      container.innerHTML = `
        <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; color: #6c757d; font-size: 0.85rem; text-align: center; border: 1px dashed #ddd;">
          No travel interests added yet. <br>
          <button class="btn btn-sm mt-2" style="background:#e8f5e9; color:#27ae60; border:none; font-weight: 600;" onclick="openInterestModal()">+ Add Your Favorites</button>
        </div>`;
      return;
  }

  // Draw the beautiful green pill-badges!
  container.innerHTML = interests.map(i =>
    `<span class="badge rounded-pill text-dark shadow-sm" style="background-color: #e8f5e9; border: 1px solid #c8e6c9; padding: 8px 12px; margin: 4px 4px 8px 0; font-weight: 500; font-size: 0.85rem;">
        ${i} 
        <i class="bi bi-x-circle-fill ms-2" style="color: #27ae60; opacity: 0.7; cursor: pointer; font-size: 0.9rem;" 
           onclick="removeInterest('${i}')" 
           onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7"></i>
     </span>`
  ).join('') +
  `<span class="badge rounded-pill shadow-sm" onclick="openInterestModal()" 
         style="background-color: #fff; border: 1px dashed #adb5bd; color: #6c757d; padding: 8px 12px; margin: 4px 0 8px 0; cursor: pointer; transition: all 0.2s;" 
         onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='#fff'">
      <i class="bi bi-plus-lg"></i> Add
   </span>`;
}

/* ══════════════════════════════════════════
   SAVE PROFILE
   ══════════════════════════════════════════ */
async function saveProfile() {
  const name  = document.getElementById('editName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  let valid = true;
 
  clearHint('hintName');  clearHint('hintEmail');
  document.getElementById('editName').classList.remove('error');
  document.getElementById('editEmail').classList.remove('error');
 
  if (!name) {
    showHint('hintName'); document.getElementById('editName').classList.add('error');
    valid = false;
  }
  if (!isValidEmail(email)) {
    showHint('hintEmail'); document.getElementById('editEmail').classList.add('error');
    valid = false;
  }
  if (!valid) { showToast('Please fix the errors above ⚠️', 'warn'); return; }
 
  currentUserData.name   = name;
  currentUserData.email  = email;
  currentUserData.city   = document.getElementById('editCity').value.trim() || 'Kuala Lumpur';
  currentUserData.budget = document.getElementById('editBudget').value;
 
  renderProfile(currentUserData);
  try {
      const userEmail = localStorage.getItem('ecoUserEmail');
      const response = await fetch(`/api/users/${userEmail}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentUserData)
      });
      
      const result = await response.json();
      if(result.success){
          currentUserData = result.data;
          if (result.token) {
              localStorage.setItem('ecoAuthToken', result.token);
          }
          if (result.data.email) {
              localStorage.setItem('ecoUserEmail', result.data.email);
          }
          if (result.data.name) {
              localStorage.setItem('ecoUserName', result.data.name);
              localStorage.setItem('ecoUserInitials', getInitials(result.data.name));
          }
          
          showToast('Profile updated successfully! ✅');
      }else
          showToast('Error saving to database.', 'error');
    } catch (error) {
        console.error("Failed to save profile:", error);
        showToast('Network error saving profile.', 'error');
    }
}
 
/* ══════════════════════════════════════════
   CHANGE PASSWORD
   ══════════════════════════════════════════ */
async function changePassword() {
  const current  = document.getElementById('currentPw').value;
  const newPw    = document.getElementById('newPw').value;
  const confirm  = document.getElementById('confirmPw').value;
  let valid = true;
 
  clearHint('hintCurrentPw'); clearHint('hintNewPw'); clearHint('hintConfirmPw');
  ['currentPw','newPw','confirmPw'].forEach(id => document.getElementById(id).classList.remove('error'));
 
  if (!current) {
    showHint('hintCurrentPw'); document.getElementById('currentPw').classList.add('error');
    valid = false;
  }
  if (newPw.length < 8) {
    showHint('hintNewPw'); document.getElementById('newPw').classList.add('error');
    valid = false;
  }
  if (newPw !== confirm) {
    showHint('hintConfirmPw'); document.getElementById('confirmPw').classList.add('error');
    valid = false;
  }
  if (!valid) return;

  try {
    const userEmail = localStorage.getItem('ecoUserEmail');
    const response = await fetch(`/api/users/${userEmail}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPw })
    });
    const result = await response.json();

    if (!result.success) {
      showHint('hintCurrentPw');
      document.getElementById('currentPw').classList.add('error');
      showToast(result.message || 'Could not update password.', 'error');
      return;
    }

    document.getElementById('currentPw').value = '';
    document.getElementById('newPw').value     = '';
    document.getElementById('confirmPw').value = '';
    document.getElementById('strengthBar').style.width = '0';
    document.getElementById('strengthLabel').textContent = '';

    showToast('Password updated successfully! 🔒');
  } catch (error) {
    console.error("Password change failed:", error);
    showToast('Network error changing password.', 'error');
  }
}
 
/* ══════════════════════════════════════════
   INTERESTS MODAL & MONGODB LOGIC
   ══════════════════════════════════════════ */
function openInterestModal() {
  // 1. Read from the REAL MongoDB object
  tempInterests = [...(currentUserData.interests || [])];
 
  const container = document.getElementById('interestChips');
  
  // 2. Draw the chips with dynamic highlighting logic
  container.innerHTML = ALL_INTERESTS.map(i => {
    const isSelected = tempInterests.includes(i);
    const bg = isSelected ? '#e8f5e9' : 'transparent';
    const border = isSelected ? '#27ae60' : '#ddd';
    const color = isSelected ? '#27ae60' : 'inherit';
    
    return `<span class="interest-chip" 
             onclick="toggleInterest(this,'${i}')"
             style="display:inline-block; padding:8px 16px; margin:4px; border-radius:20px; cursor:pointer; transition:0.2s; background:${bg}; border:1px solid ${border}; color:${color}; user-select:none;">
              ${i}
            </span>`;
  }).join('');
 
  openModal('interestModal');
}
 
function toggleInterest(el, interest) {
  if (tempInterests.includes(interest)) {
    // Visually un-select it
    tempInterests = tempInterests.filter(x => x !== interest);
    el.style.background = 'transparent';
    el.style.borderColor = '#ddd';
    el.style.color = 'inherit';
  } else {
    // Visually select it
    tempInterests.push(interest);
    el.style.background = '#e8f5e9';
    el.style.borderColor = '#27ae60';
    el.style.color = '#27ae60';
  }
}
 
async function saveInterests() {
  // 1. Update the global object & close modal
  currentUserData.interests = [...tempInterests];
  renderInterestDisplay(currentUserData);
  closeModal('interestModal');
  
  // 2. Fire the save off to MongoDB!
  try {
      const userEmail = localStorage.getItem('ecoUserEmail');
      await fetch(`/api/users/${userEmail}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentUserData)
      });
      showToast('Interests updated! 🌿');
  } catch(e) { console.error("Save error:", e); }
}
 
async function removeInterest(interest) {
  const previousInterests = [...(currentUserData.interests || [])];

  // 1. Instantly remove from the global object
  currentUserData.interests = (currentUserData.interests || []).filter(x => x !== interest);
  renderInterestDisplay(currentUserData);
  
  // 2. Fire the deletion off to MongoDB!
  try {
      const userEmail = localStorage.getItem('ecoUserEmail');
      await fetch(`/api/users/${userEmail}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentUserData)
      });
      showToast('Interest removed', 'info', {
        duration: 6000,
        undoLabel: 'Undo',
        onUndo: async () => {
          currentUserData.interests = previousInterests;
          renderInterestDisplay(currentUserData);

          try {
            await fetch(`/api/users/${userEmail}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(currentUserData)
            });
            showToast('Interest restored', 'info');
          } catch (e) {
            console.error("Restore error:", e);
            showToast('Could not restore interest.', 'error');
          }
        }
      });
  } catch(e) {
    console.error("Remove error:", e);
    currentUserData.interests = previousInterests;
    renderInterestDisplay(currentUserData);
    showToast('Could not remove interest.', 'error');
  }
}
 
/* ══════════════════════════════════════════
   DELETE ACCOUNT
   ══════════════════════════════════════════ */
async function deleteAccount() {
  closeModal('deleteModal');
  const userEmail = localStorage.getItem('ecoUserEmail');

  if (!userEmail) {
    if (typeof clearAuthSession === 'function') clearAuthSession();
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch(`/api/users/${userEmail}`, { method: 'DELETE' });
    const result = await response.json();

    if (!result.success) {
      showToast(result.message || 'Could not delete account.', 'error');
      return;
    }

    if (typeof clearAuthSession === 'function') clearAuthSession();
    else Store.clear();
    showToast('Account deleted. Goodbye! 💚');
    setTimeout(() => window.location.href = 'index.html', 1500);
  } catch (error) {
    console.error("Account deletion failed:", error);
    showToast('Network error deleting account.', 'error');
  }
}
 
/* ══════════════════════════════════════════
   PASSWORD STRENGTH
   ══════════════════════════════════════════ */
function checkStrength(pw) {
  const bar   = document.getElementById('strengthBar');
  const label = document.getElementById('strengthLabel');
  if (!pw) { bar.style.width = '0'; label.textContent = ''; return; }
 
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
 
  const levels = [
    { label: 'Very Weak',  color: '#e74c3c', width: '20%' },
    { label: 'Weak',       color: '#e67e22', width: '35%' },
    { label: 'Fair',       color: '#f1c40f', width: '55%' },
    { label: 'Good',       color: '#27ae60', width: '75%' },
    { label: 'Strong',     color: '#1abc9c', width: '100%'},
  ];
  const lv = levels[Math.min(score, 4)];
  bar.style.width      = lv.width;
  bar.style.background = lv.color;
  label.textContent    = lv.label;
  label.style.color    = lv.color;
}
 
/* ══════════════════════════════════════════
   TOGGLE PASSWORD VISIBILITY
   ══════════════════════════════════════════ */
function togglePw(inputId, iconEl) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  iconEl.className = isHidden ? 'bi bi-eye-slash toggle-pw' : 'bi bi-eye toggle-pw';
  iconEl.style.cssText = 'position:absolute;right:.75rem;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--text-faint);';
}
 
/* ══════════════════════════════════════════
   MODAL HELPERS
   ══════════════════════════════════════════ */
// openModal and closeModal are provided by app.js
 
// Close modal on backdrop click
document.querySelectorAll('.eco-modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) backdrop.style.display = 'none';
  });
});
 
/* ══════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════ */
// showToast is provided by app.js — removed duplicate to avoid shadowing
 
/* ══════════════════════════════════════════
   VALIDATION HELPERS
   ══════════════════════════════════════════ */
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function getInitials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
function showHint(id)  { 
    const el = document.getElementById(id);
    if (el) { 
        el.style.display = 'block'; 
        el.style.color = '#c0392b'; // Make it angpao ang ang
        el.style.fontSize = '0.8rem';
        el.style.marginTop = '0.25rem';
    }
}
function clearHint(id){
  const el = document.getElementById(id);
  if(el)
    el.style.display = 'none';// force the hint disappear
}

// saveToggles removed — toggles are auto-saved to MongoDB via autoSaveProfile()

/* ══════════════════════════════════════════
   AVATAR UPLOAD
   ══════════════════════════════════════════ */
function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Ensure it's an image
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file. ⚠️', 'warn');
    return;
  }

  const reader = new FileReader();
  
  // Convert image to Base64 string to store in sessionStorage
  reader.onload = async function(e) {
    const base64Image = e.target.result;
    currentUserData.avatar = base64Image;
    renderProfile(currentUserData);

    // Persist avatar to MongoDB
    try {
      const userEmail = localStorage.getItem('ecoUserEmail');
      await fetch(`/api/users/${userEmail}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: base64Image })
      });
      showToast('Profile picture updated! 📸');
    } catch (err) {
      console.error('Failed to save avatar:', err);
      showToast('Profile picture updated locally but failed to save.', 'warn');
    }
  };
  
  reader.readAsDataURL(file);
}

/* ══════════════════════════════════════════
    AUTO-SAVE PROFILE ON CHANGE
   ══════════════════════════════════════════ */
async function autoSaveProfile() {
  const name  = document.getElementById('editName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
 
  // Basic validation before sending to DB
  if (!name || !isValidEmail(email)) return; 
 
  // 1. Sync global object with UI
  currentUserData.name   = name;
  currentUserData.email  = email;
  currentUserData.city   = document.getElementById('editCity').value.trim();
  currentUserData.budget = document.getElementById('editBudget').value;
  currentUserData.notifTrip = document.getElementById('notifTrip').checked;
  currentUserData.notifEco  = document.getElementById('notifEco').checked;
 
  // 2. Silently update MongoDB
  try {
      const userEmail = localStorage.getItem('ecoUserEmail');
      const response = await fetch(`/api/users/${userEmail}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentUserData)
      });
      const result = await response.json();
      if (result.success) {
        currentUserData = result.data;
        if (result.token) localStorage.setItem('ecoAuthToken', result.token);
        if (result.data.email) localStorage.setItem('ecoUserEmail', result.data.email);
      }
      // Update the UI elements (initials, name display) instantly
      renderProfile(currentUserData);
      console.log("Autosave successful...");
  } catch (error) {
      console.error("Autosave failed:", error);
  }
}
