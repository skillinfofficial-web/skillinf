import { MongoClient, Db, MongoClientOptions, ServerApiVersion } from 'mongodb';

// ── Connection pool ──────────────────────────────────────────────────────────
// Module-level singleton — works in both Node.js (Vercel) and
// Cloudflare Workers (which do NOT have a Node.js `global` object).
// One client per Worker isolate; Cloudflare reuses isolates across requests
// so this effectively acts as a connection pool without the Node.js global trick.

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
    deprecationErrors: false,   // Don't throw on deprecated ops
  },
};

// Module-level cache — survives across requests in the same isolate/process
let _clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === 'your_mongodb_connection_string_here') {
    throw new Error('MONGODB_URI is not configured. Add it to Cloudflare Worker secrets.');
  }
  if (!_clientPromise) {
    const client = new MongoClient(uri, mongoOptions);
    _clientPromise = client.connect();
  }
  return _clientPromise;
}

export async function getDatabase(): Promise<Db> {
  const dbName = process.env.MONGODB_DATABASE || 'skillinf_course_data';
  const client = await getClientPromise();
  return client.db(dbName);
}
