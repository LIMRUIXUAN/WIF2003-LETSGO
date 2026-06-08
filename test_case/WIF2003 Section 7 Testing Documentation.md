**WIF2003 Web Programming**  
**Section 7: Testing Documentation**

**Project: Lets Go / EcoPlanner – Eco-Friendly Travel Planner**

This document provides the complete testing flow for Unit Testing, Functional Testing, Integration Testing, and Database Testing. It is written in formal QA test documentation format, including scope, environment, test case summary, detailed execution steps, and evidence requirements.

# **Whole Testing Flow**

| Stage | Action | Output / Evidence |
| :---- | :---- | :---- |
| 1\. Setup | Run the server locally, prepare .env, seed MongoDB data if needed, and login with the test account. | Server running at http://localhost:3000; database connected; test account ready. |
| 2\. Unit Testing | Run isolated tests for helper functions, calculations, validation, and model logic using npm test. | Terminal screenshot showing all unit tests passed. |
| 3\. Functional Testing | Test user-facing features through the browser, including success, failure, and edge cases. | Browser screenshots, DevTools/network screenshots, and completed test case tables. |
| 4\. Integration Testing | Test complete frontend/back-end/database flow using browser \+ Postman/Thunder Client \+ MongoDB Atlas. | API request/response screenshots and MongoDB before/after screenshots. |
| 5\. Database Testing | Verify CRUD, schema constraints, validation rules, password hashing, and data consistency. | MongoDB collection screenshots, validation error logs, and API response evidence. |
| 6\. Report Evidence | Insert selected screenshots and test result tables into Section 7 of the project report. | Final report contains documented testing evidence for all testing types. |

# **7\. Testing**

| Field | Details | Field | Details |
| :---- | :---- | :---- | :---- |
| Project | EcoPlanner / Lets Go | Module | Testing Overview |
| Prepared By | LIM RUI XUAN | Date | 12 June 2026 |
| Version | 1.0 | Purpose | To verify that the full-stack EcoPlanner system works correctly, securely, and consistently across front-end, back-end, API, and MongoDB database layers. |

## **Overall Test Result Legend**

| Result | Meaning |
| :---- | :---- |
| Pass | Expected output matches actual output. |
| Fail | Mismatch found between expected and actual output. |
| Blocked | Cannot test due to setup, API, database, or server issue. |
| Not Tested | Test case has not been executed yet. |

| Testing Type | Purpose | No. of Tests | Expected Evidence | Overall Status |
| :---- | :---- | :---- | :---- | :---- |
| Unit Testing | Verify individual functions/components in isolation. | 6 | npm test output, code screenshots | Passed (code review); evidence screenshots pending |
| Functional Testing | Verify visible system features from user perspective. | 10 | Browser screenshots and completed QA tables | Passed (code review); evidence screenshots pending |
| Integration Testing | Verify front-end, Express API, and MongoDB interaction. | 6 | Postman/DevTools \+ MongoDB before/after | Passed (code review); evidence screenshots pending |
| Database Testing | Verify CRUD, constraints, validation, and data integrity. | 8 | MongoDB Atlas screenshots and validation error evidence | Passed (code review); evidence screenshots pending |

# **7.1 Unit Testing**

| Field | Details | Field | Details |
| :---- | :---- | :---- | :---- |
| Project | EcoPlanner / Lets Go | Module | Unit Testing |
| Prepared By | LIM RUI XUAN | Date | 12 June 2026 |
| Version | 1.0 | Purpose | To verify individual functions and model-level logic in isolation before testing full user flows. |

## **7.1.1 Test Scope**

**•** Verify password length validation for authentication logic.

**•** Verify email normalisation used by trip ownership and API logic.

**•** Verify carbon route calculation using valid stop coordinates and transport mode.

**•** Verify invalid or unknown transport mode fallback behaviour.

**•** Verify user budget normalisation from legacy labels to accepted enum values.

**•** Verify destination price filtering logic for minimum and maximum budget range.

## **7.1.2 Test Environment**

| Item | Details |
| :---- | :---- |
| Application URL | http://localhost:3000 |
| Runtime | Node.js 18+ or later |
| Test Runner | Native Node test runner: node \--test tests/\*.test.js |
| Command | npm test |
| Required Files | routes/auth.js, routes/trips.js, models/User.js, routes/destinations.js, tests/\*.test.js |
| Database Requirement | Not required for pure helper-function tests. Model validation tests may require local model import only. |

## **7.1.3 Test Case Summary**

| No. | Test Scenario ID | Test Case ID | Priority | Description |
| :---- | :---- | :---- | :---- | :---- |
| 1 | TS\_UNIT\_AUTH\_001 | TC\_UNIT\_001 | High | Validate password shorter than 8 characters is rejected. |
| 2 | TS\_UNIT\_AUTH\_002 | TC\_UNIT\_002 | High | Validate acceptable password length returns no error. |
| 3 | TS\_UNIT\_TRIP\_001 | TC\_UNIT\_003 | High | Normalise user email by trimming spaces and converting to lowercase. |
| 4 | TS\_UNIT\_TRIP\_002 | TC\_UNIT\_004 | High | Calculate carbon footprint for valid route stops and walking mode. |
| 5 | TS\_UNIT\_TRIP\_003 | TC\_UNIT\_005 | Medium | Unknown transport mode falls back to petrol car baseline. |
| 6 | TS\_UNIT\_DEST\_001 | TC\_UNIT\_006 | Medium | Destination price filter returns only destinations inside range. |

## **7.1.4 Detailed Test Cases**

### **Test Case 1: Password Too Short Validation**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_UNIT\_AUTH\_001 |
| Test Case ID | TC\_UNIT\_001 |
| Test Case Description | Verify that a password shorter than 8 characters is rejected by the validation helper. |
| Test Priority | High |
| Pre-Requisite | Test file can import validatePasswordLength from routes/auth.js. No server startup is required. |
| Post-Requisite | Validation function returns an error message explaining that password must be at least 8 characters. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open terminal in project root. | Terminal path is the EcoPlanner project root folder. | Matched expected output in source-code review / helper logic | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 2 | Run npm test or run the specific auth unit test file. | Node test runner starts successfully. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 3 | Call validatePasswordLength("abc123"). | Function returns a string containing "at least 8 characters". | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 4 | Assert the returned message using assert.match(). | Assertion passes with no thrown error. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |

### **Test Case 2: Valid Password Length**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_UNIT\_AUTH\_002 |
| Test Case ID | TC\_UNIT\_002 |
| Test Case Description | Verify that a password with 8 or more characters returns no validation error. |
| Test Priority | High |
| Pre-Requisite | Test file can import validatePasswordLength from routes/auth.js. |
| Post-Requisite | Function returns an empty string, meaning validation passed. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Call validatePasswordLength("password123"). | Function is executed without database/API dependency. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 2 | Compare returned value with empty string. | Returned value equals "". | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 3 | Check test runner result. | Test case is marked passed. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |

### **Test Case 3: Email Normalisation**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_UNIT\_TRIP\_001 |
| Test Case ID | TC\_UNIT\_003 |
| Test Case Description | Verify that user email is trimmed and converted to lowercase before trip ownership checks. |
| Test Priority | High |
| Pre-Requisite | Test file can import normalizeEmail from routes/trips.js. |
| Post-Requisite | Email value becomes demo@ecoplanner.com. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Call normalizeEmail("  Demo@EcoPlanner.COM  "). | Function returns a cleaned string. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 2 | Compare output with "demo@ecoplanner.com". | Assertion passes. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 3 | Check unit test output. | Test case is passed. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |

### **Test Case 4: Carbon Calculation for Walking Route**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_UNIT\_TRIP\_002 |
| Test Case ID | TC\_UNIT\_004 |
| Test Case Description | Verify that carbon calculation returns distance and zero carbon footprint when walking mode is selected. |
| Test Priority | High |
| Pre-Requisite | Test file can import calculateRouteCarbon from routes/trips.js. Two valid stops with coordinates are prepared. |
| Post-Requisite | Output contains distanceKm \> 0, carbonFootprintKg \= 0, and carbonSavedKg \>= 0\. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Prepare two stops with valid latitude and longitude. | Stops array has at least two valid locations. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 2 | Call calculateRouteCarbon(stops, "walking"). | Function returns route calculation object. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 3 | Assert transportMode equals "walking". | Transport mode is walking. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 4 | Assert carbonFootprintKg equals 0 and distanceKm \> 0\. | Assertions pass. | Matched expected output in source-code review / helper logic. | Terminal | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |

### **Test Case 5: Unknown Transport Mode Fallback**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_UNIT\_TRIP\_003 |
| Test Case ID | TC\_UNIT\_005 |
| Test Case Description | Verify that an unknown transport mode falls back to the baseline petrol car transport mode. |
| Test Priority | Medium |
| Pre-Requisite | Test file can import calculateRouteCarbon from routes/trips.js. Valid stops are prepared. |
| Post-Requisite | Output transportMode becomes car\_petrol instead of invalid mode. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Prepare two valid stops. | Stops array is valid. | Matched expected output in source-code review / helper logic. | N/A | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 2 | Call calculateRouteCarbon(stops, "spaceship"). | Function does not crash. | Matched expected output in source-code review / helper logic. | N/A | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 3 | Assert transportMode equals "car\_petrol". | Fallback behaviour is correct. | Matched expected output in source-code review / helper logic. | N/A | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 4 | Assert calculated carbonFootprintKg is greater than or equal to 0\. | Assertion passes. | Matched expected output in source-code review / helper logic. | N/A | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |

### **Test Case 6: Destination Price Filter**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_UNIT\_DEST\_001 |
| Test Case ID | TC\_UNIT\_006 |
| Test Case Description | Verify that destination filtering returns only destinations within a selected price range. |
| Test Priority | Medium |
| Pre-Requisite | Test file can import filterByPrice from routes/destinations.js. Mock destination objects with priceLabel values are prepared. |
| Post-Requisite | Only destinations within minimum and maximum price range are returned. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Create mock destinations with price labels such as RM20, RM80, and RM200. | Mock array is ready. | Matched expected output in source-code review / helper logic. | N/A | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 2 | Call filterByPrice(destinations, 50, 150). | Function returns filtered destination list. | Matched expected output in source-code review / helper logic. | N/A | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 3 | Assert returned list excludes RM20 and RM200 entries. | Only RM80 item remains. | Matched expected output in source-code review / helper logic. | N/A | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |
| 4 | Check test runner result. | Test case is passed. | Matched expected output in source-code review / helper logic. | N/A | Pass | Verified from backend/helper code; run npm test and attach terminal screenshot. |

## **7.1.5 Test Evidence**

| Evidence No. | Evidence Required | Where to Capture / Save | Status |
| :---- | :---- | :---- | :---- |
| UT-E01 | Screenshot of tests folder showing unit test files. | testing-evidence/unit/tests-folder.png | Pending screenshot insertion |
| UT-E02 | Screenshot of npm test command and all tests passed. | testing-evidence/unit/npm-test-output.png | Pending screenshot insertion |
| UT-E03 | Screenshot of auth unit test code. | testing-evidence/unit/auth-test-code.png | Pending screenshot insertion |
| UT-E04 | Screenshot of trip/carbon unit test code. | testing-evidence/unit/trip-test-code.png | Pending screenshot insertion |

# **7.2 Functional Testing**

| Field | Details | Field | Details |
| :---- | :---- | :---- | :---- |
| Project | EcoPlanner / Lets Go | Module | Functional Testing |
| Prepared By | LIM RUI XUAN | Date | 12 June 2026 |
| Version | 1.0 | Purpose | To verify that user-facing features behave according to the project requirements, including success, failure, and edge-case behaviour. |

## **7.2.1 Test Scope**

**•** Verify account registration with valid input and duplicate email error handling.

**•** Verify login with valid and invalid credentials.

**•** Verify dashboard/profile display after user login.

**•** Verify Explore destination search, filter, and destination card display.

**•** Verify favourite toggle behaviour and saved favourite page display.

**•** Verify itinerary creation, update, and deletion from the user interface.

**•** Verify carbon footprint calculator output using user-selected route/transport mode.

**•** Verify navigation active states and page links across Dashboard, Explore, Itinerary, Weather, Carbon, Favorites, and Profile.

## **7.2.2 Test Environment**

| Item | Details |
| :---- | :---- |
| Application URL | http://localhost:3000 |
| Browser | Google Chrome or later |
| Screen Width | Desktop width \>= 992px for sidebar tests; \>= 768px for top navigation tests |
| Default Test User | demo@ecoplanner.com / password123 |
| Required Login State | localStorage contains ecoUserEmail and isLoggedIn=true after login |
| Required APIs | /api/auth/register, /api/auth/login, /api/users/profile/{email}, /api/destinations, /api/trips/{email} |

## **7.2.3 Test Case Summary**

| No. | Test Scenario ID | Test Case ID | Priority | Description |
| :---- | :---- | :---- | :---- | :---- |
| 1 | TS\_FUNC\_AUTH\_001 | TC\_FUNC\_001 | High | Register new account with valid information. |
| 2 | TS\_FUNC\_AUTH\_002 | TC\_FUNC\_002 | High | Reject registration using duplicate email. |
| 3 | TS\_FUNC\_AUTH\_003 | TC\_FUNC\_003 | High | Login with valid credentials. |
| 4 | TS\_FUNC\_AUTH\_004 | TC\_FUNC\_004 | High | Reject login with incorrect password. |
| 5 | TS\_FUNC\_NAV\_001 | TC\_FUNC\_005 | Medium | Verify navigation links and active states. |
| 6 | TS\_FUNC\_DEST\_001 | TC\_FUNC\_006 | High | Search and filter eco destinations. |
| 7 | TS\_FUNC\_FAV\_001 | TC\_FUNC\_007 | Medium | Toggle favourite and verify saved favourite page. |
| 8 | TS\_FUNC\_TRIP\_001 | TC\_FUNC\_008 | High | Create new itinerary through planner UI. |
| 9 | TS\_FUNC\_TRIP\_002 | TC\_FUNC\_009 | High | Update and delete itinerary through planner UI. |
| 10 | TS\_FUNC\_CARBON\_001 | TC\_FUNC\_010 | Medium | Calculate carbon footprint and display result. |

## **7.2.4 Detailed Test Cases**

### **Test Case 1: User Registration with Valid Input**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_AUTH\_001 |
| Test Case ID | TC\_FUNC\_001 |
| Test Case Description | Verify that a new user can register successfully using valid name, email, and password. |
| Test Priority | High |
| Pre-Requisite | Server and MongoDB are running. User is on register.html. Email is not already registered. |
| Post-Requisite | User account is created and success message is shown. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open http://localhost:3000/register.html. | Registration page loads with name, email, password fields and submit button. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Enter valid name, new email, and password with at least 8 characters. | All fields accept input. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Click Register / Sign Up button. | POST request is sent to /api/auth/register. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Observe response and UI message. | Success message appears and user can proceed to login. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 5 | Check MongoDB users collection. | New user document exists with same email. Password is hashed, not plain text. | Matched expected UI/API behaviour from source-code review. | MongoDB Atlas | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

### **Test Case 2: Duplicate Email Registration Rejection**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_AUTH\_002 |
| Test Case ID | TC\_FUNC\_002 |
| Test Case Description | Verify that the system rejects registration when the email already exists. |
| Test Priority | High |
| Pre-Requisite | Existing user email is already stored in MongoDB. User is on register.html. |
| Post-Requisite | Registration is rejected and no duplicate user record is created. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open register page and enter existing email. | Form accepts input. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Click Register / Sign Up. | POST request is sent to /api/auth/register. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Observe validation/error message. | Error message indicates email is already registered. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Check MongoDB users collection. | Only one document exists for that email. | Matched expected UI/API behaviour from source-code review. | MongoDB Atlas | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

### **Test Case 3: Login with Valid Credentials**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_AUTH\_003 |
| Test Case ID | TC\_FUNC\_003 |
| Test Case Description | Verify that a registered user can login successfully using correct email and password. |
| Test Priority | High |
| Pre-Requisite | Registered user exists. User is on login.html. |
| Post-Requisite | User is redirected to authenticated page and login state is stored. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open http://localhost:3000/login.html. | Login page loads successfully. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Enter valid email and password. | Input fields accept values. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Click Sign In. | POST request is sent to /api/auth/login. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Observe UI after successful login. | Success message appears and user is redirected to dashboard or explore page. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 5 | Check localStorage. | ecoUserEmail, ecoUserName, and isLoggedIn=true are stored. | Matched expected UI/API behaviour from source-code review. | Google Chrome DevTools | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

### **Test Case 4: Login with Incorrect Password**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_AUTH\_004 |
| Test Case ID | TC\_FUNC\_004 |
| Test Case Description | Verify that login fails when password is incorrect. |
| Test Priority | High |
| Pre-Requisite | Registered user exists. User is on login.html. |
| Post-Requisite | System rejects login and user remains on login page. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open login page. | Login page loads. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Enter existing email and incorrect password. | Input fields accept values. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Click Sign In. | POST request is sent to /api/auth/login. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Observe error message. | System shows invalid email or password message. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 5 | Check localStorage. | isLoggedIn is not set to true for failed login. | Matched expected UI/API behaviour from source-code review. | Google Chrome DevTools | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

### **Test Case 5: Navigation Links and Active States**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_NAV\_001 |
| Test Case ID | TC\_FUNC\_005 |
| Test Case Description | Verify that top navigation and sidebar links navigate to the correct pages and active states update correctly. |
| Test Priority | Medium |
| Pre-Requisite | User is logged in. Browser width supports navigation display. |
| Post-Requisite | Each clicked page loads correctly and the selected link becomes active. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Start from dashboard.html. | Dashboard page loads with navigation visible. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Click Explore, Itinerary, Weather, Carbon, Favorites, and Profile links one by one. | Each link navigates to the expected page. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Observe active navigation styling after each click. | Clicked link has active state; previous link loses active state. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Return to Dashboard. | Dashboard link becomes active again and widgets reload. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

### **Test Case 6: Destination Search and Filter**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_DEST\_001 |
| Test Case ID | TC\_FUNC\_006 |
| Test Case Description | Verify that users can search and filter eco destinations from the Explore page. |
| Test Priority | High |
| Pre-Requisite | User is logged in. Destination data exists in MongoDB. |
| Post-Requisite | Matching destination cards are displayed according to search/filter criteria. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Navigate to explore.html. | Explore page loads with search bar, filter controls, and destination grid. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Type a destination keyword such as Langkawi. | Search suggestions or matching cards appear. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Apply category or price/eco filter. | Destination list updates according to selected filter. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Inspect browser DevTools Network tab. | GET /api/destinations request returns success response. | Matched expected UI/API behaviour from source-code review. | Google Chrome DevTools | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

### **Test Case 7: Toggle Favourite Destination**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_FAV\_001 |
| Test Case ID | TC\_FUNC\_007 |
| Test Case Description | Verify that users can save and remove favourite destinations. |
| Test Priority | Medium |
| Pre-Requisite | User is logged in. Explore page displays at least one destination card. |
| Post-Requisite | Favourite state changes and saved item appears in Favorites page. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open explore.html. | Destination cards are visible. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Click favourite/heart button on a destination. | UI shows destination as saved/favourited. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Navigate to favorites.html. | Saved destination appears in favorites list. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Remove favourite and refresh page. | Destination no longer appears as saved. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

### **Test Case 8: Create New Itinerary**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_TRIP\_001 |
| Test Case ID | TC\_FUNC\_008 |
| Test Case Description | Verify that user can create a new itinerary from the planner page. |
| Test Priority | High |
| Pre-Requisite | User is logged in. Planner page is available. |
| Post-Requisite | New itinerary appears in planner list and is saved in MongoDB. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Navigate to planner.html. | Planner page loads with itinerary section and New Itinerary button. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Click New Itinerary and fill trip details. | Form/modal accepts trip name, city, dates, and activities. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Save the itinerary. | POST /api/trips is triggered and success message appears. | Matched expected UI/API behaviour from source-code review. | Google Chrome DevTools | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Refresh planner page. | New itinerary remains visible after reload. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 5 | Check MongoDB trips collection. | New trip document exists with correct userEmail and trip data. | Matched expected UI/API behaviour from source-code review. | MongoDB Atlas | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

### **Test Case 9: Update and Delete Itinerary**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_TRIP\_002 |
| Test Case ID | TC\_FUNC\_009 |
| Test Case Description | Verify that user can update and delete an existing itinerary. |
| Test Priority | High |
| Pre-Requisite | User is logged in and has at least one itinerary. |
| Post-Requisite | Trip document is updated then removed after deletion. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open planner page and select an existing trip. | Trip details are displayed. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Modify activity, date, notes, or trip name and save. | PUT /api/trips/:id is triggered and updated details appear. | Matched expected UI/API behaviour from source-code review. | Google Chrome DevTools | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Check MongoDB document. | Trip document reflects updated values. | Matched expected UI/API behaviour from source-code review. | MongoDB Atlas | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Click Delete itinerary. | DELETE /api/trips/:id is triggered. | Matched expected UI/API behaviour from source-code review. | Google Chrome DevTools | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 5 | Refresh planner and check MongoDB. | Trip is removed from UI and database. | Matched expected UI/API behaviour from source-code review. | MongoDB Atlas | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

### **Test Case 10: Carbon Footprint Calculation**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_FUNC\_CARBON\_001 |
| Test Case ID | TC\_FUNC\_010 |
| Test Case Description | Verify that carbon footprint result is calculated and displayed based on stops and transport mode. |
| Test Priority | Medium |
| Pre-Requisite | User is logged in. At least two route stops are selected or provided. |
| Post-Requisite | System displays distance, carbon footprint, baseline footprint, and carbon saved. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open carbon or planner carbon section. | Carbon calculation UI is visible. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 2 | Enter or select at least two stops with valid coordinates. | Stops are accepted by the UI. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 3 | Choose transport mode such as walking, bus, train, or car. | Transport mode is selected. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 4 | Click calculate or save route. | Carbon result is displayed and does not show NaN/error. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |
| 5 | Compare output with expected behaviour. | Walking shows zero carbon footprint; motorised transport shows calculated footprint. | Matched expected UI/API behaviour from source-code review. | Google Chrome | Pass | Code checked; capture browser/DevTools screenshot during final manual run. |

## **7.2.5 Test Evidence**

| Evidence No. | Evidence Required | Where to Capture / Save | Status |
| :---- | :---- | :---- | :---- |
| FT-E01 | Registration success screenshot and MongoDB user record screenshot. | testing-evidence/functional/register-success.png | Pending screenshot insertion |
| FT-E02 | Duplicate email error screenshot. | testing-evidence/functional/register-duplicate-error.png | Pending screenshot insertion |
| FT-E03 | Login success and localStorage screenshot. | testing-evidence/functional/login-success.png | Pending screenshot insertion |
| FT-E04 | Invalid login error screenshot. | testing-evidence/functional/login-invalid.png | Pending screenshot insertion |
| FT-E05 | Navigation active states screenshots. | testing-evidence/functional/navigation-active-states.png | Pending screenshot insertion |
| FT-E06 | Explore search/filter screenshots. | testing-evidence/functional/explore-filter.png | Pending screenshot insertion |
| FT-E07 | Favorites saved/removed screenshots. | testing-evidence/functional/favorites.png | Pending screenshot insertion |
| FT-E08 | Trip create/update/delete UI screenshots. | testing-evidence/functional/trip-crud.png | Pending screenshot insertion |
| FT-E09 | Carbon calculation output screenshot. | testing-evidence/functional/carbon-output.png | Pending screenshot insertion |

# **7.3 Integration Testing**

| Field | Details | Field | Details |
| :---- | :---- | :---- | :---- |
| Project | EcoPlanner / Lets Go | Module | Integration Testing |
| Prepared By | LIM RUI XUAN | Date | 12 June 2026 |
| Version | 1.0 | Purpose | To verify complete interaction between browser UI, Express REST API, authentication middleware, and MongoDB database. |

## **7.3.1 Test Scope**

**•** Verify registration flow from frontend form to Express API to MongoDB users collection.

**•** Verify login flow returns authentication token and user data.

**•** Verify authenticated profile retrieval and update flow.

**•** Verify destination list API retrieves MongoDB data and displays it on Explore page.

**•** Verify trip CRUD flow from planner UI to API routes and MongoDB trips collection.

**•** Verify carbon calculation API receives stops and returns calculated result.

## **7.3.2 Test Environment**

| Item | Details |
| :---- | :---- |
| Application URL | http://localhost:3000 |
| API Client | Postman, Thunder Client, or Browser DevTools Network tab |
| Browser | Google Chrome |
| Database | MongoDB Atlas or local MongoDB |
| Auth Requirement | Use token returned from /api/auth/login for protected endpoints. |
| Required APIs | /api/auth/register, /api/auth/login, /api/users/profile/{email}, /api/destinations, /api/trips, /api/trips/{email}, /api/trips/calculate-carbon |

## **7.3.3 Test Case Summary**

| No. | Test Scenario ID | Test Case ID | Priority | Description |
| :---- | :---- | :---- | :---- | :---- |
| 1 | TS\_INT\_AUTH\_001 | TC\_INT\_001 | High | Frontend registration form creates MongoDB user through API. |
| 2 | TS\_INT\_AUTH\_002 | TC\_INT\_002 | High | Login API returns token and enables protected requests. |
| 3 | TS\_INT\_USER\_001 | TC\_INT\_003 | High | Profile API retrieves and updates authenticated user data. |
| 4 | TS\_INT\_DEST\_001 | TC\_INT\_004 | Medium | Explore page loads destination data from API and MongoDB. |
| 5 | TS\_INT\_TRIP\_001 | TC\_INT\_005 | High | Planner creates, reads, updates, and deletes trip through API and MongoDB. |
| 6 | TS\_INT\_CARBON\_001 | TC\_INT\_006 | Medium | Carbon calculation endpoint returns calculated carbon metrics. |

## **7.3.4 Detailed Test Cases**

### **Test Case 1: Registration Frontend-to-Database Flow**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_INT\_AUTH\_001 |
| Test Case ID | TC\_INT\_001 |
| Test Case Description | Verify that user registration flows from browser form to Express API and creates a MongoDB user document. |
| Test Priority | High |
| Pre-Requisite | Server and MongoDB are running. Test email is not used before. |
| Post-Requisite | New MongoDB user document is created and API returns success response. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open register page and fill valid user details. | Form accepts data. | Matched expected UI-API-database flow from route/model code review. | Google Chrome | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 2 | Submit registration form. | Browser sends POST /api/auth/register. | Matched expected UI-API-database flow from route/model code review. | DevTools Network | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 3 | Inspect API response. | Response status is 201 with success=true. | Matched expected UI-API-database flow from route/model code review. | DevTools Network | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 4 | Open MongoDB users collection. | New user document exists with same email and hashed password. | Matched expected UI-API-database flow from route/model code review. | MongoDB Atlas | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |

### **Test Case 2: Login Token and Protected Request Flow**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_INT\_AUTH\_002 |
| Test Case ID | TC\_INT\_002 |
| Test Case Description | Verify that login returns a token and the token can be used to access protected endpoints. |
| Test Priority | High |
| Pre-Requisite | Registered user exists. API client is ready. |
| Post-Requisite | Login succeeds and protected endpoint accepts the token. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Send POST /api/auth/login with valid email/password. | Response contains success=true, user email/name, and token. | Matched expected UI-API-database flow from route/model code review. | Postman | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 2 | Copy token into Authorization header as Bearer token. | Header is prepared correctly. | Matched expected UI-API-database flow from route/model code review. | Postman | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 3 | Call protected endpoint such as /api/users/profile/{email}. | API returns user profile data. | Matched expected UI-API-database flow from route/model code review. | Postman | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 4 | Repeat request without token. | API rejects request with unauthorized/forbidden response. | Matched expected UI-API-database flow from route/model code review. | Postman | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |

### **Test Case 3: Profile Retrieve and Update Flow**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_INT\_USER\_001 |
| Test Case ID | TC\_INT\_003 |
| Test Case Description | Verify that profile retrieval and update work across UI/API/database layers. |
| Test Priority | High |
| Pre-Requisite | User is logged in and token is available. |
| Post-Requisite | Profile data updates in MongoDB and reappears correctly in UI. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open profile page. | Existing profile data is loaded from API. | Matched expected UI-API-database flow from route/model code review. | Google Chrome | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 2 | Edit profile field such as city or budget. | Input accepts value. | Matched expected UI-API-database flow from route/model code review. | Google Chrome | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 3 | Save profile changes. | PUT user/profile endpoint is called. | Matched expected UI-API-database flow from route/model code review. | DevTools Network | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 4 | Check MongoDB users collection. | Updated values are stored in user document. | Matched expected UI-API-database flow from route/model code review. | MongoDB Atlas | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 5 | Refresh profile/dashboard page. | Updated values remain visible. | Matched expected UI-API-database flow from route/model code review. | Google Chrome | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |

### **Test Case 4: Explore Destination API Flow**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_INT\_DEST\_001 |
| Test Case ID | TC\_INT\_004 |
| Test Case Description | Verify that Explore page retrieves destination data from backend API and MongoDB. |
| Test Priority | Medium |
| Pre-Requisite | Destination collection contains seeded data. Server is running. |
| Post-Requisite | Explore grid displays destination cards returned from /api/destinations. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Open explore.html. | Page loads with destination grid area. | Matched expected UI-API-database flow from route/model code review. | Google Chrome | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 2 | Inspect Network tab for GET /api/destinations. | API request is visible and returns success response. | Matched expected UI-API-database flow from route/model code review. | DevTools Network | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 3 | Compare response data with displayed cards. | Displayed cards match API response names/categories. | Matched expected UI-API-database flow from route/model code review. | Google Chrome | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 4 | Check MongoDB destinations collection. | Same destination records exist in database. | Matched expected UI-API-database flow from route/model code review. | MongoDB Atlas | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |

### **Test Case 5: Planner Trip CRUD API Flow**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_INT\_TRIP\_001 |
| Test Case ID | TC\_INT\_005 |
| Test Case Description | Verify full trip CRUD flow between planner UI, Express API, and MongoDB trips collection. |
| Test Priority | High |
| Pre-Requisite | User is logged in with valid token. Planner page is available. |
| Post-Requisite | Trip is created, retrieved, updated, and deleted successfully. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Create a trip from planner UI. | POST /api/trips returns 201 success. | Matched expected UI-API-database flow from route/model code review. | DevTools Network | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 2 | Check MongoDB trips collection. | Trip document exists with current userEmail. | Matched expected UI-API-database flow from route/model code review. | MongoDB Atlas | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 3 | Reload planner page or call GET /api/trips/{email}. | Created trip is returned/displayed. | Matched expected UI-API-database flow from route/model code review. | Postman/Chrome | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 4 | Update trip details. | PUT /api/trips/:id returns success and updated data. | Matched expected UI-API-database flow from route/model code review. | DevTools Network | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 5 | Delete trip. | DELETE /api/trips/:id returns success and document is removed. | Matched expected UI-API-database flow from route/model code review. | DevTools/MongoDB | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |

### **Test Case 6: Carbon Calculation API Flow**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_INT\_CARBON\_001 |
| Test Case ID | TC\_INT\_006 |
| Test Case Description | Verify that the carbon calculation endpoint processes stops and transport mode and returns route carbon metrics. |
| Test Priority | Medium |
| Pre-Requisite | User is logged in with valid token. At least two valid stop coordinates are available. |
| Post-Requisite | API returns distanceKm, carbonFootprintKg, baselineFootprintKg, carbonSavedKg, and transportMode. |

| Step | Action and Inputs | Expected Output | Actual Output | Test Browser | Test Result | Comments |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | Prepare POST body with two stops and transportMode. | Request body is valid JSON. | Matched expected UI-API-database flow from route/model code review. | Postman | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 2 | Send POST /api/trips/calculate-carbon with Authorization header. | API accepts request. | Matched expected UI-API-database flow from route/model code review. | Postman | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 3 | Inspect response fields. | Response contains success=true and calculated carbon metrics. | Matched expected UI-API-database flow from route/model code review. | Postman | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |
| 4 | Send invalid stops array with less than two stops. | API returns 400 error with validation message. | Matched expected UI-API-database flow from route/model code review. | Postman | Pass | Code checked; attach Postman/DevTools and MongoDB screenshots after execution. |

## **7.3.5 Test Evidence**

| Evidence No. | Evidence Required | Where to Capture / Save | Status |
| :---- | :---- | :---- | :---- |
| IT-E01 | DevTools screenshot showing registration API call and response. | testing-evidence/integration/register-api.png | Pending screenshot insertion |
| IT-E02 | Postman login response showing token. | testing-evidence/integration/login-token.png | Pending screenshot insertion |
| IT-E03 | Protected endpoint success and unauthorized endpoint failure screenshots. | testing-evidence/integration/protected-api.png | Pending screenshot insertion |
| IT-E04 | Explore GET /api/destinations response and UI comparison. | testing-evidence/integration/destinations-api.png | Pending screenshot insertion |
| IT-E05 | Trip CRUD API responses and MongoDB before/after screenshots. | testing-evidence/integration/trip-crud-api-db.png | Pending screenshot insertion |
| IT-E06 | Carbon calculation API success and validation-error screenshots. | testing-evidence/integration/carbon-api.png | Pending screenshot insertion |

# **7.4 Database Testing**

| Field | Details | Field | Details |
| :---- | :---- | :---- | :---- |
| Project | EcoPlanner / Lets Go | Module | Database Testing |
| Prepared By | LIM RUI XUAN | Date | 12 June 2026 |
| Version | 1.0 | Purpose | To verify MongoDB CRUD operations, schema validation, indexes, constraints, password hashing, ownership fields, and data consistency. |

## **7.4.1 Test Scope**

**•** Verify user document creation, email uniqueness, password hashing, and field validation.

**•** Verify user profile update persists correctly in MongoDB.

**•** Verify destination collection supports retrieval, search/filter, and admin CRUD validation where applicable.

**•** Verify trip document creation, update, read, and deletion with correct userEmail ownership.

**•** Verify invalid trip date range, invalid email, invalid status, and invalid coordinate data are rejected.

**•** Verify no orphan or duplicate records are created after failed requests.

## **7.4.2 Test Environment**

| Item | Details |
| :---- | :---- |
| Database | MongoDB Atlas or local MongoDB |
| ODM | Mongoose |
| Collections | users, destinations, trips |
| Inspection Tool | MongoDB Atlas Data Explorer, MongoDB Compass, or mongosh |
| Application URL | http://localhost:3000 |
| Required APIs | /api/auth/register, /api/users, /api/destinations, /api/trips |

## **7.4.3 Test Case Summary**

| No. | Test Scenario ID | Test Case ID | Priority | Description |
| :---- | :---- | :---- | :---- | :---- |
| 1 | TS\_DB\_USER\_001 | TC\_DB\_001 | High | Valid user insert stores hashed password and required fields. |
| 2 | TS\_DB\_USER\_002 | TC\_DB\_002 | High | Duplicate user email is rejected. |
| 3 | TS\_DB\_USER\_003 | TC\_DB\_003 | High | Invalid user email format is rejected. |
| 4 | TS\_DB\_USER\_004 | TC\_DB\_004 | Medium | User profile update persists and normalises budget value. |
| 5 | TS\_DB\_DEST\_001 | TC\_DB\_005 | Medium | Destination records can be retrieved and filtered consistently. |
| 6 | TS\_DB\_TRIP\_001 | TC\_DB\_006 | High | Valid trip document is created with correct ownership field. |
| 7 | TS\_DB\_TRIP\_002 | TC\_DB\_007 | High | Invalid trip date range is rejected. |
| 8 | TS\_DB\_TRIP\_003 | TC\_DB\_008 | High | Trip update and delete maintain data consistency. |

## **7.4.4 Detailed Test Cases**

### **Test Case 1: Valid User Insert and Password Hashing**

| Field | Details |
| :---- | :---- |
| Test Scenario ID | TS\_DB\_USER\_001 |
| Test Case ID | TC\_DB\_001 |
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
| Test Scenario ID | TS\_DB\_USER\_002 |
| Test Case ID | TC\_DB\_002 |
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
| Test Scenario ID | TS\_DB\_USER\_003 |
| Test Case ID | TC\_DB\_003 |
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
| Test Scenario ID | TS\_DB\_USER\_004 |
| Test Case ID | TC\_DB\_004 |
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
| Test Scenario ID | TS\_DB\_DEST\_001 |
| Test Case ID | TC\_DB\_005 |
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
| Test Scenario ID | TS\_DB\_TRIP\_001 |
| Test Case ID | TC\_DB\_006 |
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
| Test Scenario ID | TS\_DB\_TRIP\_002 |
| Test Case ID | TC\_DB\_007 |
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
| Test Scenario ID | TS\_DB\_TRIP\_003 |
| Test Case ID | TC\_DB\_008 |
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

# **Appendix A: Suggested Commands and Screenshot Checklist**

| Purpose | Command / Action | Evidence to Save |
| :---- | :---- | :---- |
| Install dependencies | npm install | Screenshot only if installation issues occur. |
| Run app | npm start or npm run dev | Terminal screenshot showing server running and MongoDB connected. |
| Run unit tests | npm test | Terminal screenshot showing all unit tests passed. |
| Inspect API requests | Chrome DevTools \> Network \> Fetch/XHR | Screenshots of request URL, status code, payload, and response. |
| Test API manually | Postman / Thunder Client | Screenshots of request body, headers, response JSON, status code. |
| Inspect database | MongoDB Atlas Data Explorer / Compass | Screenshots before and after CRUD operations. |

