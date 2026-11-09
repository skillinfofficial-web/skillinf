import { MongoClient, Db, MongoClientOptions, ServerApiVersion } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// ── Connection pool — Atlas M0 hard limit: 500 connections across ALL clients ─
//
// CRITICAL: In production this file runs inside Vercel serverless functions.
// Each function invocation runs in the same Node.js process for its lifetime,
// but the global IS reused across concurrent requests in the same instance.
// The old code did `new MongoClient(uri).connect()` on every production call —
// that opened a fresh pool (default maxPoolSize=100!) on EVERY request, which
// is why connections spiked to exactly 500 on any burst of traffic.
//
// Fix: always use the global singleton, identical pattern to the backend.
// maxPoolSize=1 means at most 1 connection per Vercel function instance.
const mongoOptions: MongoClientOptions = {
  maxPoolSize: 1,
  minPoolSize: 0,              // Release idle connections immediately
  maxIdleTimeMS: 5_000,
  waitQueueTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  serverSelectionTimeoutMS: 10_000,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: false,   // Don't throw on deprecated ops — some driver helpers use them
  },
};

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === 'your_mongodb_connection_string_here') {
    throw new Error('MONGODB_URI is not configured. Add it to frontend/.env.local');
  }
  // Always reuse the cached client — both in development AND production.
  // Previously the production branch created a new MongoClient on every call,
  // which was the direct cause of the Atlas "500/500 connections" alert.
  if (!global._mongoClientPromise) {
    global._mongoClient        = new MongoClient(uri, mongoOptions);
    global._mongoClientPromise = global._mongoClient.connect();
  }
  return global._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const dbName = process.env.MONGODB_DATABASE || 'skillinf_course_data';
  const client = await getClientPromise();
  return client.db(dbName);
}
