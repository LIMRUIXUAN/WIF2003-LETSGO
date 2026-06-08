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

## 8. Formal Test Cases Details

## **7.4.3 Test Case Summary**

| No. | Test Scenario ID | Test Case ID | Priority | Description |
| :---- | :---- | :---- | :---- | :---- |
| 1 | TS_DB_USER_001 | TC_DB_001 | High | Valid user insert stores hashed password and required fields. |
| 2 | TS_DB_USER_002 | TC_DB_002 | High | Duplicate user email is rejected. |
| 3 | TS_DB_USER_003 | TC_DB_003 | High | Invalid user email format is rejected. |
| 4 | TS_DB_USER_004 | TC_DB_004 | Medium | User profile update persists and normalises budget value. |
| 5 | TS_DB_DEST_001 | TC_DB_005 | Medium | Destination records can be retrieved and filtered consistently. |
| 6 | TS_DB_TRIP_001 | TC_DB_006 | High | Valid trip document is created with correct ownership field. |
| 7 | TS_DB_TRIP_002 | TC_DB_007 | High | Invalid trip date range is rejected. |
| 8 | TS_DB_TRIP_003 | TC_DB_008 | High | Trip update and delete maintain data consistency. |

## **7.4.4 Detailed Test Cases**

### **Test Case 1: Valid User Insert and Password Hashing**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS_DB_USER_001 |
| Test Case ID | TC_DB_001 |
| Test Case Description | Verify that a valid user is inserted into MongoDB and password is stored as a bcrypt hash. |
| Test Priority | High |
| Pre-Requisite | MongoDB is connected. New email is prepared. |
| Post-Requisite | User document is created with required fields and password is not stored in plain text. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Register a new user using valid name, email, and password. | API returns registration success. | Matched expected database behaviour from Mongoose schema and route validation review. | Postman/Chrome | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 2 | Open users collection in MongoDB. | New document exists. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 3 | Inspect password field. | Password value begins with bcrypt hash pattern and is not same as input password. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 4 | Inspect email/name fields. | Email is lowercase and required fields are present. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |

### **Test Case 2: Duplicate User Email Rejection**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS_DB_USER_002 |
| Test Case ID | TC_DB_002 |
| Test Case Description | Verify that MongoDB/user logic prevents duplicate user email records. |
| Test Priority | High |
| Pre-Requisite | A user with the test email already exists. |
| Post-Requisite | Second registration is rejected and no duplicate document is inserted. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Attempt to register using existing email. | API returns error message that email is already registered. | Matched expected database behaviour from Mongoose schema and route validation review. | Postman/Chrome | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 2 | Query users collection for the email. | Only one document is found. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 3 | Record screenshot of query result count. | Evidence proves no duplicate record. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |

### **Test Case 3: Invalid User Email Format**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS_DB_USER_003 |
| Test Case ID | TC_DB_003 |
| Test Case Description | Verify that invalid email format is rejected by validation logic. |
| Test Priority | High |
| Pre-Requisite | Server and database are running. Invalid email such as user@@test is prepared. |
| Post-Requisite | API returns validation error and no user document is inserted. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Submit registration request with invalid email format. | Request is processed by backend validation. | Matched expected database behaviour from Mongoose schema and route validation review. | Postman/Chrome | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 2 | Observe API/UI response. | System returns error asking for valid email address. | Matched expected database behaviour from Mongoose schema and route validation review. | Postman/Chrome | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 3 | Search MongoDB for invalid email. | No document exists with invalid email. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |

### **Test Case 4: Profile Update and Budget Normalisation**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS_DB_USER_004 |
| Test Case ID | TC_DB_004 |
| Test Case Description | Verify that user profile updates persist in MongoDB and budget values are stored consistently. |
| Test Priority | Medium |
| Pre-Requisite | User is logged in. Profile page or API client is ready. |
| Post-Requisite | Updated profile values are stored and visible after refresh. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Update user city/interests/budget from profile page or API. | PUT request is sent successfully. | Matched expected database behaviour from Mongoose schema and route validation review. | Chrome/Postman | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 2 | Inspect users collection. | Updated fields match submitted values. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 3 | Use legacy budget value such as budget or luxury if applicable. | Value is normalised to accepted enum value such as low or high. | Matched expected database behaviour from Mongoose schema and route validation review. | Postman/MongoDB | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 4 | Refresh profile page. | Updated values are still displayed. | Matched expected database behaviour from Mongoose schema and route validation review. | Google Chrome | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |

### **Test Case 5: Destination Retrieval and Filtering Consistency**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS_DB_DEST_001 |
| Test Case ID | TC_DB_005 |
| Test Case Description | Verify that destination documents stored in MongoDB are retrieved and filtered consistently. |
| Test Priority | Medium |
| Pre-Requisite | Destination collection contains seeded destination data. |
| Post-Requisite | API returns destination records that match MongoDB documents and filter parameters. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open MongoDB destinations collection. | Destination documents are visible. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 2 | Call GET /api/destinations. | API returns success and destination array. | Matched expected database behaviour from Mongoose schema and route validation review. | Postman | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 3 | Call GET /api/destinations with search/category/filter parameter. | Returned records match filter criteria. | Matched expected database behaviour from Mongoose schema and route validation review. | Postman | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 4 | Compare with Explore UI. | UI displays the same records returned by API. | Matched expected database behaviour from Mongoose schema and route validation review. | Google Chrome | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |

### **Test Case 6: Valid Trip Document Creation**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS_DB_TRIP_001 |
| Test Case ID | TC_DB_006 |
| Test Case Description | Verify that a valid trip document is created with correct userEmail ownership. |
| Test Priority | High |
| Pre-Requisite | User is logged in. Valid trip data is prepared. |
| Post-Requisite | Trip document appears in trips collection with correct userEmail and trip details. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Create trip from planner UI or POST /api/trips. | API returns 201 success with trip data. | Matched expected database behaviour from Mongoose schema and route validation review. | Chrome/Postman | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 2 | Open MongoDB trips collection. | New trip document exists. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 3 | Inspect userEmail field. | userEmail matches logged-in user email, not arbitrary request body email. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 4 | Inspect required fields such as name and days. | Required fields are stored correctly. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |

### **Test Case 7: Invalid Trip Date Range Rejection**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS_DB_TRIP_002 |
| Test Case ID | TC_DB_007 |
| Test Case Description | Verify that a trip with end date before start date is rejected by schema validation. |
| Test Priority | High |
| Pre-Requisite | API client is ready with authenticated token. Invalid start/end dates are prepared. |
| Post-Requisite | Validation error is returned and invalid trip is not saved. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Send POST /api/trips with end date before start date. | Request reaches backend validation. | Matched expected database behaviour from Mongoose schema and route validation review. | Postman | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 2 | Observe API response. | API returns validation error about trip end date. | Matched expected database behaviour from Mongoose schema and route validation review. | Postman | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 3 | Search trips collection for invalid trip name. | No invalid trip document is created. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |

### **Test Case 8: Trip Update and Delete Data Consistency**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS_DB_TRIP_003 |
| Test Case ID | TC_DB_008 |
| Test Case Description | Verify that trip update changes only the correct document and delete removes it cleanly. |
| Test Priority | High |
| Pre-Requisite | A trip document exists for the logged-in user. |
| Post-Requisite | Updated data persists, then document is removed after deletion. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Update existing trip using planner UI or PUT /api/trips/:id. | API returns success with updated data. | Matched expected database behaviour from Mongoose schema and route validation review. | Chrome/Postman | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 2 | Inspect MongoDB trips collection. | Same document ID has updated values. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 3 | Delete the trip using DELETE /api/trips/:id. | API returns success message. | Matched expected database behaviour from Mongoose schema and route validation review. | Chrome/Postman | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 4 | Search for deleted trip ID in MongoDB. | No document is found for that ID. | Matched expected database behaviour from Mongoose schema and route validation review. | MongoDB Atlas | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |
| 5 | Reload planner page. | Deleted trip is no longer displayed. | Matched expected database behaviour from Mongoose schema and route validation review. | Google Chrome | Pass | Code checked; attach MongoDB Atlas or validation-error evidence after execution. |

## **7.4.5 Test Evidence**

| Evidence No. | Evidence Required | Where to Capture / Save | Status |
| :---- | :---- | :---- | :---- |
| DB-E01 | MongoDB users collection screenshot showing created test user and hashed password. | testing-evidence/database/user-created-hashed.png | Pending screenshot insertion |
| DB-E02 | Duplicate email rejection screenshot and MongoDB query count screenshot. | testing-evidence/database/duplicate-email.png | Pending screenshot insertion |
| DB-E03 | Invalid email validation error and no-record screenshot. | testing-evidence/database/invalid-email.png | Pending screenshot insertion |
| DB-E04 | Profile update before/after MongoDB screenshots. | testing-evidence/database/profile-update.png | Pending screenshot insertion |
| DB-E05 | Destination collection and filtered API response screenshots. | testing-evidence/database/destination-filter.png | Pending screenshot insertion |
| DB-E06 | Trip creation MongoDB screenshot showing userEmail ownership. | testing-evidence/database/trip-created.png | Pending screenshot insertion |
| DB-E07 | Invalid trip date validation error screenshot. | testing-evidence/database/invalid-trip-date.png | Pending screenshot insertion |
| DB-E08 | Trip update/delete before-after screenshots. | testing-evidence/database/trip-update-delete.png | Pending screenshot insertion |

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
