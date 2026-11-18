// Usage: npm run seed:demo -w server  (uses MONGODB_URI from server/.env)
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { DEMO_USER, seedDemoUser } from './demoData.js';

if (env.MONGODB_URI === 'memory') {
  console.error('MONGODB_URI=memory is reset on every start; set SEED_DEMO=true instead.');
  process.exit(1);
}

await connectDb(env.MONGODB_URI);
await seedDemoUser();
console.log(`Demo account ready: ${DEMO_USER.email} / ${DEMO_USER.password}`);
await disconnectDb();
