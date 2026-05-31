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

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const isDev = !isProduction;

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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const { requireAuth } = require('./middleware/auth');

app.get('/api/config/maps', requireAuth, (_req, res) => {
  res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || '' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/destinations', destinationRoutes);

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

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;

  if (!mongoUri) {
    console.warn('MongoDB not connected: set MONGO_URI in your environment.');
    return null;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected');
  return mongoose.connection;
}

async function startServer() {
  const port = Number(process.env.PORT || process.env.port) || 3000;

  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port} (${isDev ? 'dev with live reload' : 'production'})`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  connectToDatabase,
  startServer
};
