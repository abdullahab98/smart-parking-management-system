import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ParkingLocation from '../models/ParkingLocation.js';
import { autoSeed } from './seedHelper.js';

dotenv.config();

let memServer = null;

export const connectDB = async () => {
  let mongoURI = process.env.MONGO_URI;

  try {
    if (!mongoURI || mongoURI === 'memory' || mongoURI.includes('testing-database.zkgz4.mongodb.net')) {
      throw new Error('Using local in-memory MongoDB');
    }

    const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 3000 });
    console.log(`[Database] MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database] Notice: ${error.message}. Initializing local in-memory MongoDB...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'smart_parking',
          launchTimeout: 60000
        }
      });
      mongoURI = memServer.getUri();
      const conn = await mongoose.connect(mongoURI);
      console.log(`[Database] In-memory MongoDB running and connected at: ${mongoURI}`);
    } catch (memErr) {
      console.error(`[Database] Failed to initialize in-memory MongoDB: ${memErr.message}`);
      process.exit(1);
    }
  }

  // Check if initial seeding is needed
  try {
    const locCount = await ParkingLocation.countDocuments();
    if (locCount === 0) {
      await autoSeed();
    }
  } catch (err) {
    console.warn('[Database] Seeding check failed:', err.message);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] MongoDB runtime error: ${err.message}`);
  });
};

export default connectDB;
