# WIF2003 – EcoTravel Planner

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

### Advanced Search Interface
- Real-time filtering of destinations using client-side JavaScript  
- Displays recent searches and popular eco-destinations  
- Reduces server load by minimizing unnecessary requests  

### Interactive Destination Cards
- Flip-card design to compare standard vs eco-friendly travel data  
- Displays sustainability certifications such as LEED and Green Key  
- Simplifies complex environmental information for users  

### Favorites Management
- Save destinations asynchronously using Fetch API  
- Data stored in MongoDB without page reload  
- Generates quick suggestions based on saved items  

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
│   ├── explore.css          # Tan Jin Xiang (Eco-Options grid & flip cards)
│   ├── planner.css          # Julius Lim Jun Herng (Calendar drag-and-drop)
│   └── carbon.css           # Chin Kin Hiung (Charts and calculator UI)
│
├── 📂 js/
│   ├── app.js               # Shared logic (Nav bar toggle, global helpers)
│   ├── auth.js              # Cha Zi Yu (Form validation, LocalStorage mock sessions)
│   ├── profile.js           # Lim Rui Xuan (Profile edit logic, mock soft delete)
│   ├── explore.js           # Tan Jin Xiang (Search, filter logic, flip card logic)
│   ├── planner.js           # Julius Lim Jun Herng (Drag/drop logic, CRUD mock)
│   ├── carbon_weather.js    # Chin Kin Hiung (Weather API fetch, CO2 math)
│   └── favorites.js         # Ye Qinglan (Rendering saved items)
│
├── 📂 img/                  # All logos, icons, and placeholder images
│
├── index.html               # Landing Page (The entry point)
├── login.html               # Cha Zi Yu
├── register.html            # Cha Zi Yu
├── profile.html             # Lim Rui Xuan
├── explore.html             # Tan Jin Xiang
├── planner.html             # Julius Lim Jun Herng
├── carbon-weather.html      # Chin Kin Hiung
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
git clone https://github.com/LIMRUIXUAN/WIF2003-EcoTravel-Planner.git
cd WIF2003-EcoTravel-Planner
```

---
* BELOW PART IS FOR Phrase 2
* Install dependencies:
```bash
npm install
```
---
### Environment Setup
Create a `.env` file in the root directory and add:
```env
MONGO_URI=your_mongodb_uri
PORT=3000
```

### Running the Application

```bash
npm start
```
The application will be available at:
`http://localhost:3000`

---

### API Overview
Example endpoint:
* `GET /api/spots` – Retrieve available destinations
* `POST /api/favorites` – Save a destination
* `GET /api/trips` – Retrieve user itineraries

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
