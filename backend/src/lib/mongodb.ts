import { MongoClient, Db, MongoClientOptions, ServerApiVersion } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// ── Connection pool tuned for MongoDB Atlas M0 (500-connection limit) ────────
// M0 free tier: max 500 connections total across ALL clients.
// Rule of thumb: maxPoolSize × (number of serverless instances) must stay
// well under 500. With 2-4 instances and maxPoolSize=3 that is 6-12 total.
// minPoolSize=0 means idle connections are released rather than held open,
// which is the single most effective fix for the "connections near limit"
// Atlas alert on serverless / Next.js deployments.
const mongoOptions: MongoClientOptions = {
  maxPoolSize: 3,              // Max connections per process / serverless worker
  minPoolSize: 0,              // Release idle connections — do NOT keep any warm
  maxIdleTimeMS: 10000,        // Close a connection after 10 s of idle time
  connectTimeoutMS: 10000,     // Fail fast if Atlas is unreachable
  socketTimeoutMS: 45000,      // Abort stalled in-flight operations after 45 s
  serverSelectionTimeoutMS: 10000,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,             // Allow non-stable commands (aggregation helpers)
    deprecationErrors: true,
  },
};

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === 'your_mongodb_connection_string_here') {
    throw new Error(
      'MONGODB_URI is not configured. Add it to backend/.env.local'
    );
  }

  // Single cached promise shared across the entire Node.js process lifetime.
  // ─ Development  : survives hot-module reloads (global persists on the VM).
  // ─ Production   : one pool per serverless worker; workers share nothing,
  //   so the pool stays small and Atlas connection counts stay low.
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, mongoOptions);
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const dbName = process.env.MONGODB_DATABASE || 'skillinf_course_data';
  const client = await getClientPromise();
  return client.db(dbName);
}
