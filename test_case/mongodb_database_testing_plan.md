# MongoDB Database Testing Plan

## 1. Objective

This plan explains how to test the MongoDB database models, schema validations, and API endpoints for the EcoTravel Planner backend.

The main goal is to verify that schema constraints, validation rules, virtual/alias fields, unique indexes, and API router behaviors operate correctly without requiring a connection to a live external database or spinning up a heavy virtual database server during tests.

## 2. Scope

The database testing scope covers the following MongoDB-backed components:

| Area | Source File | Mongoose Model |
|---|---|---|
| Destination API | `routes/destinations.js` | `models/Destination.js` |
| Authentication API | `routes/auth.js` | `models/User.js` |
| User Profile API | `routes/users.js` | `models/User.js`, `models/Trip.js` |
| Trip Planner API | `routes/trips.js` | `models/Trip.js` |
| Destination Schema | `models/Destination.js` | `Destination` |
| User Schema | `models/User.js` | `User` |
| Trip Schema | `models/Trip.js` | `Trip` |

## 3. Testing Philosophy & Architecture

Rather than relying on Jest or spinning up a full MongoDB instance via `mongodb-memory-server` (which increases dependency size and slows down test suite runtimes), this project adopts a native, lightweight testing stack:

1. **Model Unit Tests**: Mongoose schema validations, enums, required fields, and index definitions are tested synchronously using Mongoose's built-in `.validateSync()` or `.validate()`. This verifies schema integrity without connecting to any database.
2. **API Integration Tests**: Express routes are tested by starting up a dynamic HTTP server listening on a random port (`app.listen(0)`), executing network requests using the standard `fetch` API, and stubbing database operations directly by overriding model methods (such as `Model.find`, `Model.findOne`, etc.).

This approach keeps test execution extremely fast (running in under 100ms) and avoids database connection errors or environment pollution.

## 4. Recommended Tools

The test suite utilizes only native Node.js libraries and the project's existing dependencies:

| Tool | Purpose |
|---|---|
| **`node:test`** | Node's built-in, highly optimized test runner (no extra test runner dependencies). |
| **`node:assert/strict`** | Node's standard strict assertion library for verifying outputs. |
| **`mongoose`** | Used to define and execute the schema validations and hooks. |
| **`fetch`** | The native global fetch API (available in Node.js 18+) to run requests against the transient testing server. |

## 5. Package Configuration

To run tests, the `package.json` includes the following script:

```json
"scripts": {
  "test": "node --test tests/*.test.js"
}
```

You can run all tests using:

```powershell
npm test
```

## 6. Test File Structure

Tests are placed inside the `tests/` directory at the project root:

```text
tests/
|-- models.test.js              # Unit tests for Mongoose models (User, Trip, Destination)
`-- destinations-route.test.js  # Integration tests for destinations API routes with stubs
```

## 7. Key Testing Patterns & Examples

### 7.1 Model Validation (No Database Connection)

Mongoose models can be validated synchronously using `validateSync()`. Any validation errors are returned immediately as an error object:

```js
const Destination = require('../models/Destination');
const assert = require('node:assert/strict');

test('Destination validates clean with proper schema inputs', () => {
  const destination = new Destination({
    id: 1,
    name: 'Rainforest Retreat',
    location: 'Taman Negara',
    category: 'hotel',
    ecoScore: 9.3,
    imageUrl: 'https://example.com/lodge.jpg'
  });

  const error = destination.validateSync();
  assert.equal(error, undefined); // No validation errors
});
```

To assert validation failure:

```js
test('Destination rejects invalid category and out-of-range ecoScore', () => {
  const destination = new Destination({
    id: 2,
    name: 'Rainforest Retreat',
    location: 'Taman Negara',
    category: 'invalid-category', // Invalid enum value
    ecoScore: 11 // Maximum is 10
  });

  const error = destination.validateSync();
  assert.ok(error.errors.category);
  assert.ok(error.errors.ecoScore);
});
```

### 7.2 API Stubbing and Dynamic Server Testing

To test endpoints without connecting to a live database, database queries are stubbed at the model level, and a transient Express server is launched dynamically.

#### Stubbing Helper Pattern:

```js
function withStubbedFind(records, callback) {
  const originalFind = Destination.find;

  // Stub Destination.find with an in-memory filter implementation
  Destination.find = (query = {}) => ({
    sort() { return this; },
    lean: async () => records.filter(record => matchesQuery(record, query))
  });

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      Destination.find = originalFind; // Restore original function after test
    });
}
```

#### Transient Server Runner Pattern:

```js
const express = require('express');
const destinationRouter = require('../routes/destinations');

async function createServer() {
  const app = express();
  app.use(express.json());
  app.use('/api/destinations', destinationRouter);

  // Bind to a random free port
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    async close() {
      await new Promise((resolve, reject) => 
        server.close(err => err ? reject(err) : resolve())
      );
    }
  };
}
```

#### Test Execution Pattern:

```js
test('GET /api/destinations returns stubbed destinations', async () => {
  const sampleData = [{ id: 1, name: 'Eco Stay', category: 'hotel' }];

  await withStubbedFind(sampleData, async () => {
    const server = await createServer();
    try {
      const response = await fetch(`${server.baseUrl}/api/destinations`);
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data[0].name, 'Eco Stay');
    } finally {
      await server.close(); // Clean up port
    }
  });
});
```

## 8. Test Cases Details

### 8.1 Model Unit Tests (`tests/models.test.js`)

| Test Target | Scenario | Validations Covered |
|---|---|---|
| **Destination** | Schema alias mapping | Verifies that virtual fields/aliases expose canonical properties (`cat` -> `category`, `eco` -> `ecoScore`, etc.). |
| **Destination** | Required & Range errors | Verifies that name cannot be empty/whitespace, category must match enums, rating/ecoScore must remain within ranges. |
| **Destination** | Geospatial rules | Verifies that if one coordinate (lat/lon) is provided, the other is also required. |
| **User** | Invalid fields | Verifies rejection of malformed email formats, budget enums, and non-numeric favorite lists. |
| **User** | Valid favorites | Verifies that integer arrays are accepted as favorite destination IDs. |
| **Trip** | Missing fields | Verifies requirement of `userEmail` and `name`. |
| **Trip** | Date sequences | Verifies that `end` date must be on or after `start` date. |
| **Trip** | Trip Day structure | Verifies that days must be formatted in standard `YYYY-MM-DD` date structures. |
| **Destination** | Database Indexes | Verifies that schema indexes are defined properly for `id` (unique), `category`, and text search on `name` & `location`. |

### 8.2 API Integration Tests (`tests/destinations-route.test.js`)

| HTTP Method | Route | Scenario | Expected Outcome |
|---|---|---|---|
| **GET** | `/api/destinations` | Request list without filters | Returns all mock destinations with correct mappings. |
| **GET** | `/api/destinations` | Request with filters (`search`, `category`, `minEco`, `maxPrice`) | Returns filtered results based on query logic. |
| **GET** | `/api/destinations/search/suggestions` | Suggestion queries | Returns matching destination names as suggestions. |

## 9. Success Criteria

A test run is considered successful when:

1. `npm test` runs all files matching `tests/*.test.js` using Node's native test runner.
2. All tests pass with zero database connection errors or warnings.
3. Stubbing utilities restore original Mongoose methods cleanly, preventing cross-test pollution.
4. Server instances are properly closed, releasing allocated ports.

## 10. Execution Commands

Run all tests:

```powershell
npm test
```

Run a specific test file:

```powershell
node --test tests/models.test.js
```
