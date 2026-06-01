require('dotenv').config();
const mongoose = require('mongoose');
const Destination = require('./models/Destination');
const seedData = require('./seed_data.json');

async function seedDatabase() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

  if (!mongoUri) {
    console.error('Error: Please set MONGO_URI or MONGO_URL in your .env file.');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear existing destinations
    console.log('Clearing existing destinations...');
    await Destination.deleteMany({});

    // Insert seed data
    console.log(`Inserting ${seedData.length} destinations...`);
    await Destination.insertMany(seedData);

    console.log('Database successfully seeded!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedDatabase();
