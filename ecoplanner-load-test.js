import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const serverErrors = new Rate('server_errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const PROFILE_EMAILS = (
  __ENV.PROFILE_EMAILS ||
  [
    'alice@example.com',
    'bob@example.com',
    'cara@example.com',
  ].join(',')
)
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean);

const CITIES = [
  'Kuala Lumpur',
  'Penang',
  'Langkawi',
  'Kota Kinabalu',
  'Melaka',
  'Ipoh',
  'Cameron Highlands',
  'Taman Negara',
];

const TRIP_STYLES = ['eco', 'budget', 'nature', 'culture', 'low-carbon'];

export const options = {
  scenarios: {
    ecoplanner_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 50 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    server_errors: ['rate<0.01'],
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDateRange() {
  const start = new Date();
  start.setDate(start.getDate() + Math.floor(Math.random() * 90) + 1);

  const end = new Date(start);
  end.setDate(start.getDate() + Math.floor(Math.random() * 7) + 2);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function trackServerErrors(res) {
  serverErrors.add(res.status >= 500);
}

function getDestinations() {
  const res = http.get(`${BASE_URL}/api/destinations`, {
    tags: { endpoint: 'GET /api/destinations' },
  });

  trackServerErrors(res);

  check(res, {
    'destinations responded with 200': (r) => r.status === 200,
    'destinations response is JSON': (r) =>
      String(r.headers['Content-Type']).includes('application/json'),
  });
}

function getUserProfile() {
  const email = randomItem(PROFILE_EMAILS);
  const res = http.get(
    `${BASE_URL}/api/users/profile/${encodeURIComponent(email)}`,
    {
      tags: { endpoint: 'GET /api/users/profile/:email' },
    }
  );

  trackServerErrors(res);

  check(res, {
    'profile endpoint did not crash': (r) => r.status < 500,
  });
}

function createTrip() {
  const uniqueId = `${Date.now()}-${__VU}-${__ITER}-${Math.floor(Math.random() * 1000000)}`;
  const dates = randomDateRange();

  const payload = JSON.stringify({
    userEmail: `loadtest-${uniqueId}@ecoplanner.test`,
    name: `EcoPlanner Load Test Trip ${uniqueId}`,
    city: randomItem(CITIES),
    start: dates.start,
    end: dates.end,
    style: randomItem(TRIP_STYLES),
    days: [],
    ideaBank: [],
  });

  const res = http.post(`${BASE_URL}/api/trips`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'POST /api/trips' },
  });

  trackServerErrors(res);

  check(res, {
    'trip was created': (r) => r.status === 201,
  });
}

export default function () {
  const action = Math.random();

  if (action < 0.45) {
    getDestinations();
  } else if (action < 0.75) {
    getUserProfile();
  } else {
    createTrip();
  }

  sleep(Math.random() * 2 + 1);
}
