/* ═══════════════════════════════════════════════════════════
   auth.js  —  Owner: Cha Zi Yu
   Form validation & LocalStorage mock sessions
   Used by: login.html, register.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw    = document.getElementById('loginPw').value;

  if (!email || !pw) { showToast('Please enter your credentials ⚠️', 'warn'); return; }

  // TODO: replace with real API call — POST /api/auth/login
  sessionStorage.setItem('user', JSON.stringify({ name: 'Ahmad Razif', email }));
  showToast('Welcome back! 🌿');
  setTimeout(() => window.location.href = 'explore.html', 400);
}

function doRegister() {
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pw    = document.getElementById('regPw').value;

  if (!name || !email || !pw) { showToast('Please fill in all fields ⚠️', 'warn'); return; }
  if (pw.length < 8)          { showToast('Password must be at least 8 characters ⚠️', 'warn'); return; }

  // TODO: replace with real API call — POST /api/auth/register
  sessionStorage.setItem('user', JSON.stringify({ name, email }));
  showToast('Account created! Welcome, ' + name + ' 🌿');
  setTimeout(() => window.location.href = 'explore.html', 600);
}
