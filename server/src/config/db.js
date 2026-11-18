import mongoose from 'mongoose';

let memoryServer;

/**
 * MONGODB_URI=memory → in-memory MongoDB for development (no install needed, data is not persisted).
 * Otherwise connects to the given URI (local MongoDB / Atlas).
 */
export async function connectDb(uri) {
  mongoose.set('strictQuery', true);

  let target = uri;
  if (uri === 'memory') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    target = memoryServer.getUri('spendfetti');
    console.log('🧠 Using in-memory MongoDB (data is wiped on restart)');
  }

  await mongoose.connect(target, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
  await memoryServer?.stop();
}
