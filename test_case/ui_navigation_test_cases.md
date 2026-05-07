# UI / Navigation Test Cases — EcoPlanner Dashboard

## Test Case 1: Sidebar Navigation from Dashboard to Explore

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_NAV_001 |
| **Test Case ID** | TC_NAV_001 |
| **Test Case Description** | Verify that clicking the "Explore" sidebar link navigates from Dashboard to the Explore page. The sidebar active state must update, page content must fully load, and the browser tab title must change accordingly. |
| **Test Priority** | High |
| **Pre-Requisite** | 1. Server is running at `http://localhost:3000`. 2. User is logged in (email: `demo@ecoplanner.com`, password: `password123`). 3. User is on `dashboard.html`. 4. Browser window width ≥ 992px so the sidebar (`d-none d-lg-block`) is visible. 5. `localStorage` contains key `ecoUserEmail` with value `demo@ecoplanner.com`. |
| **Post-Requisite** | 1. Browser URL shows `/explore.html`. 2. Sidebar "Explore" link has CSS class `active` with background `#d8f3dc`. 3. Dashboard link no longer has `active` class. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Open browser and navigate to login page. | URL: `http://localhost:3000/login.html` | Login page loads. The auth card is centered on screen with green gradient background (`linear-gradient(135deg, #1b4332, #40916c)`). Logo image `logo_letsgo.png` is displayed. Email field shows pre-filled value `demo@ecoplanner.com`. Password field shows pre-filled value `password123`. "Sign In" button is green with rounded corners. Tagline reads "Welcome back, eco traveler". Browser tab title shows "EcoPlanner – Sign In". | | Google Chrome v126 | | |
| 2 | Click the "Sign In" button. | Click button with class `btn-eco` containing text "Sign In". | Button text changes to spinner with "Processing..." text (`spinner-border spinner-border-sm`). A POST request is sent to `/api/auth/login`. After ~800ms, a green toast notification appears at top saying "Welcome back, [Name]! 🌿". Browser redirects to `explore.html`. `localStorage` now contains keys: `ecoUserEmail`, `ecoUserName`, `isLoggedIn` set to `true`. | | Google Chrome v126 | | |
| 3 | Navigate to Dashboard page via sidebar. | Click sidebar link "Dashboard" (`a.sidebar-link[href="dashboard.html"]`). | Browser navigates to `dashboard.html`. Welcome banner (`div.welcome-banner`) appears with time-based greeting: "Good morning" (before 12pm), "Good afternoon" (12pm–5pm), or "Good evening" (after 5pm), followed by user's first name and 👋 emoji. Sub-text reads "Here's your eco travel overview for today." The `#navInitial` badge in top-right shows user initials (e.g. "DU" for Demo User) with green background (`#74c69d`). Stats row shows 4 cards: Total Trips, Favourites Saved, kg CO₂ Saved, Eco Score Avg. Sidebar "Dashboard" link has `active` class with pale green background `#d8f3dc` and bold text color `#2d6a4f`. | | Google Chrome v126 | | |
| 4 | Verify sidebar structure and all links are visible. | Visually inspect the left sidebar panel. | Sidebar has white background, width 240px, with a sticky position at `top: 60px`. Sections visible: **Main** section label (uppercase, small font, color `#9ab3a0`) with links: Dashboard (speedometer icon), Explore (compass icon), My Itinerary (map icon). **Tools** section label with links: Weather (cloud-sun icon), Carbon Calc (bar-chart icon), Favorites (heart icon). **Account** section label with links: Profile (person icon), Logout (box-arrow-right icon, red color `#c0392b`). Logo image is at top with border-bottom separator. Each link has 12px border-radius and 9px 12px padding. | | Google Chrome v126 | | |
| 5 | Click the "Explore" link in the sidebar. | Click `a.sidebar-link[href="explore.html"]` with compass icon. | Browser navigates to `/explore.html`. Page fully loads with: (1) Page heading "Explore Eco Destinations" in bold. (2) Subtitle "Find sustainable hotels, restaurants, transport & activities". (3) Search bar with magnifying glass icon and "Filter" button. (4) Six category filter chips: "All" (active by default with green background), "🏨 Hotels", "🍃 Restaurants", "🚲 Transport", "🌊 Activities", "⭐ Eco 9+". (5) Listings grid (`#listingsGrid`) populated with eco destination cards. (6) Sidebar "Explore" link now has `active` class. (7) Browser tab title reads "EcoPlanner – Explore". (8) Top nav bar "Explore" link also shows `active` state with `rgba(255,255,255,0.2)` background. | | Google Chrome v126 | | |

---

## Test Case 2: Top Navigation Bar Active State Across All Pages

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_NAV_002 |
| **Test Case ID** | TC_NAV_002 |
| **Test Case Description** | Verify that clicking each link in the top navigation bar (Dashboard, Explore, Itinerary, Weather, Carbon, Favorites) navigates to the correct page, the clicked link receives the `active` CSS class with visual highlighting, and previous active link loses its highlight. |
| **Test Priority** | High |
| **Pre-Requisite** | 1. User is logged in and on `dashboard.html`. 2. Browser window width ≥ 768px so top nav links are visible (`d-none d-md-flex`). 3. Top navigation bar is sticky at top with green background (`#2d6a4f`). |
| **Post-Requisite** | All 6 navigation links have been verified to navigate correctly. The final page is `dashboard.html` with Dashboard link active. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | On Dashboard, inspect the top nav bar. | N/A | Green navigation bar (`background: #2d6a4f`) is fixed/sticky at top with `z-index: 1000`. Six links are horizontally centered using `position: absolute; left: 50%; transform: translateX(-50%)`. Each link has white text at 0.8 opacity (`rgba(255,255,255,0.8)`), font-size `0.85rem`, font-weight 500, and rounded pill shape (`border-radius: 20px`). "Dashboard" link has `active` class with brighter white text and semi-transparent white background `rgba(255,255,255,0.2)`. User initial badge is positioned at far right. | | Google Chrome v126 | | |
| 2 | Click "Explore" in the top nav. | Click `a.nav-link[href="explore.html"]` with compass icon `bi-compass`. | URL changes to `/explore.html`. Page loads with "Explore Eco Destinations" heading. "Explore" nav link now has `active` class. Previously active "Dashboard" link reverts to default opacity (0.8). Tab title: "EcoPlanner – Explore". | | Google Chrome v126 | | |
| 3 | Click "Itinerary" in the top nav. | Click `a.nav-link[href="planner.html"]` with map icon `bi-map`. | URL changes to `/planner.html`. Page loads with "My Green Itineraries" heading and "New Itinerary" button (`btn-eco`). "Itinerary" nav link now active. Tab title: "EcoPlanner – My Itinerary". The `#listView` div is visible showing existing itineraries or empty state. | | Google Chrome v126 | | |
| 4 | Click "Weather" in the top nav. | Click `a.nav-link[href="weather.html"]` with cloud-sun icon `bi-cloud-sun`. | URL changes to `/weather.html`. Weather page loads. "Weather" link now active. Tab title updates accordingly. | | Google Chrome v126 | | |
| 5 | Click "Carbon" in the top nav. | Click `a.nav-link[href="carbon.html"]` with bar-chart icon `bi-bar-chart`. | URL changes to `/carbon.html`. Carbon calculator page loads. "Carbon" link now active. | | Google Chrome v126 | | |
| 6 | Click "Favorites" in the top nav. | Click `a.nav-link[href="favorites.html"]` with heart icon `bi-heart`. | URL changes to `/favorites.html`. Favorites page loads showing saved eco destinations. "Favorites" link now active. | | Google Chrome v126 | | |
| 7 | Click "Dashboard" in the top nav to return. | Click `a.nav-link[href="dashboard.html"]` with speedometer icon `bi-speedometer2`. | URL changes to `/dashboard.html`. Dashboard fully reloads: welcome banner, stats row, recent trips, saved favourites, CO₂ chart, weather widget, profile summary, and activity feed all render. "Dashboard" link is active again. No console errors in DevTools (F12). | | Google Chrome v126 | | |

---

## Test Case 3: User Avatar Badge Navigation to Profile

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_NAV_003 |
| **Test Case ID** | TC_NAV_003 |
| **Test Case Description** | Verify that the circular user initial badge (`#navInitial`) in the top-right corner of the navigation bar displays the correct user initials, shows a pointer cursor on hover, and navigates to `profile.html` when clicked. Also verify browser back button returns to previous page. |
| **Test Priority** | Medium |
| **Pre-Requisite** | 1. User is logged in as "Demo User" (or any user with a known name). 2. User is on `dashboard.html`. 3. `localStorage` contains `ecoUserEmail`. 4. The `app.js` DOMContentLoaded handler has run and populated `#navInitial` with user initials from either `localStorage('ecoUserInitials')` or the `/api/users/profile/` API call. |
| **Post-Requisite** | User has navigated to Profile page and returned to Dashboard via browser back button. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Locate the user badge in the top-right of the nav bar. | N/A | A circular badge (`div.user-badge`) is visible with: width and height 34px, `border-radius: 50%`, green background (`#74c69d`, CSS var `--eco-leaf`), dark text color (`#5c3d2e`, CSS var `--eco-bark`), font-weight 600, font-size `0.8rem`. The badge displays 1–2 uppercase letters representing the user's initials (e.g. "DU" for "Demo User"). These initials are derived from `user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)`. | | Google Chrome v126 | | |
| 2 | Hover over the user badge. | Move mouse cursor over `#navInitial`. | Cursor changes to `pointer` (set by CSS `cursor: pointer`). This indicates the element is clickable. | | Google Chrome v126 | | |
| 3 | Click on the user badge. | Click `#navInitial` element. The `onclick` attribute is `window.location.href='profile.html'`. | Browser navigates to `/profile.html`. The Profile page loads showing: user's full name, email address, home city, travel budget preference, interest tags. The sidebar "Profile" link (under "Account" section) has `active` class. Top nav bar is still visible with the same user badge. Tab title shows "EcoPlanner – Profile". | | Google Chrome v126 | | |
| 4 | Press browser back button. | Press `Alt + ←` or click browser back arrow. | Browser navigates back to `/dashboard.html`. Dashboard page reloads with all widgets: welcome banner with greeting, stats row, recent trips list, saved favourites, CO₂ activity chart (Chart.js canvas `#co2Chart`), weather widget, profile summary card, and activity feed timeline. No errors in browser console. | | Google Chrome v126 | | |
| 5 | Navigate to Explore page and verify badge persists. | Click "Explore" in sidebar, then inspect `#navInitial` on Explore page. | After navigation to `explore.html`, the user badge is still present in the top nav bar showing the same initials. The initials are loaded from `localStorage.getItem('ecoUserInitials')` for instant display. Badge styling is identical across all pages. | | Google Chrome v126 | | |

---

## Test Case 4: Dashboard "View All" Quick Links and Stats Cards Display

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_UI_001 |
| **Test Case ID** | TC_UI_001 |
| **Test Case Description** | Verify that the Dashboard displays all statistics cards with correct data, and that "View all →" links in "Recent Trips" and "Saved Favourites" sections navigate to the Planner and Favorites pages respectively. Also verify the "Full forecast →" link navigates to Weather and "Edit →" link navigates to Profile. |
| **Test Priority** | High |
| **Pre-Requisite** | 1. User is logged in. 2. User has at least 1 trip created (via Planner page) and at least 1 favourite saved (via Explore page). 3. User is on `dashboard.html`. 4. API endpoints `/api/users/profile/{email}` and `/api/trips/{email}` return valid data. 5. The `LISTINGS` array in `app.js` contains 8 eco listings with IDs 1–8. |
| **Post-Requisite** | All stat cards show numeric values. All 4 "view all" shortcut links have been tested and navigate correctly. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Observe the stats row below the welcome banner. | N/A | Four stat cards are displayed in a responsive grid (`row g-3 mb-4`, each `col-6 col-lg`). Each card (`div.dash-stat`) contains: (1) a colored icon circle (`ds-icon`) and (2) a value/label pair. **Card 1**: Green map icon (`ds-green`, `bi-map-fill`), numeric value in `#statTrips` (e.g. "3"), label "Total Trips". **Card 2**: Red heart icon (`ds-red`, `bi-heart-fill`), numeric value in `#statFavs` (e.g. "2"), label "Favourites Saved". **Card 3**: Blue cloud icon (`ds-blue`, `bi-cloud-fill`), numeric value in `#statCO2` (e.g. "45"), label "kg CO₂ Saved". **Card 4**: Orange award icon (`ds-orange`, `bi-award-fill`), numeric value in `#statEco` (e.g. "9.1"), label "Eco Score Avg". None of the values should show "–" (dash), which indicates data failed to load. If user has `co2Footprint > 0`, a 5th card appears: "kg CO₂ Produced" (`#statFootprintCard`). | | Google Chrome v126 | | |
| 2 | Scroll to "Recent Trips" section and verify content. | N/A | Section card with heading: green map icon + "Recent Trips" + "View all →" link (right-aligned, font-size 0.8rem, color `#40916c`). The `#tripsList` div shows up to 5 most recent trips sorted by `createdAt` descending. Each trip item (`div.trip-item`) shows: map emoji 🗺, trip name (bold), city + date range, and a status badge — "Active" (`tb-active`), "Completed" (`tb-past`), or "Upcoming" (`tb-upcoming`). If no trips exist, empty state shows: map icon + "No trips yet." + link "Plan your first trip →" pointing to `planner.html`. | | Google Chrome v126 | | |
| 3 | Click "View all →" in Recent Trips. | Click anchor `a[href="planner.html"]` inside the Recent Trips `h6`. | Browser navigates to `/planner.html`. Planner page loads with heading "My Green Itineraries", subtitle "Plan, edit and manage your eco travel plans", and a green "New Itinerary" button. The `#itineraryList` div shows all user's itineraries (not limited to 5). Sidebar "My Itinerary" link is active. | | Google Chrome v126 | | |
| 4 | Navigate back to Dashboard. Click "View all →" in Saved Favourites. | Return to dashboard. Click anchor `a[href="favorites.html"]` inside the Saved Favourites `h6`. | Browser navigates to `/favorites.html`. Favorites page loads showing all saved favourite eco destinations. Each favourite card shows name, location, eco score, and category. Sidebar "Favorites" link is active. | | Google Chrome v126 | | |
| 5 | Navigate back to Dashboard. Click "Full forecast →" in Weather widget. | Return to dashboard. Click anchor `a[href="weather.html"]` in Weather section. | Browser navigates to `/weather.html`. Weather page loads with city search and forecast data. | | Google Chrome v126 | | |
| 6 | Navigate back to Dashboard. Click "Edit →" in Travel Profile section. | Return to dashboard. Click anchor `a[href="profile.html"]` in Profile Summary section. | Browser navigates to `/profile.html`. Profile edit page loads with user's current info. | | Google Chrome v126 | | |

---

## Test Case 5: CO₂ Goal Modal — Open, Preset, Custom Input, Save, and Cancel

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_UI_002 |
| **Test Case ID** | TC_UI_002 |
| **Test Case Description** | Verify the full interaction flow of the CO₂ Goal modal: opening via the "My CO₂ Goal" card click, selecting preset values, entering custom values, input validation (min 10, max 9999), saving to `localStorage`, updating the dashboard chart/labels, and cancelling without changes. |
| **Test Priority** | Medium |
| **Pre-Requisite** | 1. User is logged in and on `dashboard.html`. 2. The Activity Overview section with CO₂ chart is visible on screen. 3. Current goal is default 500 kg (or whatever is stored in `localStorage.getItem('ecoGoalCO2')`). 4. The `#goalModal` element exists in the DOM with `display: none`. |
| **Post-Requisite** | 1. `localStorage.getItem('ecoGoalCO2')` equals the newly saved value. 2. Dashboard label `#co2GoalLabel` shows updated goal. 3. Goal Progress percentage `#co2Pct` recalculated as `min(100, round((co2Saved / newGoal) * 100))%`. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Scroll to the Activity Overview section and locate the "My CO₂ Goal" card. | N/A | Four summary mini-cards are displayed in a row: "Total CO₂ Saved" (green bg `#f0faf3`), "Goal Progress" (green bg), "Trips This Month" (blue bg `#e3f0fb`), "My CO₂ Goal" (yellow bg `#fff3cd`). The "My CO₂ Goal" card shows: label "My CO₂ Goal" with a pencil icon (`bi-pencil-fill`), current goal value in bold (e.g. "500 kg") in `#co2GoalLabel` with color `#7d4e00`. Card has `cursor: pointer` and `title="Click to change your goal"`. Below the cards is a Chart.js canvas (`#co2Chart`) showing a line+bar combo chart with 6-month data. | | Google Chrome v126 | | |
| 2 | Click the "My CO₂ Goal" card. | Click the yellow card with `onclick="openGoalEditor()"`. | The `#goalModal` backdrop appears with `display: flex`. A white modal (`div.eco-modal`, `max-width: 360px`) slides in containing: (1) Title "🎯 Set Your CO₂ Goal" (font-weight 700). (2) Description "How many kg of CO₂ do you want to save through eco travel?" (font-size 0.85rem, color `#6b7c6e`). (3) Four preset buttons (`button.goal-preset`): "100 kg", "250 kg", "500 kg", "1000 kg". The button matching the current goal (500) has `active` class. (4) Custom input field (`#goalInput`, type number, min=10, max=9999) pre-filled with current goal value "500". (5) "kg" label next to input. (6) Two buttons: "Cancel" (`btn-eco-outline`) and "Save Goal" (`btn-eco`). Background page is dimmed by the modal backdrop. | | Google Chrome v126 | | |
| 3 | Click the "250 kg" preset button. | Click `button.goal-preset` with text "250 kg", which calls `setGoalPreset(250)`. | The `#goalInput` field value changes to `250`. The "250 kg" preset button gains `active` class (visually highlighted). The previously active "500 kg" button loses its `active` class. The `highlightPreset()` function toggles active class by comparing `parseInt(button.textContent)` with the value 250. | | Google Chrome v126 | | |
| 4 | Click the "1000 kg" preset button. | Click `button.goal-preset` with text "1000 kg", calls `setGoalPreset(1000)`. | Input value changes to `1000`. "1000 kg" button is now active; "250 kg" is deactivated. | | Google Chrome v126 | | |
| 5 | Clear the input and type a custom value. | Triple-click the `#goalInput` field to select all, then type `750`. | Input field shows `750`. No preset button has `active` class since 750 doesn't match any preset (100, 250, 500, 1000). | | Google Chrome v126 | | |
| 6 | Click "Save Goal". | Click "Save Goal" button which calls `saveGoal()`. | The function reads `parseInt($('#goalInput').value, 10)` = 750. Since 750 ≥ 10 and ≤ 9999, validation passes. `GOAL_CO2` variable updates to 750. `localStorage.setItem('ecoGoalCO2', 750)` is called. Modal closes (`display: none`). `renderCO2Chart()` is re-invoked, updating: (1) `#co2GoalLabel` text to "750 kg". (2) `#co2Pct` recalculated (e.g. if co2Saved=45, then `min(100, round(45/750*100))` = "6%"). A green toast notification appears: "CO₂ goal updated to 750 kg!" with check-circle icon, which auto-dismisses after 3500ms. | | Google Chrome v126 | | |
| 7 | Reopen modal and test validation with invalid input. | Click "My CO₂ Goal" card again. Clear input, type `5` (below minimum 10). Click "Save Goal". | Modal opens with input pre-filled to `750` (current goal). After changing to `5` and clicking Save, the `saveGoal()` function checks `raw < 10` → true. A warning toast appears: "Enter a goal between 10 and 9999 kg." with yellow warning icon (`bi-exclamation-triangle`, color `#f39c12`). Modal stays open. Goal is NOT changed; `localStorage` still has 750. | | Google Chrome v126 | | |
| 8 | Click "Cancel" to close the modal. | Click "Cancel" button which calls `closeModal('goalModal')`. | Modal closes (`#goalModal` display set to `none`). No changes are saved. Dashboard goal label still shows "750 kg". `localStorage.getItem('ecoGoalCO2')` still returns "750". | | Google Chrome v126 | | |

---

## Test Data Setup and Cleanup

| Field | Details |
|---|---|
| **Purpose** | Define reusable setup and cleanup steps required before running navigation test cases that depend on login state, user profile data, trips, favorites, and local browser storage. |
| **Recommended Test User** | Email: `demo@ecoplanner.com`; Password: `password123`; Name: `Demo User`; City: any supported city such as `Kuala Lumpur`. |
| **Required Browser Storage Before Protected-Page Tests** | `localStorage.ecoUserEmail = demo@ecoplanner.com`; `localStorage.ecoUserName = Demo User`; `localStorage.isLoggedIn = true`; optional `localStorage.ecoUserInitials = DU`. |
| **Required Test Data** | At least 1 trip exists for the user. At least 1 favorite destination exists for the user. CO₂ goal can be reset to default by removing `localStorage.ecoGoalCO2`. |
| **Cleanup** | After testing, remove test-only trips/favorites if created during execution. Clear browser storage keys created by the tests: `ecoUserEmail`, `ecoUserName`, `ecoUserInitials`, `isLoggedIn`, `ecoGoalCO2`, and any planner draft/session keys. |

---

## Test Case 6: Complete Sidebar Navigation Across Protected Pages

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_NAV_004 |
| **Test Case ID** | TC_NAV_004 |
| **Test Case Description** | Verify that every sidebar link navigates to the correct protected page and that each destination page highlights the correct sidebar active state. |
| **Test Priority** | High |
| **Pre-Requisite** | 1. Server is running at `http://localhost:3000`. 2. User is logged in. 3. Browser width is ≥ 992px so the sidebar is visible. 4. User starts on `dashboard.html`. |
| **Post-Requisite** | All sidebar links have been tested. The tester returns to `dashboard.html` at the end of the test. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Click Dashboard in sidebar. | `a.sidebar-link[href="dashboard.html"]` | URL changes to `/dashboard.html`. Dashboard page loads. Sidebar Dashboard link has `active` class. Top nav Dashboard link has `active` class. | | Google Chrome v126 | | |
| 2 | Click Explore in sidebar. | `a.sidebar-link[href="explore.html"]` | URL changes to `/explore.html`. Explore page loads. Sidebar Explore link has `active` class. Top nav Explore link has `active` class. | | Google Chrome v126 | | |
| 3 | Click My Itinerary in sidebar. | `a.sidebar-link[href="planner.html"]` | URL changes to `/planner.html`. Planner page loads. Sidebar My Itinerary link has `active` class. Top nav Itinerary link has `active` class. | | Google Chrome v126 | | |
| 4 | Click Weather in sidebar. | `a.sidebar-link[href="weather.html"]` | URL changes to `/weather.html`. Weather page loads. Sidebar Weather link has `active` class. Top nav Weather link has `active` class. | | Google Chrome v126 | | |
| 5 | Click Carbon Calc in sidebar. | `a.sidebar-link[href="carbon.html"]` | URL changes to `/carbon.html`. Carbon Calculator page loads. Sidebar Carbon Calc link has `active` class. Top nav Carbon link has `active` class. | | Google Chrome v126 | | |
| 6 | Click Favorites in sidebar. | `a.sidebar-link[href="favorites.html"]` | URL changes to `/favorites.html`. Favorites page loads. Sidebar Favorites link has `active` class. Top nav Favorites link has `active` class. | | Google Chrome v126 | | |
| 7 | Click Profile in sidebar. | `a.sidebar-link[href="profile.html"]` | URL changes to `/profile.html`. Profile page loads. Sidebar Profile link has `active` class. No unrelated top nav item should be active. | | Google Chrome v126 | | |

---

## Test Case 7: Logout Navigation and Session Cleanup

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_NAV_005 |
| **Test Case ID** | TC_NAV_005 |
| **Test Case Description** | Verify that clicking Logout clears the user's local session data and navigates away from protected pages. |
| **Test Priority** | High |
| **Pre-Requisite** | 1. User is logged in. 2. `localStorage.ecoUserEmail`, `localStorage.ecoUserName`, and `localStorage.isLoggedIn` exist. 3. Browser DevTools Application tab is available to inspect storage. |
| **Post-Requisite** | User is logged out and cannot return to Dashboard without signing in again. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Open Dashboard and click Logout in the sidebar. | `a.sidebar-link[href="index.html"]` with Logout icon. | Browser navigates to `/index.html`. `localStorage.ecoUserEmail` is removed. `sessionStorage` is cleared. | | Google Chrome v126 | | |
| 2 | Press browser Back button after logout. | Browser Back button or `Alt + Left Arrow`. | Protected dashboard must not remain accessible as an authenticated page. User should be redirected to `/login.html` or shown an unauthenticated state. | | Google Chrome v126 | | |
| 3 | Log in again, open Explore, and click Logout from the Explore sidebar. | `explore.html` sidebar Logout link. | Browser navigates to `/index.html`. User session keys should be cleared the same way as Dashboard logout. If keys remain in `localStorage`, record as failed behavior. | | Google Chrome v126 | | |
| 4 | Repeat Logout from Planner, Weather, Carbon, Favorites, and Profile. | Each page sidebar Logout link. | All protected pages should provide consistent logout behavior: navigate away from protected area and clear login-related storage. | | Google Chrome v126 | | |

---

## Test Case 8: Mobile Responsive Navigation

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_NAV_006 |
| **Test Case ID** | TC_NAV_006 |
| **Test Case Description** | Verify that the top navigation remains usable on small screens and the desktop sidebar is hidden. |
| **Test Priority** | High |
| **Pre-Requisite** | 1. User is logged in. 2. Browser DevTools device toolbar is available. 3. Test with viewport widths `375px`, `390px`, and `768px`. |
| **Post-Requisite** | User can navigate between all protected pages on mobile without using the desktop sidebar. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Resize viewport to mobile width. | Width `375px`, height `812px`. | `.dash-sidebar` is hidden. `.eco-nav` remains visible. Top nav links are displayed as icon-only square buttons with no text labels. User badge remains visible and does not overlap the nav icons. | | Google Chrome v126 | | |
| 2 | Horizontally scroll the top nav icons. | Swipe/drag the top nav links row. | All six protected-page icons can be reached: Dashboard, Explore, Itinerary, Weather, Carbon, Favorites. No icon is clipped permanently. | | Google Chrome v126 | | |
| 3 | Tap each top nav icon. | Tap Dashboard, Explore, Itinerary, Weather, Carbon, Favorites icons. | Each tap navigates to the correct page. The active icon has the active visual state. Page content remains readable without horizontal page overflow. | | Google Chrome v126 | | |
| 4 | Tap the user badge on mobile. | Tap `#navInitial`. | Browser navigates to `/profile.html`. Profile content is readable. Sidebar remains hidden. User badge still appears in top nav. | | Google Chrome v126 | | |
| 5 | Rotate or resize to tablet width. | Width `768px`. | Top nav remains usable. There is no overlap between nav icons/text, page heading, and user badge. | | Google Chrome v126 | | |

---

## Test Case 9: Authentication Page Navigation

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_AUTH_001 |
| **Test Case ID** | TC_AUTH_001 |
| **Test Case Description** | Verify navigation between public authentication pages: landing page, login, registration, and password reset. |
| **Test Priority** | High |
| **Pre-Requisite** | 1. Server is running. 2. Browser storage is cleared before starting. 3. User starts at `index.html`. |
| **Post-Requisite** | Public auth navigation paths are verified and user can return to sign in. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Open landing page. | `http://localhost:3000/index.html` | Landing page loads with CTA buttons: "Start Planning Free" and "Sign In". Browser tab title is "EcoPlanner – Sustainable Travel, Reimagined". | | Google Chrome v126 | | |
| 2 | Click Sign In. | `a[href="login.html"]` | Browser navigates to `/login.html`. Sign In form is visible. Browser tab title is "EcoPlanner – Sign In". | | Google Chrome v126 | | |
| 3 | Click Create Account from login page. | `a[href="register.html"]` | Browser navigates to `/register.html`. Create Account form is visible. Browser tab title is "EcoPlanner – Create Account". | | Google Chrome v126 | | |
| 4 | Click Sign In from register page. | `a[href="login.html"]` | Browser navigates back to `/login.html`. Login form is visible. | | Google Chrome v126 | | |
| 5 | Click Forgot password. | `a[href="reset-password.html"]` | Browser navigates to `/reset-password.html`. Reset password form is visible with email, code, new password, and confirm password fields. Browser tab title is "EcoPlanner - Reset Password". | | Google Chrome v126 | | |
| 6 | Click Back to Sign In from reset page. | `a[href="login.html"]` | Browser navigates to `/login.html`. Login form is visible. | | Google Chrome v126 | | |
| 7 | Register a new test account with valid fields. | Unique email such as `uitest+[timestamp]@ecoplanner.test`; valid password length ≥ 8. | Registration request succeeds. Success toast appears. Browser redirects to `/login.html`. | | Google Chrome v126 | | |

---

## Test Case 10: Unauthorized Direct Access to Protected Pages

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_AUTH_002 |
| **Test Case ID** | TC_AUTH_002 |
| **Test Case Description** | Verify that protected pages cannot be accessed directly when the user is not logged in. |
| **Test Priority** | High |
| **Pre-Requisite** | 1. Clear `localStorage` and `sessionStorage`. 2. Server is running. 3. User is not logged in. |
| **Post-Requisite** | All protected pages either redirect to login or prevent authenticated content from rendering. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Directly open Dashboard. | `http://localhost:3000/dashboard.html` | Browser redirects to `/login.html` because `ecoUserEmail` is missing. Protected dashboard content does not remain visible. | | Google Chrome v126 | | |
| 2 | Directly open Explore. | `http://localhost:3000/explore.html` | User should be redirected to `/login.html` or shown an unauthenticated state. Protected user-specific actions such as favorites should not use fallback demo/test accounts silently. | | Google Chrome v126 | | |
| 3 | Directly open Planner. | `http://localhost:3000/planner.html` | User should be redirected to `/login.html` or blocked from loading user itinerary data. | | Google Chrome v126 | | |
| 4 | Directly open Weather, Carbon, Favorites, and Profile. | `/weather.html`, `/carbon.html`, `/favorites.html`, `/profile.html`. | Each protected page should handle missing login state consistently. If page-specific content loads using fallback email values, record as failed behavior. | | Google Chrome v126 | | |

---

## Test Case 11: Profile Page Active Navigation State

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_NAV_007 |
| **Test Case ID** | TC_NAV_007 |
| **Test Case Description** | Verify that Profile page navigation state is not incorrectly assigned to another top navigation item. |
| **Test Priority** | Medium |
| **Pre-Requisite** | 1. User is logged in. 2. User navigates to `profile.html` from the user badge or sidebar Profile link. |
| **Post-Requisite** | Navigation state for Profile is documented correctly. Any incorrect active state is recorded as a UI defect. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Open Profile from the top-right badge. | Click `#navInitial`. | Browser navigates to `/profile.html`. Sidebar Profile link has `active` class. | | Google Chrome v126 | | |
| 2 | Inspect the top navigation active state. | Check `.eco-nav .nav-link.active`. | No unrelated top nav link should be active on Profile. Specifically, Itinerary should not be highlighted while viewing Profile. If Profile is not part of the top nav, the top nav may have no active item. | | Google Chrome v126 | | |
| 3 | Inspect browser tab title and page content. | N/A | Browser tab title is "EcoPlanner – My Profile". Profile form and account sections are visible. | | Google Chrome v126 | | |

---

## Test Case 12: Explore, Favorites, and Planner Cross-Feature Navigation

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_FLOW_001 |
| **Test Case ID** | TC_FLOW_001 |
| **Test Case Description** | Verify that feature shortcut actions navigate correctly between Explore, Favorites, and Planner. |
| **Test Priority** | Medium |
| **Pre-Requisite** | 1. User is logged in. 2. Explore listings are loaded. 3. Browser storage is available. |
| **Post-Requisite** | User can move naturally from destination discovery to saved favorites and itinerary planning. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Open Explore and click a destination favorite button. | Click a heart button inside a listing card. | Heart icon changes to saved state. Toast confirms the destination was bookmarked. User favorite data is updated for the logged-in user. | | Google Chrome v126 | | |
| 2 | Navigate to Favorites from top nav or sidebar. | `favorites.html`. | The saved destination appears in Favorites. Favorites sidebar/top nav active state is correct. | | Google Chrome v126 | | |
| 3 | Click "Add to Trip" from a favorite card. | Button inside favorite card. | Browser navigates to `/planner.html`. Planner page loads and imports or makes available the selected saved activity for scheduling. | | Google Chrome v126 | | |
| 4 | Return to Favorites with no saved favorites. | Remove all favorites, then reload `favorites.html`. | Empty state appears with "No favorites yet" and an "Explore Now" button. | | Google Chrome v126 | | |
| 5 | Click Explore Now from empty Favorites page. | `a[href="explore.html"]`. | Browser navigates to `/explore.html`. Explore page loads and Explore nav state is active. | | Google Chrome v126 | | |

---

## Test Case 13: Weather and Carbon Tool Navigation and Shortcuts

| Field | Details |
|---|---|
| **Test Scenario ID** | TS_FLOW_002 |
| **Test Case ID** | TC_FLOW_002 |
| **Test Case Description** | Verify navigation and shortcut behavior for Weather and Carbon tools, including API-backed search and saved eco-progress flow. |
| **Test Priority** | Medium |
| **Pre-Requisite** | 1. User is logged in. 2. Internet access is available for Open-Meteo geocoding/weather calls. 3. User has at least one planner trip if testing planner activity import from Carbon. |
| **Post-Requisite** | Weather and Carbon tool navigation works and no broken shortcut leaves the user stuck. |

**Test Execution Steps:**

| S.No | Action | Inputs | Expected Output | Actual Output | Test Browser | Test Result | Test Comments |
|------|--------|--------|-----------------|---------------|--------------|-------------|---------------|
| 1 | Open Weather page from Dashboard shortcut. | Click "Full forecast →" from Dashboard weather widget. | Browser navigates to `/weather.html`. Weather nav and sidebar active states are correct. | | Google Chrome v126 | | |
| 2 | Search for a city on Weather page. | Enter `Kuala Lumpur`, click Search. | Weather data loads without console errors. Current weather and forecast sections update. | | Google Chrome v126 | | |
| 3 | Open Carbon page from top nav. | Click Carbon top nav link. | Browser navigates to `/carbon.html`. Carbon nav and sidebar active states are correct. | | Google Chrome v126 | | |
| 4 | Calculate carbon impact. | Enter valid origin and destination, choose transport details if required, click Calculate. | Carbon result panel appears with calculated savings or footprint. No network or console error is shown. | | Google Chrome v126 | | |
| 5 | Click Log Eco Progress or save action after calculation. | Button rendered in carbon result panel. | Toast confirms eco progress was logged or saved to Planner. User profile/planner data updates as intended. | | Google Chrome v126 | | |
| 6 | Navigate to Planner after saving from Carbon. | Open `planner.html`. | Saved carbon-related activity or idea is visible/imported in Planner, or a clear confirmation path is provided. | | Google Chrome v126 | | |

---

> [!NOTE]
> - **Actual Output**, **Test Result**, and **Test Comments** columns are intentionally left blank for the tester to fill in during test execution.
> - All CSS values referenced (colors, sizes, classes) are based on the actual source code in `style.css`, `dashboard.css`, `dashboard.js`, and `app.js`.
> - Test Browser can be changed to Firefox, Safari, or Edge as needed for cross-browser testing.
