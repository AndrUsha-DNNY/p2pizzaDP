
import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // У режимі розробки використовуємо глобальну змінну, щоб не переповнювати з'єднання
  // Fix: Use globalThis instead of global to avoid TypeScript errors in environments where 'global' is not defined.
  let globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // У продакшені створюємо нове з'єднання
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
