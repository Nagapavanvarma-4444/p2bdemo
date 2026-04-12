import { MongoClient, MongoClientOptions } from 'mongodb';
import dns from 'dns';

/**
 * 🛠️ ADVANCED CONNECTIVITY PATCH
 * Bypasses common SSL/DNS issues in Node.js on local networks
 * 1. Forces IPv4 DNS resolution (Atlas SRV requires this on some networks)
 * 2. Uses Google/Cloudflare DNS as reliable fallbacks
 */
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if permissions block DNS server override
}

if (!process.env.MONGO_URI) {
  throw new Error('Please add your MONGO_URI to .env.local');
}

const uri = process.env.MONGO_URI;
const options: MongoClientOptions = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  // Force modern TLS settings for Atlas compatibility
  tls: true,
  retryWrites: true,
};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * 🔒 Database Connection State
 * Shared across the entire Next.js application
 */
export default clientPromise;
