/* ═══════════════════════════════════════════════════════════
   profile.js  —  Owner: Lim Rui Xuan
   Profile edit logic & mock soft delete
   Used by: profile.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

function saveProfile() {
  const name  = document.getElementById('editName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  if (!name || !email) { showToast('Please fill in all fields ⚠️', 'warn'); return; }

  // TODO: replace with real API call — PUT /api/users/profile
  const user  = JSON.parse(sessionStorage.getItem('user') || '{}');
  user.name   = name;
  user.email  = email;
  sessionStorage.setItem('user', JSON.stringify(user));

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileName').textContent   = name;
  document.getElementById('profileEmail').textContent  = email;
  document.getElementById('navInitial').textContent    = initials;

  showToast('Profile updated successfully! ✅');
}

function deleteAccount() {
  closeModal('deleteModal');
  // TODO: replace with real API call — DELETE /api/users
  sessionStorage.clear();
  showToast('Account deleted. Goodbye! 💚');
  setTimeout(() => window.location.href = 'index.html', 1000);
}

/* Populate profile fields from session on page load */
(function initProfile() {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  if (!user) return;
  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileName').textContent   = user.name  || '';
  document.getElementById('profileEmail').textContent  = user.email || '';
  document.getElementById('navInitial').textContent    = initials;
  document.getElementById('editName').value            = user.name  || '';
  document.getElementById('editEmail').value           = user.email || '';
})();
