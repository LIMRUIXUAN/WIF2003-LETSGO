'use strict';

const PARTIALS = [
  'partials/modals.html',
  'partials/page-landing.html',
  'partials/page-register.html',
  'partials/page-login.html',
  'partials/page-dashboard.html',
];

(async () => {
  const root = document.getElementById('app-root');
  const htmlParts = await Promise.all(
    PARTIALS.map(url => fetch(url).then(r => r.text()))
  );
  root.innerHTML = htmlParts.join('\n');

  const script = document.createElement('script');
  script.src = 'js/app.js';
  document.body.appendChild(script);
})();
