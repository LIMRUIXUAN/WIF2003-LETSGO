/* ═══════════════════════════════════════════════════════════
   carbon.js  —  Owner: Chin Kin Hiung
   CO2 calculation math and offset suggestions
   Used by: carbon.html
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── DATA ── */
const TRANSPORT_FACTORS = { flight: 255, car: 171, train: 41, bus: 68 };
const ACCOM_FACTOR      = 21; // kg CO₂ per night (average hotel)
let selectedTransport   = { type: 'flight', factor: 255 };

/* ── FUNCTIONS ── */
function selectTransport(el, type, factor) {
  document.querySelectorAll('.transport-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedTransport = { type, factor };
  calcCarbon();
}

function calcCarbon() {
  const distInput = document.getElementById('carbonDist');
  if (!distInput) return; // Failsafe

  const dist   = parseFloat(distInput.value) || 0;
  const nights = parseInt(document.getElementById('accomNights').value) || 0;

  const travelEmit = (dist * selectedTransport.factor) / 1000;
  const accomEmit  = nights * ACCOM_FACTOR;
  const total      = Math.round(travelEmit + accomEmit);
  const trees      = Math.ceil(total / 21);

  document.getElementById('carbonTotal').textContent = total;
  document.getElementById('treesCount').textContent  = trees;

  renderComparison(dist);
  renderOffsetSuggestions(total, trees);
}

function renderComparison(dist) {
  const container = document.getElementById('comparisonBars');
  const modes = [
    { name: '✈️ Flight', type: 'flight', color: '#e74c3c' },
    { name: '🚗 Car',    type: 'car',    color: '#e67e22' },
    { name: '🚌 Bus',    type: 'bus',    color: '#f39c12' },
    { name: '🚂 Train',  type: 'train',  color: '#27ae60' },
  ];
  const max = Math.max(...modes.map(m => (dist * TRANSPORT_FACTORS[m.type]) / 1000));

  container.innerHTML = modes.map(m => {
    const val        = Math.round((dist * TRANSPORT_FACTORS[m.type]) / 1000);
    const pct        = max > 0 ? Math.round((val / max) * 100) : 0;
    const isSelected = m.type === selectedTransport.type;
    return `
      <div style="margin-bottom:.75rem;">
        <div style="display:flex; justify-content:space-between; font-size:.8rem; margin-bottom:4px;">
          <span style="font-weight:${isSelected ? '700' : '400'}">${m.name}</span>
          <span style="font-weight:600; color:${m.color}">${val} kg CO₂</span>
        </div>
        <div class="progress-eco">
          <div style="width:${pct}%; height:100%; border-radius:10px; background:${m.color}; transition:width .8s ease;"></div>
        </div>
      </div>`;
  }).join('');
}

function renderOffsetSuggestions(total, trees) {
  const credits   = Math.round(total * 0.025);
  const trainSave = Math.round(total * 0.8);

  document.getElementById('offsetSuggestions').innerHTML = `
    <div style="background:#fff; border-radius:16px; padding:1.2rem; border:1px solid #e8f0eb;">
      <strong style="font-size:.9rem; display:block; margin-bottom:.75rem;">Offset Suggestions 🌱</strong>
      <div class="offset-tip"><strong>🌳 Plant ${trees} trees</strong> — partners with Eden Reforestation Projects</div>
      <div class="offset-tip mt-2"><strong>💳 Buy RM ${credits} carbon credits</strong> — verified Gold Standard offsets</div>
      <div class="offset-tip mt-2"><strong>🚲 Switch to train/bus</strong> — saves ${trainSave} kg CO₂ vs flying</div>
      <div style="font-size:.75rem; color:#9ab3a0; margin-top:.75rem;">
        Your trip emits ${total} kg CO₂ — equivalent to planting ${trees} trees for a year to offset.
      </div>
    </div>`;
}

/* ── INITIALIZATION ── */
document.addEventListener('DOMContentLoaded', () => {
  calcCarbon();
});