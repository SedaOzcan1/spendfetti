// Usage: npm run seed:events -w server  (uses MONGODB_URI from server/.env)
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { seedEventsIfNeeded } from './sampleEvents.js';

await connectDb(env.MONGODB_URI);
const count = await seedEventsIfNeeded({ force: true });
console.log(`Seeded ${count} sample events`);
await disconnectDb();
