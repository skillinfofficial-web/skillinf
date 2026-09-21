import { MongoClient, Db, MongoClientOptions } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const mongoOptions: MongoClientOptions = {
  maxPoolSize: 5,              // Cap connections per serverless instance
  minPoolSize: 1,              // Keep at least 1 connection warm
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === 'your_mongodb_connection_string_here') {
    throw new Error(
      'MONGODB_URI is not configured. Add it to backend/.env.local'
    );
  }

  // In both development and production: reuse the global cached promise.
  // - Development: global persists across hot reloads.
  // - Production (serverless): global persists for the lifetime of the
  //   function instance, so concurrent invocations share one connection pool
  //   instead of each opening fresh connections.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri, mongoOptions).connect();
  }
  return global._mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const dbName = process.env.MONGODB_DATABASE || 'skillinf_course_data';
  const client = await getClientPromise();
  return client.db(dbName);
}
