/* ═══════════════════════════════════════════════════════════
   app.js  —  Shared logic (everyone uses this)
   Nav bar helpers, modal, toast, chip toggle, global state
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── SHARED STATE ── */
let favorites   = new Set();
let itineraries = [];

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
function showToast(msg, type = 'success') {
  const wrap  = document.getElementById('toastWrap');
  if (!wrap) return;
  const t     = document.createElement('div');
  const color = type === 'warn' ? '#f39c12' : type === 'info' ? '#3498db' : 'var(--eco-green)';
  const icon  = type === 'warn' ? 'exclamation-triangle' : type === 'info' ? 'info-circle' : 'check-circle-fill';
  t.className = 'toast-notif';
  t.style.borderLeftColor = color;
  t.innerHTML = `<i class="bi bi-${icon}" style="color:${color}; font-size:1rem;"></i>${msg}`;
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ── CHIP TOGGLE (used on register, planner, explore) ── */
function toggleChip(btn) { btn.classList.toggle('active'); }

/* ── NAV INITIAL from sessionStorage ── */
(function setNavInitial() {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  const el   = document.getElementById('navInitial');
  if (el && user) {
    el.textContent = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
})();

/* ── Close search dropdown when clicking outside ── */
document.addEventListener('click', e => {
  if (!e.target.closest('.position-relative')) {
    const suggest = document.getElementById('searchSuggest');
    if (suggest) suggest.style.display = 'none';
  }
});

/* ── Set minimum date on date inputs to today ── */
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  ['itinStart', 'itinEnd'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.min = today;
  });
});
