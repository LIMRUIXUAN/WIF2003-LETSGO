/* ═══════════════════════════════════════════════════════════
   app.js  —  Shared logic (everyone uses this)
   Nav bar helpers, modal, toast, chip toggle, global state
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── SHARED STATE ── */
let favorites   = new Set();

function getAuthToken() {
  return localStorage.getItem('ecoAuthToken') || '';
}

function clearAuthSession() {
  localStorage.removeItem('ecoAuthToken');
  localStorage.removeItem('ecoUserEmail');
  localStorage.removeItem('ecoUserName');
  localStorage.removeItem('ecoUserInitials');
  localStorage.removeItem('isLoggedIn');
  sessionStorage.clear();
}

function isInternalApiRequest(resource) {
  const url = typeof resource === 'string' ? resource : resource?.url;
  if (!url) return false;

  if (url.startsWith('/api/')) return true;

  try {
    return new URL(url, window.location.origin).origin === window.location.origin
      && new URL(url, window.location.origin).pathname.startsWith('/api/');
  } catch (_error) {
    return false;
  }
}

const nativeFetch = window.fetch.bind(window);
window.fetch = function fetchWithAuth(resource, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || (resource instanceof Request ? resource.headers : undefined));

  if (token && isInternalApiRequest(resource)) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return nativeFetch(resource, { ...options, headers }).then(response => {
    if (response.status === 401 && isInternalApiRequest(resource)) {
      clearAuthSession();
      if (!window.location.pathname.endsWith('/login.html') && !window.location.pathname.endsWith('/register.html')) {
        window.location.href = 'login.html';
      }
    }
    return response;
  });
};

/* ── SHARED DATA: Eco listings (fetched from MongoDB via API) ── */
let LISTINGS = [];

/**
 * Fetches all destinations from the backend API and populates the
 * shared LISTINGS array. Every page that depends on LISTINGS should
 * await this function before rendering listing-dependent UI.
 */
async function loadListingsFromAPI() {
  try {
    const response = await fetch('/api/destinations');
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      LISTINGS = data.data;
    }
  } catch (error) {
    console.error('Failed to load destinations from API:', error);
  }
  return LISTINGS;
}

/* ── MODAL ── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('d-none');
    el.style.display = 'flex';
  }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('d-none');
    el.style.display = 'none';
  }
}

/* ── TOAST NOTIFICATIONS ── */
function showToast(msg, type = 'success', options = {}) {
  let wrap  = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }

  if (typeof type === 'object' && type !== null) {
    options = type;
    type = options.type || 'success';
  }

  const t     = document.createElement('div');
  const color = type === 'warn'
    ? '#f39c12'
    : type === 'info'
      ? '#3498db'
      : type === 'error'
        ? '#e74c3c'
        : 'var(--eco-green)';
  const icon  = type === 'warn'
    ? 'exclamation-triangle'
    : type === 'info'
      ? 'info-circle'
      : type === 'error'
        ? 'x-circle-fill'
        : 'check-circle-fill';
  const duration = options.duration || 3500;
  const hasUndo = typeof options.onUndo === 'function';
  let closed = false;
  let timerId = null;

  t.className = `toast-notif${hasUndo ? ' toast-undo' : ''}`;
  t.style.borderLeftColor = color;
  t.innerHTML = `
    <i class="bi bi-${icon}" style="color:${color}; font-size:1rem;"></i>
    <span class="toast-message">${msg}</span>
    ${hasUndo ? `<button type="button" class="toast-action">${options.undoLabel || 'Undo'}</button>` : ''}
    ${hasUndo ? `<span class="toast-timer" style="animation-duration:${duration}ms;"></span>` : ''}
  `;
  wrap.appendChild(t);

  const closeToast = (undone = false) => {
    if (closed) return;
    closed = true;
    clearTimeout(timerId);
    t.classList.add('toast-leaving');
    setTimeout(() => t.remove(), 180);

    if (undone && hasUndo) {
      options.onUndo();
      return;
    }

    if (!undone && typeof options.onExpire === 'function') {
      options.onExpire();
    }
  };

  if (hasUndo) {
    t.querySelector('.toast-action').addEventListener('click', event => {
      event.stopPropagation();
      closeToast(true);
    });
  }

  timerId = setTimeout(() => closeToast(false), duration);
  return { close: closeToast, element: t };
}

/* ── CHIP TOGGLE (used on register, planner, explore) ── */
function toggleChip(btn) { btn.classList.toggle('active'); }



/* ── Close search dropdown when clicking outside ── */
document.addEventListener('click', e => {
  if (!e.target.closest('.position-relative')) {
    const suggest = document.getElementById('searchSuggest');
    if (suggest) suggest.style.display = 'none';
  }
});

/* ══════════════════════════════════════════
   GLOBAL ON-LOAD INITIALIZATION
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

    // ── 1. Set minimum date on date inputs to today ──
    const today = new Date().toISOString().split('T')[0];
    ['itinStart', 'itinEnd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.min = today;
    });

    // ── 2. Fetch destinations from MongoDB so all pages have fresh data ──
    await loadListingsFromAPI();

    // ── 3. Global UI: Update Navigation Avatar ──
    const navBadge = document.getElementById('navInitial');
    const email = localStorage.getItem('ecoUserEmail');

    if (navBadge && email) {
        // Check local storage first for instant loading
        const savedInitials = localStorage.getItem('ecoUserInitials');
        if (savedInitials) {
            navBadge.textContent = savedInitials;
        } else {
            // Otherwise, fetch from the database
            try {
                const res = await fetch(`/api/users/profile/${email}`);
                const data = await res.json();

                if (data.success && data.data.name) {
                    const initials = data.data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                    navBadge.textContent = initials;
                    localStorage.setItem('ecoUserInitials', initials);
                }
            } catch (error) {
                console.error("Failed to load global navigation avatar:", error);
            }
        }
    }
});
