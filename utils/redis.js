/**
 * utils/redis.js
 * Serverless-safe Redis client wrapper.
 *
 * Features:
 *  - Reuses a single connection across invocations (important for Vercel).
 *  - Gracefully falls back to no-op functions if REDIS_URL is not set or
 *    the server is unreachable (so the app runs fine without Redis locally).
 *  - Exposes getCache, setCache, delCache, delCachePattern helpers.
 */

'use strict';

let client = null;
let isConnected = false;

async function getClient() {
  // Return existing connected client if available
  if (client && isConnected) return client;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    // No Redis URL configured – skip silently
    return null;
  }

  try {
    const { createClient } = require('redis');

    client = createClient({
      url: redisUrl,
      socket: {
        // Prevent hanging connections in serverless environments
        connectTimeout: 5000,
        reconnectStrategy: (attempts) => {
          // Give up after 3 failed reconnect attempts
          if (attempts >= 3) {
            console.warn('[Redis] Too many failed reconnect attempts. Disabling Redis cache.');
            isConnected = false;
            return false;
          }
          return Math.min(attempts * 200, 2000);
        }
      }
    });

    client.on('connect', () => {
      console.log('[Redis] Connected to Redis server.');
      isConnected = true;
    });

    client.on('ready', () => {
      isConnected = true;
    });

    client.on('error', (err) => {
      // Avoid crashing the server – log and disable
      console.warn('[Redis] Connection error:', err.message);
      isConnected = false;
    });

    client.on('end', () => {
      isConnected = false;
    });

    await client.connect();
    return client;
  } catch (err) {
    console.warn('[Redis] Failed to connect. Falling back to MongoDB direct queries.', err.message);
    client = null;
    isConnected = false;
    return null;
  }
}

/**
 * Retrieve a cached value by key.
 * Returns the parsed JS object/array, or null if not found / Redis offline.
 *
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function getCache(key) {
  try {
    const redis = await getClient();
    if (!redis) return null;
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Redis] getCache("${key}") failed:`, err.message);
    return null;
  }
}

/**
 * Store a value in Redis with an optional TTL.
 *
 * @param {string} key
 * @param {any} value   - Must be JSON-serialisable.
 * @param {number} [ttlSeconds=3600]
 */
async function setCache(key, value, ttlSeconds = 3600) {
  try {
    const redis = await getClient();
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.warn(`[Redis] setCache("${key}") failed:`, err.message);
  }
}

/**
 * Delete one or more exact cache keys.
 *
 * @param {...string} keys
 */
async function delCache(...keys) {
  if (!keys.length) return;
  try {
    const redis = await getClient();
    if (!redis) return;
    await redis.del(keys);
  } catch (err) {
    console.warn('[Redis] delCache failed:', err.message);
  }
}

/**
 * Delete all keys matching a glob-style pattern (e.g. "cache:destinations:*").
 * Uses SCAN to avoid blocking the server.
 *
 * @param {string} pattern
 */
async function delCachePattern(pattern) {
  try {
    const redis = await getClient();
    if (!redis) return;

    let cursor = 0;
    do {
      const reply = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length > 0) {
        await redis.del(reply.keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.warn(`[Redis] delCachePattern("${pattern}") failed:`, err.message);
  }
}

module.exports = { getCache, setCache, delCache, delCachePattern, getClient };
