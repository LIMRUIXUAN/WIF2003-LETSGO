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

/* ── SHARED DATA: Eco listings ── */
const LISTINGS = [
  { id:1, name:'Bamboo Eco Resort',        location:'Cameron Highlands', cat:'hotel',      eco:9.4, price:'RM 280/night', co2:'↓34 kg CO₂',   icon:'🏕',  rating:4.9, desc:'Fully solar-powered mountain retreat with organic gardens.' },
  { id:2, name:'Green Roots Cafe',         location:'Kuala Lumpur',      cat:'restaurant', eco:8.8, price:'RM 25–60',     co2:'↓8 kg CO₂',    icon:'🍃',  rating:4.7, desc:'100% plant-based menu with zero-waste packaging.' },
  { id:3, name:'EcoBike Rentals',          location:'Penang',            cat:'transport',  eco:9.9, price:'RM 15/day',    co2:'Zero Emission', icon:'🚲',  rating:4.8, desc:'Electric bikes and traditional cycles for island exploration.' },
  { id:4, name:'Mangrove Kayak Tour',      location:'Langkawi',          cat:'activity',   eco:9.2, price:'RM 120/pax',   co2:'↓62 kg CO₂',   icon:'🚣',  rating:4.9, desc:'Guided kayak through pristine mangrove forests.' },
  { id:5, name:'Forest Canopy Lodge',      location:'Taman Negara',      cat:'hotel',      eco:9.7, price:'RM 450/night', co2:'↓55 kg CO₂',   icon:'🌲',  rating:4.9, desc:'Elevated rainforest lodge using 100% renewable energy.' },
  { id:6, name:'Vegan Street Bites',       location:'Penang',            cat:'restaurant', eco:8.5, price:'RM 8–20',      co2:'↓5 kg CO₂',    icon:'🥗',  rating:4.6, desc:'Award-winning vegan hawker stalls using local ingredients.' },
  { id:7, name:'Solar Ferry KL–Putrajaya', location:'Kuala Lumpur',      cat:'transport',  eco:9.1, price:'RM 8/trip',    co2:'↓22 kg CO₂',   icon:'⛵',  rating:4.5, desc:'Solar-powered river ferry connecting city to Putrajaya.' },
  { id:8, name:'Coral Reef Snorkeling',    location:'Tioman Island',     cat:'activity',   eco:8.9, price:'RM 85/pax',    co2:'Minimal',       icon:'🐠',  rating:4.8, desc:'Marine biologist-guided snorkeling with reef conservation pledge.' },
];

/* ── MODAL ── */
function openModal(id)  { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

/* ── TOAST NOTIFICATIONS ── */
function showToast(msg, type = 'success', options = {}) {
  const wrap  = document.getElementById('toastWrap');
  if (!wrap) return;

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

    // ── 2. Global UI: Update Navigation Avatar ──
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
