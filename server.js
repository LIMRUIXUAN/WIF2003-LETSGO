const express = require('express');
const mongoose = require('mongoose');
const tripRoutes = require('./routes/trips');
require('dotenv').config();

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000 // stop trying after 5s
})
.then(() => console.log("MongoDB connected"))
.catch(err => {
  console.log("MongoDB failed try to resolve connection:");
  console.log(err.message);
});

// API Routes
app.use('/api', tripRoutes);

// Serve all static files from public/
app.use(express.static('public'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
