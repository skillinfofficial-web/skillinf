import { MongoClient, Db, MongoClientOptions, ServerApiVersion } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// ── Connection pool — Atlas M0 hard limit: 500 connections across ALL clients ─
//
// PROBLEM: Next.js `next start` spawns one worker per CPU core. Each worker
// is a separate OS process — the global singleton is NOT shared between them.
// With N workers × maxPoolSize connections each, the total can easily hit 500.
// Additionally, Atlas keeps stale connections alive for ~10 min after a server
// restart, so old + new connections double-count during deploys.
//
// FIX STRATEGY:
//  1. maxPoolSize: 1  — absolute worst case: 1 conn per worker × N workers
//  2. minPoolSize: 0  — never hold idle connections open
//  3. maxIdleTimeMS: 5000 — aggressively release idle connections after 5 s
//  4. waitQueueTimeoutMS — requests queue for a free connection rather than
//     opening a new one, preventing connection storms under bursts
//  5. SIGTERM handler — actively close connection on process exit so Atlas
//     reclaims the slot immediately (not after the 10-min keepalive timeout)
const mongoOptions: MongoClientOptions = {
  maxPoolSize: 1,              // 1 connection per worker process — the minimum
  minPoolSize: 0,              // Release idle connections immediately
  maxIdleTimeMS: 5_000,        // Drop idle connection after 5 s
  waitQueueTimeoutMS: 10_000,  // Queue requests instead of opening new conns
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  serverSelectionTimeoutMS: 10_000,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
};

function buildClient(): MongoClient {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === 'your_mongodb_connection_string_here') {
    throw new Error('MONGODB_URI is not configured. Add it to backend/.env.local');
  }
  const client = new MongoClient(uri, mongoOptions);

  // ── Graceful shutdown: close connection immediately on process exit ──────
  // Without this, Atlas keeps the slot reserved for ~10 minutes after a
  // deploy/restart, causing the "double-count" spike you see in the graph.
  if (process.env.NODE_ENV === 'production') {
    const close = () => { client.close().catch(() => {}); };
    process.once('SIGTERM', close);
    process.once('SIGINT',  close);
    process.once('beforeExit', close);
  }

  return client;
}

function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    global._mongoClient      = buildClient();
    global._mongoClientPromise = global._mongoClient.connect();
  }
  return global._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const dbName = process.env.MONGODB_DATABASE || 'skillinf_course_data';
  const client = await getClientPromise();
  return client.db(dbName);
}
