import { MongoClient, Db } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === 'your_mongodb_connection_string_here') {
    throw new Error(
      'MONGODB_URI is not configured. Add it to backend/.env.local'
    );
  }

  // Reuse connection in development (hot reload safe)
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }

  // In production, create a new client per cold start
  return new MongoClient(uri).connect();
}

export async function getDatabase(): Promise<Db> {
  const dbName = process.env.MONGODB_DATABASE || 'skillinf_course_data';
  const client = await getClientPromise();
  return client.db(dbName);
}
