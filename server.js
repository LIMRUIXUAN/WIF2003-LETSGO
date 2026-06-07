require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const destinationRoutes = require('./routes/destinations');
const tripRoutes = require('./routes/trips');
const userRoutes = require('./routes/users');

const { getClient: getRedisClient } = require('./utils/redis');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const isDev = !isProduction;
let databaseConnectionPromise = null;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));

const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  const allowedOrigins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin is not allowed by CORS.'));
    }
  }));
}

function setupLiveReload() {
  try {
    const livereload = require('livereload');
    const connectLiveReload = require('connect-livereload');
    const liveReloadServer = livereload.createServer({
      exts: ['html', 'css', 'js'],
      delay: 100,
      noListen: true
    });

    liveReloadServer.on('error', (error) => {
      console.warn('Live reload disabled:', error.message);
    });

    liveReloadServer.listen(() => {
      liveReloadServer.watch(path.join(__dirname, 'public'));
    });

    app.use(connectLiveReload());
  } catch (error) {
    console.warn('Live reload disabled:', error.message);
  }
}

if (isDev && require.main === module) {
  setupLiveReload();
}

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

const tripLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many trip requests. Please try again later.'
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

  if (!mongoUri) {
    console.warn('MongoDB not connected: set MONGO_URI in your environment.');
    return null;
  }

  mongoose.set('strictQuery', true);
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (databaseConnectionPromise) {
    return databaseConnectionPromise;
  }

  databaseConnectionPromise = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    bufferCommands: false
  }).catch((error) => {
    databaseConnectionPromise = null;
    throw error;
  });

  await databaseConnectionPromise;
  console.log('MongoDB connected');
  return mongoose.connection;
}

async function requireDatabaseConnection(_req, res, next) {
  try {
    const connection = await connectToDatabase();
    if (!connection || mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is not configured or not connected.'
      });
    }
    return next();
  } catch (error) {
    console.error('Database unavailable for API request:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Database is temporarily unavailable.'
    });
  }
}

const { requireAuth } = require('./middleware/auth');

app.get('/api/config/maps', requireAuth, (_req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || '' });
});

app.use('/api/auth', requireDatabaseConnection, authRoutes);
app.use('/api/users', requireDatabaseConnection, userLimiter, userRoutes);
app.use('/api/trips', requireDatabaseConnection, tripLimiter, tripRoutes);
app.use('/api/destinations', requireDatabaseConnection, destinationRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((req, res) => {
  res.status(404).send('Not found');
});

app.use((err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error('Unhandled server error:', err.message);
  return res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Internal server error.' : err.message
  });
});

async function startServer() {
  const port = Number(process.env.PORT || process.env.port) || 3000;

  // Fail fast if critical env vars are missing.
  if (!process.env.JWT_SECRET && !process.env.AUTH_TOKEN_SECRET && !process.env.SESSION_SECRET) {
    console.error('FATAL: JWT_SECRET is not set in environment. Add it to your .env file.');
    process.exit(1);
  }

  try {
    await connectToDatabase();

    // Copy generated images to public/images
    const fs = require('fs');
    const imagesToCopy = [
      { src: "C:\\Users\\PC\\.gemini\\antigravity-ide\\brain\\79c6f94a-e6cc-4eeb-af64-6dd2d6d0cca3\\langkawi_mangroves_slide_1780580662130.png", dest: path.join(__dirname, "public", "images", "langkawi_mangroves_slide.png") },
      { src: "C:\\Users\\PC\\.gemini\\antigravity-ide\\brain\\79c6f94a-e6cc-4eeb-af64-6dd2d6d0cca3\\borneo_rainforest_slide_1780580680487.png", dest: path.join(__dirname, "public", "images", "borneo_rainforest_slide.png") },
      { src: "C:\\Users\\PC\\.gemini\\antigravity-ide\\brain\\79c6f94a-e6cc-4eeb-af64-6dd2d6d0cca3\\cameron_highlands_slide_1780580701877.png", dest: path.join(__dirname, "public", "images", "cameron_highlands_slide.png") }
    ];
    for (const img of imagesToCopy) {
      if (fs.existsSync(img.src)) {
        try {
          fs.copyFileSync(img.src, img.dest);
          console.log(`Copied image to ${img.dest}`);
        } catch (e) {
          console.error(`Failed to copy image: ${e.message}`);
        }
      } else {
        console.warn(`Source image does not exist: ${img.src}`);
      }
    }

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port} (${isDev ? 'dev with live reload' : 'production'})`);
      // Warm Redis in the background. Requests still fall back to MongoDB if Redis is unavailable.
      getRedisClient().catch(err => console.error('Redis connection failed during background warm-up:', err.message));
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
} else {
  // Serverless environments (like Vercel) import the file and manage server lifecycle.
  // We must trigger database and cache connections immediately on function cold start.
  connectToDatabase().catch(err => console.error('Database connection failed on cold start:', err.message));
  getRedisClient().catch(err => console.error('Redis connection failed on cold start:', err.message));
}

module.exports = app;
