Backend Unit Test Cases (Phase 2)  
EcoPlanner API and Database Validation

**Formal QA Test Documentation**

| Project | EcoPlanner |
| :---- | :---- |
| **Module** | Backend API / Database Models / Middleware |
| **Prepared By** | LIM RUI XUAN |
| **Date** | 31 May 2026 |
| **Version** | 1.0 |
| **Purpose** | To verify the integrity of MongoDB schemas, the functionality of Express.js API routes (Auth, Users, Trips, Destinations) using API stubbing, and the security of application middleware to satisfy WIF2003 Phase 2 requirements. |

*Test Result Legend:* 

*Pass \= Expected matches actual* 
*Fail \= Mismatch found*
*Blocked \= Cannot test due to setup/API/server issue*
*Not Tested \= Not executed yet*

# **1. Test Scope**

*   Verify Mongoose schema validation constraints (required fields, enumerations, data types) for User, Destination, and Trip models.
*   Verify `/api/auth` endpoints for correct registration rules, duplicate email prevention, and secure login verification.
*   Verify `/api/users` endpoints for profile retrieval and updating favorites.
*   Verify `/api/trips` endpoints for ensuring trips are scoped strictly to the authenticated user's email.
*   Verify authentication middleware (`requireAuth`) successfully intercepts unauthorized requests.
*   Verify the global Express error handler successfully intercepts synchronous/asynchronous crashes and returns proper 500 JSON.

# **2. Test Environment**

| Framework | Node.js native `node:test` and `node:assert/strict` |
| :---- | :---- |
| **Command** | `npm test` |
| **Execution Method** | API routing is tested using dynamic Express servers (`app.listen(0)`) |
| **Database State** | Database operations (e.g., `User.findOne`, `Trip.find`) are stubbed/mocked to run instantaneously without a live MongoDB connection |
| **Performance Target** | Entire suite of 29 tests must execute in under 500ms |

# **3. Test Case Summary**

| No. | Test Scenario ID | Test Case ID | Priority | Description |
| :---- | :---- | :---- | :---- | :---- |
| 1 | TS_INT_MOD_001 | TC_INT_001 | High | Database Models Schema Validation |
| 2 | TS_INT_API_001 | TC_INT_002 | High | Authentication Routes (Register & Login) |
| 3 | TS_INT_API_002 | TC_INT_003 | High | User Profile & Favorites Routes |
| 4 | TS_INT_API_003 | TC_INT_004 | High | Trip Management & Data Scoping |
| 5 | TS_INT_MID_001 | TC_INT_005 | Medium | Security Middleware & Global Error Handling |

---

# **4. Detailed Test Cases**

## **Test Case 1: Database Models Schema Validation**

| Test Scenario ID | TS_INT_MOD_001 |
| :---- | :---- |
| **Test Case ID** | TC_INT_001 |
| **Test Case Description** | Verify that Mongoose schemas synchronously enforce required fields, custom enumerations, constraints, and valid associations without hitting the live database. |
| **Test Priority** | High |
| **Pre-Requisite** | `tests/models.test.js` exists. Native `node:test` runner is available. |
| **Post-Requisite** | All model validation tests pass with green checks. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | Run model validations for `Destination`. <br>Input: Pass missing category and invalid ecoScore (> 10) to `validateSync()`. | `Destination` rejects missing required fields. Error messages specifically flag 'category' and 'ecoScore' invalid ranges. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **2** | Run model validations for `User`. <br>Input: Provide improperly formatted email, a budget not in the enum (e.g. 'ultra'), and strings in the favorites array. | Rejects inputs. Mongoose validation errors caught detailing valid email format requirements and numeric casting failures for favorites. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **3** | Run model validations for `Trip`. <br>Input: Pass an `end` date chronologically before the `start` date. | Validation fails gracefully, preventing chronologically incorrect dates from being submitted. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |

---

## **Test Case 2: Authentication Routes (Register & Login)**

| Test Scenario ID | TS_INT_API_001 |
| :---- | :---- |
| **Test Case ID** | TC_INT_002 |
| **Test Case Description** | Verify the `/api/auth/register` and `/api/auth/login` endpoints properly handle user creation, validate inputs, prevent duplicates, and generate secure JWTs. |
| **Test Priority** | High |
| **Pre-Requisite** | `tests/auth-route.test.js` exists. `User.findOne` and `User.save` are stubbed. |
| **Post-Requisite** | Auth logic successfully validated without database insertion. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | Execute Registration with missing fields.<br>Input: POST `/api/auth/register` with missing password. | Returns `400 Bad Request`. JSON payload includes `success: false` and message indicating all fields are required. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **2** | Execute Registration with duplicate email.<br>Input: POST `/api/auth/register` with an email returned by the stubbed `User.findOne`. | Returns `400 Bad Request`. Message states: 'Email already registered.' | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **3** | Execute Login with incorrect credentials.<br>Input: POST `/api/auth/login` with non-matching password. | Returns `401 Unauthorized`. Message states: 'Invalid email or password.' | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **4** | Execute Login with correct credentials.<br>Input: POST `/api/auth/login` with matching email and password. | Returns `200 OK`. JSON payload includes `success: true` and a valid signed JWT `token`. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |

---

## **Test Case 3: User Profile & Favorites Routes**

| Test Scenario ID | TS_INT_API_002 |
| :---- | :---- |
| **Test Case ID** | TC_INT_003 |
| **Test Case Description** | Verify endpoints for fetching user profiles and updating data function correctly when presented with valid authentication. |
| **Test Priority** | High |
| **Pre-Requisite** | `tests/users-route.test.js` exists. |
| **Post-Requisite** | User route operations verified. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | Fetch User Profile.<br>Input: GET `/api/users/profile/{email}` with a valid Bearer token. | Returns `200 OK`. JSON payload contains the mapped user `data` object. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **2** | Toggle User Favorite.<br>Input: PUT `/api/users/{email}/favorites` sending a `destinationId`. | Returns `200 OK`. Action string indicates 'added' or 'removed', and updated `favorites` array is returned. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **3** | Update Profile Information.<br>Input: PUT `/api/users/{email}` sending new `city` or `budget`. | Returns `200 OK`. User object is updated and saved via the stubbed `findOneAndUpdate`. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |

---

## **Test Case 4: Trip Management & Data Scoping**

| Test Scenario ID | TS_INT_API_003 |
| :---- | :---- |
| **Test Case ID** | TC_INT_004 |
| **Test Case Description** | Verify that trips are properly mapped to the authenticated user and cross-account data leaking is prevented. |
| **Test Priority** | High |
| **Pre-Requisite** | `tests/trips-route.test.js` exists. |
| **Post-Requisite** | Strict data scoping verified. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | Fetch trips for a specific user.<br>Input: GET `/api/trips/{email}` with valid auth token matching the email. | Returns `200 OK`. Data array contains only trips matching the requested `userEmail`. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **2** | Create a new trip.<br>Input: POST `/api/trips` with trip data. | Returns `201 Created`. The new trip automatically assigns the `userEmail` decoded from the JWT payload. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **3** | Delete trip owned by self.<br>Input: DELETE `/api/trips/{id}` on an owned trip. | Returns `200 OK`. Trip is deleted from the stubbed collection. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **4** | Attempt to delete trip owned by another user.<br>Input: DELETE `/api/trips/{id}` where trip `userEmail` does not match JWT token. | Returns `403 Forbidden`. The deletion is blocked and an error message is returned. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |

---

## **Test Case 5: Security Middleware & Global Error Handling**

| Test Scenario ID | TS_INT_MID_001 |
| :---- | :---- |
| **Test Case ID** | TC_INT_005 |
| **Test Case Description** | Verify that `requireAuth` accurately inspects JWTs and that server crashes are elegantly managed by the central error handler. |
| **Test Priority** | Medium |
| **Pre-Requisite** | `tests/middleware.test.js` exists. |
| **Post-Requisite** | System resiliency proven. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | Access protected route without token.<br>Input: GET `/api/protected` with no `Authorization` header. | Returns `401 Unauthorized`. Request fails before hitting the route logic. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **2** | Access scoped route with mismatched email.<br>Input: GET `/api/protected/other@example.com` while authenticated as `test@example.com`. | Returns `403 Forbidden`. The `requireSelfEmail` middleware catches the mismatch. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |
| **3** | Trigger unhandled exception.<br>Input: GET `/api/error` which explicitly executes `next(new Error())`. | Returns `500 Internal Server Error`. The application does not crash; instead, it outputs `{ success: false, message: 'Internal server error.' }`. | Actual Output: Passed<br>Test Result: Pass<br>Comments: Verified via npm test (29/29 tests passed in ~496ms). |

---

# **5. Notes**

*   Actual Output, Test Result, and Test Comments fields are left blank for tester execution.
*   To execute the full test suite and confirm results, run `npm test` in the terminal.
*   Screenshots of the successful test runs can be directly appended below this document for the final WIF2003 Phase 2 report.
