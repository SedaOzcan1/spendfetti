import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { seedDefaultCategories } from './seed/defaultCategories.js';
import { DEMO_USER, seedDemoUser } from './seed/demoData.js';

async function main() {
  await connectDb(env.MONGODB_URI);
  await seedDefaultCategories();
  if (env.SEED_DEMO) {
    await seedDemoUser();
    console.log(`🧪 Demo account: ${DEMO_USER.email} / ${DEMO_USER.password}`);
  }
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`🎉 Spendfetti API listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
