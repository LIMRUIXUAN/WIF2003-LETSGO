UI / Navigation Test Cases  
 EcoPlanner Dashboard

**Formal QA Test Documentation**

| Project | EcoPlanner |
| :---- | :---- |
| **Module** | Dashboard / Navigation / UI |
| **Prepared By** | LIM RUI XUAN |
| **Date** | 06 May 2026 |
| **Version** | 1.0 |
| **Purpose** | To verify page navigation, active link states, profile badge behavior, dashboard quick links, and CO2 goal modal interactions after user login. |

 

*Test Result Legend:* 

*Pass \= Expected matches actual* 

*Fail \= Mismatch found*

*Blocked \= Cannot test due to setup/API/server issue*

*Not Tested \= Not executed yet*

1. # **Test Scope**

·        Verify sidebar navigation from Dashboard to Explore.  
·        Verify top navigation bar active state across Dashboard, Explore, Itinerary, Weather, Carbon, and Favorites pages.  
·        Verify user avatar badge display, hover state, and navigation to Profile.  
·        Verify Dashboard quick links and statistics cards.  
·        Verify CO2 Goal modal open, preset selection, custom input, validation, save, and cancel flows.

2. # **Test Environment**

| Application URL | http://localhost:3000 |
| :---- | :---- |
| **Recommended Browser** | Google Chrome or later |
| **Default Test User** | demo@ecoplanner.com / password123 |
| **Minimum Desktop Width** | \>= 992px for sidebar tests; \>= 768px for top navigation tests |
| **Required Login State** | localStorage contains ecoUserEmail and isLoggedIn=true |
| **Required APIs** | /api/auth/login, /api/users/profile/{email}, /api/trips/{email} |

3. # **Test Case Summary**

| No. | Test Scenario ID | Test Case ID | Priority | Description |
| :---- | :---- | :---- | :---- | :---- |
| 1 | TS\_NAV\_001 | TC\_NAV\_001 | High | Sidebar Navigation from Dashboard to Explore |
| 2 | TS\_NAV\_002 | TC\_NAV\_002 | High | Top Navigation Bar Active State Across All Pages |
| 3 | TS\_NAV\_003 | TC\_NAV\_003 | Medium | User Avatar Badge Navigation to Profile |
| 4 | TS\_UI\_001 | TC\_UI\_001 | High | Dashboard "View All" Quick Links and Stats Cards Display |
| 5 | TS\_UI\_002 | TC\_UI\_002 | Medium | CO₂ Goal Modal — Open, Preset, Custom Input, Save, and Cancel |

# **4\. Detailed Test Cases**

 

## **Test Case 1: Sidebar Navigation from Dashboard to Explore**

| Test Scenario ID | TS\_NAV\_001 |
| :---- | :---- |
| **Test Case ID** | TC\_NAV\_001 |
| **Test Case Description** | Verify that clicking the "Explore" sidebar link navigates from Dashboard to the Explore page. The sidebar active state must update, page content must fully load, and the browser tab title must change accordingly. |
| **Test Priority** | High |
| **Pre-Requisite** | 1\. Server is running at [http://localhost:3000](http://localhost:3000). 2\. User is logged in (email: demo@ecoplanner.com, password: password123). 3\. User is on dashboard.html. 4\. Browser window width ≥ 992px so the sidebar (d-none d-lg-block) is visible. 5\. localStorage contains key ecoUserEmail with value demo@ecoplanner.com. |
| **Post-Requisite** | 1\. Browser URL shows localhost://3000/explore.html. 2\. Sidebar "Explore" link has CSS class active with background \#d8f3dc. 3\. Dashboard link no longer has active class. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | Open browser and navigate to login page. Input: URL: http://localhost:3000/login.html | 1\.          Login page loads. 2\.          The auth card is centered on screen with a green gradient background (linear-gradient(135deg, \#1b4332, \#40916c)). 3\.          Logo image logo\_letsgo.png is displayed. 4\.          The email field shows the pre-filled value demo@ecoplanner.com. The password field shows the pre-filled value password123. 5\.          The "Sign In" button is green with rounded corners. Tagline reads "Welcome back, eco traveler". The browser tab title shows "EcoPlanner – Sign In". | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **2** | Click the "Sign In" button. Input: Click button with class btn-eco containing text "Sign In". | 1\.          Button text changes to spinner with "Processing..." text (spinner-border spinner-border-sm). 2\.          A POST request is sent to /api/auth/login. 3\.          After \~800ms, a green toast notification appears at top saying "Welcome back, \[User Name can be Dr Uzair… okay joking\]\! ". 4\.          Browser redirects to explore.html. localStorage now contains keys: ecoUserEmail, ecoUserName, isLoggedIn set to true. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **3** | Navigate to Dashboard page via sidebar. Input: Click sidebar link "Dashboard" (a.sidebar-link\[href="dashboard.html"\]). | 1\.          Browser navigates to dashboard.html. Welcome banner (div.welcome-banner) appears with time-based greeting: "Good morning" (before 12pm), "Good afternoon" (12pm–5pm), or "Good evening" (after 5pm), followed by user's first name and 👋 emoji. 2\.          Sub-text reads "Here's your eco travel overview for today." The \#navInitial badge in top-right shows user initials (e.g. "DU" for Demo User) with green background (\#74c69d). 3\.          Stats row shows 4 cards: Total Trips, Favourites Saved, kg CO₂ Saved, Eco Score Avg. 4\.          Sidebar "Dashboard" link has active class with pale green background \#d8f3dc and bold text color \#2d6a4f. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **4** | Verify sidebar structure and all links are visible. Input: Visually inspect the left sidebar panel. | 1\.          Sidebar has white background, width 240px, with a sticky position at top: 60px. 2\.          Sections visible: Main section label (uppercase, small font, color \#9ab3a0) with links: \-             Dashboard (speedometer icon) \-             Explore (compass icon) \-             My Itinerary (map icon) \-             Tools section label with links: Weather (cloud-sun icon) \-             Carbon Calc (bar-chart icon) \-             Favorites (heart icon) \-             Account section label with links: Profile (person icon) \-             Logout (box-arrow-right icon, red color \#c0392b) 3\.          Logo image is at top with border-bottom separator. 4\.          Each link has 12px border-radius and 9px 12px padding. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **5** | Click the "Explore" link in the sidebar. Input: Click a.sidebar-link\[href="explore.html"\] with compass icon. | 1\.          Browser navigates to /explore.html. Page fully loads with: (1) Page heading "Explore Eco Destinations" in bold. (2) Subtitle "Find sustainable hotels, restaurants, transport & activities". (3) Search bar with magnifying glass icon and "Filter" button. (4) Six category filter chips: "All" (active by default with green background), "🏨 Hotels", "🍃 Restaurants", "🚲 Transport", "🌊 Activities", "⭐ Eco 9+". (5) Listings grid (\#listingsGrid) populated with eco destination cards. (6) Sidebar "Explore" link now has active class. (7) Browser tab title reads "EcoPlanner – Explore". (8) Top nav bar "Explore" link also shows active state with rgba(255,255,255,0.2) background. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |

 

## **Test Case 2: Top Navigation Bar Active State Across All Pages**

| Test Scenario ID | TS\_NAV\_002 |
| :---- | :---- |
| **Test Case ID** | TC\_NAV\_002 |
| **Test Case Description** | Verify that clicking each link in the top navigation bar (Dashboard, Explore, Itinerary, Weather, Carbon, Favorites) navigates to the correct page, the clicked link receives the active CSS class with visual highlighting, and previous active link loses its highlight. |
| **Test Priority** | High |
| **Pre-Requisite** | 1\. User is logged in and on dashboard.html. 2\. Browser window width ≥ 768px so top nav links are visible (d-none d-md-flex). 3\. Top navigation bar is sticky at top with green background (\#2d6a4f). |
| **Post-Requisite** | All 6 navigation links have been verified to navigate correctly. The final page is dashboard.html with Dashboard link active. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | On Dashboard, inspect the top nav bar. | Green navigation bar (background: \#2d6a4f) is fixed/sticky at top with z-index: 1000\. Six links are horizontally centered using position: absolute; left: 50%; transform: translateX(-50%). Each link has white text at 0.8 opacity (rgba(255,255,255,0.8)), font-size 0.85rem, font-weight 500, and rounded pill shape (border-radius: 20px). "Dashboard" link has active class with brighter white text and semi-transparent white background rgba(255,255,255,0.2). User initial badge is positioned at far right. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **2** | Click "Explore" in the top nav. Input: Click a.nav-link\[href="explore.html"\] with compass icon bi-compass. | URL changes to /explore.html. Page loads with "Explore Eco Destinations" heading. "Explore" nav link now has active class. Previously active "Dashboard" link reverts to default opacity (0.8). Tab title: "EcoPlanner – Explore". | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **3** | Click "Itinerary" in the top nav. Input: Click a.nav-link\[href="planner.html"\] with map icon bi-map. | URL changes to /planner.html. Page loads with "My Green Itineraries" heading and "New Itinerary" button (btn-eco). "Itinerary" nav link now active. Tab title: "EcoPlanner – My Itinerary". The \#listView div is visible showing existing itineraries or empty state. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **4** | Click "Weather" in the top nav. Input: Click a.nav-link\[href="weather.html"\] with cloud-sun icon bi-cloud-sun. | URL changes to /weather.html. Weather page loads. "Weather" link now active. Tab title updates accordingly. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **5** | Click "Carbon" in the top nav. Input: Click a.nav-link\[href="carbon.html"\] with bar-chart icon bi-bar-chart. | URL changes to /carbon.html. Carbon calculator page loads. "Carbon" link now active. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **6** | Click "Favorites" in the top nav. Input: Click a.nav-link\[href="favorites.html"\] with heart icon bi-heart. | URL changes to /favorites.html. Favorites page loads showing saved eco destinations. "Favorites" link now active. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **7** | Click "Dashboard" in the top nav to return. Input: Click a.nav-link\[href="dashboard.html"\] with speedometer icon bi-speedometer2. | URL changes to /dashboard.html. Dashboard fully reloads: welcome banner, stats row, recent trips, saved favourites, CO₂ chart, weather widget, profile summary, and activity feed all render. "Dashboard" link is active again. No console errors in DevTools (F12). | Actual Output: Test Browser: Google Chrome Test Result: Comments: |

 

## **Test Case 3: User Avatar Badge Navigation to Profile**

| Test Scenario ID | TS\_NAV\_003 |
| :---- | :---- |
| **Test Case ID** | TC\_NAV\_003 |
| **Test Case Description** | Verify that the circular user initial badge (\#navInitial) in the top-right corner of the navigation bar displays the correct user initials, shows a pointer cursor on hover, and navigates to profile.html when clicked. Also verify browser back button returns to previous page. |
| **Test Priority** | Medium |
| **Pre-Requisite** | 1\. User is logged in as "Demo User" (or any user with a known name). 2\. User is on dashboard.html. 3\. localStorage contains ecoUserEmail. 4\. The app.js DOMContentLoaded handler has run and populated \#navInitial with user initials from either localStorage('ecoUserInitials') or the /api/users/profile/ API call. |
| **Post-Requisite** | User has navigated to Profile page and returned to Dashboard via browser back button. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | Locate the user badge in the top-right of the nav bar. | A circular badge (div.user-badge) is visible with: width and height 34px, border-radius: 50%, green background (\#74c69d, CSS var \--eco-leaf), dark text color (\#5c3d2e, CSS var \--eco-bark), font-weight 600, font-size 0.8rem. The badge displays 1–2 uppercase letters representing the user's initials (e.g. "DU" for "Demo User"). These initials are derived from user.name.split(' ').map(w \=\> w\[0\]).join('').toUpperCase().slice(0,2). | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **2** | Hover over the user badge. Input: Move mouse cursor over \#navInitial. | Cursor changes to pointer (set by CSS cursor: pointer). This indicates the element is clickable. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **3** | Click on the user badge. Input: Click \#navInitial element. The onclick attribute is window.location.href='profile.html'. | Browser navigates to /profile.html. The Profile page loads showing: user's full name, email address, home city, travel budget preference, interest tags. The sidebar "Profile" link (under "Account" section) has active class. Top nav bar is still visible with the same user badge. Tab title shows "EcoPlanner – Profile". | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **4** | Press browser back button. Input: Press Alt \+ ← or click browser back arrow. | Browser navigates back to /dashboard.html. Dashboard page reloads with all widgets: welcome banner with greeting, stats row, recent trips list, saved favourites, CO₂ activity chart (Chart.js canvas \#co2Chart), weather widget, profile summary card, and activity feed timeline. No errors in browser console. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **5** | Navigate to Explore page and verify badge persists. Input: Click "Explore" in sidebar, then inspect \#navInitial on Explore page. | After navigation to explore.html, the user badge is still present in the top nav bar showing the same initials. The initials are loaded from localStorage.getItem('ecoUserInitials') for instant display. Badge styling is identical across all pages. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |

 

## 

## **Test Case 4: Dashboard "View All" Quick Links and Stats Cards Display**

| Test Scenario ID | TS\_UI\_001 |
| :---- | :---- |
| **Test Case ID** | TC\_UI\_001 |
| **Test Case Description** | Verify that the Dashboard displays all statistics cards with correct data, and that "View all →" links in "Recent Trips" and "Saved Favourites" sections navigate to the Planner and Favorites pages respectively. Also verify the "Full forecast →" link navigates to Weather and "Edit →" link navigates to Profile. |
| **Test Priority** | High |
| **Pre-Requisite** | 1\. User is logged in. 2\. User has at least 1 trip created (via Planner page) and at least 1 favourite saved (via Explore page). 3\. User is on dashboard.html. 4\. API endpoints /api/users/profile/{email} and /api/trips/{email} return valid data. 5\. The LISTINGS array in app.js contains 8 eco listings with IDs 1–8. |
| **Post-Requisite** | All stat cards show numeric values. All 4 "view all" shortcut links have been tested and navigate correctly. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | Observe the stats row below the welcome banner. | Four stat cards are displayed in a responsive grid (row g-3 mb-4, each col-6 col-lg). Each card (div.dash-stat) contains: (1) a colored icon circle (ds-icon) and (2) a value/label pair. Card 1: Green map icon (ds-green, bi-map-fill), numeric value in \#statTrips (e.g. "3"), label "Total Trips". Card 2: Red heart icon (ds-red, bi-heart-fill), numeric value in \#statFavs (e.g. "2"), label "Favourites Saved". Card 3: Blue cloud icon (ds-blue, bi-cloud-fill), numeric value in \#statCO2 (e.g. "45"), label "kg CO₂ Saved". Card 4: Orange award icon (ds-orange, bi-award-fill), numeric value in \#statEco (e.g. "9.1"), label "Eco Score Avg". None of the values should show "–" (dash), which indicates data failed to load. If user has co2Footprint \> 0, a 5th card appears: "kg CO₂ Produced" (\#statFootprintCard). | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **2** | Scroll to "Recent Trips" section and verify content. | Section card with heading: green map icon \+ "Recent Trips" \+ "View all →" link (right-aligned, font-size 0.8rem, color \#40916c). The \#tripsList div shows up to 5 most recent trips sorted by createdAt descending. Each trip item (div.trip-item) shows: map emoji 🗺, trip name (bold), city \+ date range, and a status badge — "Active" (tb-active), "Completed" (tb-past), or "Upcoming" (tb-upcoming). If no trips exist, empty state shows: map icon \+ "No trips yet." \+ link "Plan your first trip →" pointing to planner.html. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **3** | Click "View all →" in Recent Trips. Input: Click anchor a\[href="planner.html"\] inside the Recent Trips h6. | Browser navigates to /planner.html. Planner page loads with heading "My Green Itineraries", subtitle "Plan, edit and manage your eco travel plans", and a green "New Itinerary" button. The \#itineraryList div shows all user's itineraries (not limited to 5). Sidebar "My Itinerary" link is active. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **4** | Navigate back to Dashboard. Click "View all →" in Saved Favourites. Input: Return to dashboard. Click anchor a\[href="favorites.html"\] inside the Saved Favourites h6. | Browser navigates to /favorites.html. Favorites page loads showing all saved favourite eco destinations. Each favourite card shows name, location, eco score, and category. Sidebar "Favorites" link is active. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **5** | Navigate back to Dashboard. Click "Full forecast →" in Weather widget. Input: Return to dashboard. Click anchor a\[href="weather.html"\] in Weather section. | Browser navigates to /weather.html. Weather page loads with city search and forecast data. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **6** | Navigate back to Dashboard. Click "Edit →" in Travel Profile section. Input: Return to dashboard. Click anchor a\[href="profile.html"\] in Profile Summary section. | Browser navigates to /profile.html. Profile edit page loads with user's current info. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |

 

**Test Case 5: CO₂ Goal Modal — Open, Preset, Custom Input, Save, and Cancel**

| Test Scenario ID | TS\_UI\_002 |
| :---- | :---- |
| **Test Case ID** | TC\_UI\_002 |
| **Test Case Description** | Verify the full interaction flow of the CO₂ Goal modal: opening via the "My CO₂ Goal" card click, selecting preset values, entering custom values, input validation (min 10, max 9999), saving to localStorage, updating the dashboard chart/labels, and cancelling without changes. |
| **Test Priority** | Medium |
| **Pre-Requisite** | 1\. User is logged in and on dashboard.html. 2\. The Activity Overview section with CO₂ chart is visible on screen. 3\. Current goal is default 500 kg (or whatever is stored in localStorage.getItem('ecoGoalCO2')). 4\. The \#goalModal element exists in the DOM with display: none. |
| **Post-Requisite** | 1\. localStorage.getItem('ecoGoalCO2') equals the newly saved value. 2\. Dashboard label \#co2GoalLabel shows updated goal. 3\. Goal Progress percentage \#co2Pct recalculated as min(100, round((co2Saved / newGoal) \* 100))%. |

### **Test Execution Steps**

| Step | Action and Inputs | Expected Output | Tester Notes |
| :---- | :---- | :---- | :---- |
| **1** | Scroll to the Activity Overview section and locate the "My CO₂ Goal" card. | Four summary mini-cards are displayed in a row: "Total CO₂ Saved" (green bg \#f0faf3), "Goal Progress" (green bg), "Trips This Month" (blue bg \#e3f0fb), "My CO₂ Goal" (yellow bg \#fff3cd). The "My CO₂ Goal" card shows: label "My CO₂ Goal" with a pencil icon (bi-pencil-fill), current goal value in bold (e.g. "500 kg") in \#co2GoalLabel with color \#7d4e00. Card has cursor: pointer and title="Click to change your goal". Below the cards is a Chart.js canvas (\#co2Chart) showing a line+bar combo chart with 6-month data. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **2** | Click the "My CO₂ Goal" card. Input: Click the yellow card with onclick="openGoalEditor()". | The \#goalModal backdrop appears with display: flex. A white modal (div.eco-modal, max-width: 360px) slides in containing: (1) Title "🎯 Set Your CO₂ Goal" (font-weight 700). (2) Description "How many kg of CO₂ do you want to save through eco travel?" (font-size 0.85rem, color \#6b7c6e). (3) Four preset buttons (button.goal-preset): "100 kg", "250 kg", "500 kg", "1000 kg". The button matching the current goal (500) has active class. (4) Custom input field (\#goalInput, type number, min=10, max=9999) pre-filled with current goal value "500". (5) "kg" label next to input. (6) Two buttons: "Cancel" (btn-eco-outline) and "Save Goal" (btn-eco). Background page is dimmed by the modal backdrop. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **3** | Click the "250 kg" preset button. Input: Click button.goal-preset with text "250 kg", which calls setGoalPreset(250). | The \#goalInput field value changes to 250\. The "250 kg" preset button gains active class (visually highlighted). The previously active "500 kg" button loses its active class. The highlightPreset() function toggles active class by comparing parseInt(button.textContent) with the value 250\. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **4** | Click the "1000 kg" preset button. Input: Click button.goal-preset with text "1000 kg", calls setGoalPreset(1000). | Input value changes to 1000\. "1000 kg" button is now active; "250 kg" is deactivated. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **5** | Clear the input and type a custom value. Input: Triple-click the \#goalInput field to select all, then type 750\. | Input field shows 750\. No preset button has active class since 750 doesn't match any preset (100, 250, 500, 1000). | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **6** | Click "Save Goal". Input: Click "Save Goal" button which calls saveGoal(). | The function reads parseInt($('\#goalInput').value, 10\) \= 750\. Since 750 ≥ 10 and ≤ 9999, validation passes. GOAL\_CO2 variable updates to 750\. localStorage.setItem('ecoGoalCO2', 750\) is called. Modal closes (display: none). renderCO2Chart() is re-invoked, updating: (1) \#co2GoalLabel text to "750 kg". (2) \#co2Pct recalculated (e.g. if co2Saved=45, then min(100, round(45/750\*100)) \= "6%"). A green toast notification appears: "CO₂ goal updated to 750 kg\!" with check-circle icon, which auto-dismisses after 3500ms. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **7** | Reopen modal and test validation with invalid input. Input: Click "My CO₂ Goal" card again. Clear input, type 5 (below minimum 10). Click "Save Goal". | Modal opens with input pre-filled to 750 (current goal). After changing to 5 and clicking Save, the saveGoal() function checks raw \< 10 → true. A warning toast appears: "Enter a goal between 10 and 9999 kg." with yellow warning icon (bi-exclamation-triangle, color \#f39c12). Modal stays open. Goal is NOT changed; localStorage still has 750\. | Actual Output: Test Browser: Google Chrome Test Result: Comments: |
| **8** | Click "Cancel" to close the modal. Input: Click "Cancel" button which calls closeModal('goalModal'). | Modal closes (\#goalModal display set to none). No changes are saved. Dashboard goal label still shows "750 kg". localStorage.getItem('ecoGoalCO2') still returns "750". | Actual Output: Test Browser: Google Chrome Test Result: Comments: |

 

# **5\. Notes**

·        Actual Output, Test Result, and Test Comments fields are intentionally left blank for tester execution.  
·        CSS values, IDs, classes, and expected UI behavior are based on the provided EcoPlanner source-code expectations.  
·        For cross-browser testing, duplicate the execution notes for Firefox, Safari, or Microsoft Edge as needed.

