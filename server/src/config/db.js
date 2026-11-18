import mongoose from 'mongoose';

let memoryServer;

/**
 * MONGODB_URI=memory → geliştirme için bellek içi MongoDB (kurulum gerekmez, veri kalıcı değil).
 * Aksi halde verilen URI'ye (yerel MongoDB / Atlas) bağlanır.
 */
export async function connectDb(uri) {
  mongoose.set('strictQuery', true);

  let target = uri;
  if (uri === 'memory') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    target = memoryServer.getUri('spendfetti');
    console.log('🧠 Bellek içi MongoDB kullanılıyor (veriler yeniden başlatınca silinir)');
  }

  await mongoose.connect(target, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
  await memoryServer?.stop();
}
