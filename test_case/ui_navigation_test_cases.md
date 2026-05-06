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

> [!NOTE]
> - **Actual Output**, **Test Result**, and **Test Comments** columns are intentionally left blank for the tester to fill in during test execution.
> - All CSS values referenced (colors, sizes, classes) are based on the actual source code in `style.css`, `dashboard.css`, `dashboard.js`, and `app.js`.
> - Test Browser can be changed to Firefox, Safari, or Edge as needed for cross-browser testing.
