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
 
// Default demo user seeded if nothing in session
function seedDemoUser() {
  if (!Store.get('user')) {
    Store.set('user', {
      name:      'Ahmad Razif',
      email:     'demo@ecoplanner.com',
      password:  'password123',       // plain-text only for Phase 1 mock
      budget:    'mid',
      interests: ['🏞 Nature', '🚲 Cycling', '🍃 Vegan Food'],
      joinedAt:  'Jan 2025',
      trips:     0,
      favorites: 0,
      days:      0
    });
  }
}
 
/* ══════════════════════════════════════════
   AVAILABLE INTERESTS
   ══════════════════════════════════════════ */
const ALL_INTERESTS = [
  '🏞 Nature', '🚲 Cycling', '🍃 Vegan Food', '🏕 Camping',
  '🐠 Snorkeling', '🌿 Eco-lodges', '🚶 Hiking', '🌊 Beach',
  '🦋 Wildlife', '☕ Café Culture', '🎭 Arts & Culture', '🧘 Wellness'
];
 
let tempInterests = [];   // used by interest modal
 
/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
(function init() {
  seedDemoUser();
  renderProfile();
  renderInterestDisplay();

  // Make the avatar clickable
  document.getElementById('profileAvatar').addEventListener('click', function() {
    document.getElementById('avatarInput').click();
  });

  // Listen for when a file is selected
  document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);
})();
 
function renderProfile() {
  const user = Store.get('user') || {};
  const initials = getInitials(user.name || 'U');
 
  // Nav & sidebar avatar
  document.getElementById('navInitial').textContent = initials;
 
  // Summary card avatar (use uploaded image if exists, else initials)
  const avatarDiv = document.getElementById('profileAvatar');
  if (user.avatar) {
    avatarDiv.innerHTML = `<img src="${user.avatar}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">`;
  } else {
    avatarDiv.textContent = initials;
  }

  // Summary card
  document.getElementById('profileName').textContent   = user.name  || '—';
  document.getElementById('profileEmail').textContent  = user.email || '—';
  document.getElementById('memberSince').textContent   = 'Member since ' + (user.joinedAt || '—');
  document.getElementById('tripCount').textContent     = (user.trips || 0) + ' trips completed';
 
  // Stats
  document.getElementById('statFavs').textContent  = user.favorites || 0;
  document.getElementById('statTrips').textContent = user.trips     || 0;
  document.getElementById('statDays').textContent  = user.days      || 0;
 
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

  // Add this where you update the stats
  document.getElementById('statCO2').textContent = user.co2Saved || 0;
  
  // Add this where you pre-fill the edit form
  document.getElementById('editCity').value = user.city || '';

  // Add this to set the toggle switches
  const tripToggle = document.getElementById('notifTrip');
  const ecoToggle = document.getElementById('notifEco');
  if(tripToggle) tripToggle.checked = user.notifTrip !== false;
  if(ecoToggle) ecoToggle.checked = user.notifEco === true;
}
 
function renderInterestDisplay() {
  const user = Store.get('user') || {};
  const interests = user.interests || [];
  const container = document.getElementById('interestDisplay');
  container.innerHTML = interests.map(i =>
    `<span class="pref-tag">${i} <span style="margin-left:.2rem;opacity:.5;font-size:.7rem;" onclick="removeInterest('${i}')">✕</span></span>`
  ).join('') +
  `<span class="pref-tag add-tag" onclick="openInterestModal()">+ Add</span>`;
}

/* ══════════════════════════════════════════
   SAVE PROFILE
   ══════════════════════════════════════════ */
function saveProfile() {
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
 
  const user = Store.get('user') || {};
  user.name   = name;
  user.email  = email;
  user.city   = document.getElementById('editCity').value.trim() || 'Kuala Lumpur';/*Kuala Lumpur akan be a default city */
  user.budget = document.getElementById('editBudget').value;
  Store.set('user', user);
 
  renderProfile();
  showToast('Profile updated successfully! ✅');
}
 
/* ══════════════════════════════════════════
   CHANGE PASSWORD
   ══════════════════════════════════════════ */
function changePassword() {
  const current  = document.getElementById('currentPw').value;
  const newPw    = document.getElementById('newPw').value;
  const confirm  = document.getElementById('confirmPw').value;
  let valid = true;
 
  clearHint('hintCurrentPw'); clearHint('hintNewPw'); clearHint('hintConfirmPw');
  ['currentPw','newPw','confirmPw'].forEach(id => document.getElementById(id).classList.remove('error'));
 
  const user = Store.get('user') || {};
 
  // Phase 1: plain-text password check (Phase 2 will use bcrypt via API)
  if (current !== (user.password || 'password123')) {
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
 
  user.password = newPw;
  Store.set('user', user);
 
  document.getElementById('currentPw').value = '';
  document.getElementById('newPw').value     = '';
  document.getElementById('confirmPw').value = '';
  document.getElementById('strengthBar').style.width = '0';
  document.getElementById('strengthLabel').textContent = '';
 
  showToast('Password updated successfully! 🔒');
}
 
/* ══════════════════════════════════════════
   INTERESTS
   ══════════════════════════════════════════ */
function openInterestModal() {
  const user = Store.get('user') || {};
  tempInterests = [...(user.interests || [])];
 
  const container = document.getElementById('interestChips');
  container.innerHTML = ALL_INTERESTS.map(i =>
    `<span class="interest-chip ${tempInterests.includes(i) ? 'selected' : ''}" onclick="toggleInterest(this,'${i}')">${i}</span>`
  ).join('');
 
  openModal('interestModal');
}
 
function toggleInterest(el, interest) {
  if (tempInterests.includes(interest)) {
    tempInterests = tempInterests.filter(x => x !== interest);
    el.classList.remove('selected');
  } else {
    tempInterests.push(interest);
    el.classList.add('selected');
  }
}
 
function saveInterests() {
  const user = Store.get('user') || {};
  user.interests = [...tempInterests];
  Store.set('user', user);
  renderInterestDisplay();
  closeModal('interestModal');
  showToast('Interests updated! 🌿');
}
 
function removeInterest(interest) {
  const user = Store.get('user') || {};
  user.interests = (user.interests || []).filter(x => x !== interest);
  Store.set('user', user);
  renderInterestDisplay();
}
 
/* ══════════════════════════════════════════
   DELETE ACCOUNT
   ══════════════════════════════════════════ */
function deleteAccount() {
  closeModal('deleteModal');
  // Phase 2: DELETE /api/users
  Store.clear();
  showToast('Account deleted. Goodbye! 💚');
  setTimeout(() => window.location.href = 'index.html', 1500);
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
function openModal(id)  { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
 
// Close modal on backdrop click
document.querySelectorAll('.eco-modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) backdrop.style.display = 'none';
  });
});
 
/* ══════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════ */
function showToast(msg, type = 'success') {
  const wrap  = document.getElementById('toastWrap');
  const toast = document.createElement('div');
  toast.className = 'toast-item' + (type !== 'success' ? ' ' + type : '');
  toast.innerHTML = `<i class="bi bi-${type === 'warn' ? 'exclamation-triangle' : type === 'error' ? 'x-circle' : 'check-circle'}"></i> ${msg}`;
  wrap.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
 
/* ══════════════════════════════════════════
   VALIDATION HELPERS
   ══════════════════════════════════════════ */
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function getInitials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
function showHint(id)  { document.getElementById(id).classList.add('show'); }
function clearHint(id) { document.getElementById(id).classList.remove('show'); }


function seedDemoUser() {
  if (!Store.get('user')) {
    Store.set('user', {
      name:      'Ahmad Razif',
      email:     'demo@ecoplanner.com',
      city:      'Kuala Lumpur', // NEW
      password:  'password123',       
      budget:    'mid',
      interests: ['🏞 Nature', '🚲 Cycling', '🍃 Vegan Food'],
      joinedAt:  'Jan 2025',
      trips:     3,
      favorites: 5,
      co2Saved:  42, // NEW
      notifTrip: true, // NEW
      notifEco:  false // NEW
    });
  }
}

function saveToggles() {
  const user = Store.get('user') || {};
  user.notifTrip = document.getElementById('notifTrip').checked;
  user.notifEco = document.getElementById('notifEco').checked;
  Store.set('user', user);
  showToast('Preferences saved! ⚙️');
}

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
  reader.onload = function(e) {
    const base64Image = e.target.result;
    
    const user = Store.get('user') || {};
    user.avatar = base64Image;
    Store.set('user', user);
    
    renderProfile();
    showToast('Profile picture updated! 📸');
  };
  
  reader.readAsDataURL(file);
}