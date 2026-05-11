# Lets Go – Eco-Friendly Travel Planner

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![Express](https://img.shields.io/badge/Express.js-Backend-lightgrey)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple)
![License](https://img.shields.io/badge/License-Academic-blue)

EcoTravel Planner is a full-stack web application that helps users plan sustainable trips by estimating carbon footprints and recommending environmentally responsible destinations.

The system integrates a responsive front-end with a RESTful backend to deliver real-time search, itinerary planning, and personalized travel suggestions.

---

## Overview

The application is designed to promote sustainable tourism by combining data-driven insights with an intuitive user interface. Users can explore destinations, compare environmental impact, and organize travel plans while making more eco-conscious decisions.

---

## Core Features

### Explore Module
- Autocomplete search suggests matching city names, destination names, and categories while users type
- Quick category chips filter listings by hotels, restaurants, transport, activities, or high eco-score items
- Advanced filter modal supports budget range, eco-rating threshold, category selection, certifications, and CO2 preference options
- Destination cards use a flip-card layout to show summary information on the front and detailed descriptions on the back
- Favorites can be toggled asynchronously and synced to the logged-in user's saved destinations without reloading the page
- "Add to Trip" stores selected places in browser storage so they can be scheduled later in the Planner page
- Destination data is loaded from MongoDB through `GET /api/destinations` and rendered dynamically in the Explore grid

### Itinerary Planner
- Timeline-based scheduling for daily activities  
- Integrated weather data for better planning decisions  

### Carbon Footprint Tracking
- Converts emissions into relatable equivalents (e.g., mileage, energy usage)  
- Allows users to record sustainability actions such as carbon offset initiatives  

---

## Technology Stack

### Front-End
- HTML5  
- CSS3  
- JavaScript  
- Bootstrap 5  

### Back-End
- Node.js  
- Express.js  

### Database
- MongoDB  
- Mongoose ODM  

---

## File Structure

📂 Phase 1: Front-End Structure (The "Safe Zone")
For Phase 1, everything is client-side. Every teammate "owns" specific HTML and JS files. No one should edit another person's assigned file without talking to them first.
```
WIF2003-ECOTRAVEL-PLANNER/
│
├── 📂 css/
│   ├── style.css            # Shared styles (Nav, Footer, Colors) - EVERYONE USES THIS
│   ├── explore.css          # Tan Jin Xiang (Search UI, filter modal, eco-options grid & flip cards)
│   ├── planner.css          # Julius Lim Jun Herng (Calendar drag-and-drop)
│   ├── dashboard.css        # Lim Rui Xuan (Dashboard UI)
│   └── carbon.css           # Chin Kin Hiung (Charts and calculator UI)
│
├── 📂 js/
│   ├── app.js               # Shared logic (Nav bar toggle, global helpers)
│   ├── auth.js              # Cha Zi Yu (Form validation, LocalStorage mock sessions)
│   ├── profile.js           # Lim Rui Xuan (Profile edit logic, mock soft delete)
│   ├── dashboard.js         # Lim Rui Xuan (Dashboard UI)
│   ├── explore.js           # Tan Jin Xiang (Autocomplete, filters, favorites, planner handoff)
│   ├── planner.js           # Julius Lim Jun Herng (Drag/drop logic, CRUD mock)
│   ├── carbon.js            # Chin Kin Hiung (CO2 math)
│   ├── weather.js           # Chin Kin Hiung (Weather API fetch)
│   └── favorites.js         # Ye Qinglan (Rendering saved items)
│
├── 📂 img/                  # All logos, icons, and placeholder images
│
├── index.html               # Landing Page (The entry point)
├── login.html               # Cha Zi Yu
├── register.html            # Cha Zi Yu
├── profile.html             # Lim Rui Xuan
├── dashboard.html           # Lim Rui Xuan
├── explore.html             # Tan Jin Xiang
├── planner.html             # Julius Lim Jun Herng
├── carbonr.html             # Chin Kin Hiung
├── weather.html             # Chin Kin Hiung
└── favorites.html           # Ye Qinglan
```

---
📂 Phase 2: Full-Stack Structure (The "Upgrade")
When Phase 2 begins, you don't throw away Phase 1. You simply drag all the files from the Phase 1 folder into a new public/ folder, and build your Node.js/MongoDB backend around it.
```
WIF2003-ECOTRAVEL-PLANNER/
│
├── 📂 public/               # <--- ENTIRE PHASE 1 GOES IN HERE
│   ├── css/
│   ├── js/
│   ├── img/
│   ├── index.html
│   └── ...all other HTML files
│
├── 📂 models/               # MongoDB Schemas
│   ├── User.js              # (Cha Zi Yu & Lim Rui Xuan's domain)
│   ├── Destination.js       # (Tan Jin Xiang's domain)
│   └── Trip.js              # (Julius Lim Jun Herng's domain)
│
├── 📂 routes/               # Express API Endpoints
│   ├── auth.js              # POST /api/login, POST /api/register
│   ├── users.js             # PUT /api/users/profile, DELETE /api/users
│   ├── destinations.js      # GET /api/destinations
│   └── trips.js             # POST /api/trips, GET /api/trips
│
├── .env                     # MongoDB Connection String & Secret Keys
├── package.json             # Dependencies (express, mongoose, bcrypt)
└── server.js                # Main backend file (Links public/ and routes/)
```
---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)  
- MongoDB Atlas account  

---

### Installation

Clone the repository:

```bash
git clone https://github.com/LIMRUIXUAN/letsgo.git
cd letsgo
```

---
Install dependencies:
```bash
npm install
```
---
### Environment Setup
Create a `.env` file in the root directory and add:
```env
MONGO_URL=your_mongodb_uri
PORT=3000
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Optional:
```env
NODE_ENV=production
```

### Running the Application

```bash
npm start
```

For development with live reload:
```bash
npm run dev
```

The application will be available at:
`http://localhost:3000`

---

### API Overview
Example endpoints:
* `POST /api/auth/register` – Create a new user account
* `POST /api/auth/login` – Log in an existing user
* `GET /api/users/profile/:email` – Retrieve a user profile
* `PUT /api/users/:email` – Update user profile details
* `PUT /api/users/:email/favorites` – Toggle a destination in favorites
* `GET /api/destinations` – Retrieve all eco destinations
* `GET /api/destinations/search/suggestions` – Retrieve search suggestions
* `GET /api/destinations/:id` – Retrieve one destination
* `GET /api/trips/:email` – Retrieve a user's itineraries
* `POST /api/trips` – Create a trip
* `PUT /api/trips/:id` – Update a trip
* `DELETE /api/trips/:id` – Delete a trip
* `GET /api/config/maps` – Retrieve the Google Maps API key for the planner page

---

## 🛠️ Technology Stack

### Front-End
- HTML5  
- CSS3  
- JavaScript  
- Bootstrap 5  

### Back-End
- Node.js  
- Express.js  

### Database
- MongoDB  
- Mongoose ODM  

---

Instructions: 

The system should provide the following functions: 
General module
Register new user account, user login to access the system, manage the sessions
Profile Management
view, update user details, delete a user account, update password
Travellers:
Eco-Friendly Travel options
Provide a directory of sustainable accommodations, restaurants, transportation options, and travel activities. Users can search the eco-friendly options for a city/town and add the option as favourite.
Green Itinerary Plan
Create a travel itinerary plan based on eco-friendly travel suggestions (include the date of visit). Low-impact travel destinations for a city/town can be recommended based on certain criteria (e.g. user interests, budget and weather forecast) 
Weather Forecast
Show weather forecast for a city (optional: may integrate with existing weather API that offers real-time weather information)
Carbon Footprint Calculator
Allow users to calculate the environmental impact of their travel plans. For example, according to the transportation and accommodation options, the system can provide insights into carbon emissions for flights, car travel, and accommodations, offer suggestions to offset emissions, such as carbon credit purchases.

Features and Member(s) in charge
