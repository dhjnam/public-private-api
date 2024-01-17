const path = require('path');
const fs = require('fs/promises');

const root = path.resolve(__dirname, '..', '..', '..');

require('dotenv').config({
  path: path.resolve(root, 'env', `${process.env.NODE_ENV}.env`)
});

const { MongoClient, MongoGridFSChunkError } = require('mongodb');
const { 
  MONGO_HOST, 
  MONGO_PORT, 
  MONGO_DB,
  MONGO_USER, 
  MONGO_PWD, 
  MONGO_ADMIN_USER,
  MONGO_ADMIN_PWD,
} = process.env;

/**
 * If a mongserver is running, we assume it is running with _security enabled_:
 * The <env>.mongodb.conf files have security enabled and mongodb instances are launched by
 * `npm run mongodb:<env>:up` which has a `--config <env>.mongodb.conf` flag set!
 */
const uri = `mongodb://${MONGO_ADMIN_USER}:${MONGO_ADMIN_PWD}@${MONGO_HOST}:${MONGO_PORT}`
const mongoPath = path.resolve(root, process.env.MONGO_PATH);

async function stopMongoServerIfRunning(uri) {

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 1000
  });
  // serverSelectionTimeoutMS must be set, because it is not guaranteed that the mongod server is running at all.

  try {
    const conn = await client.connect();
    const db = client.db('admin');
    
    // Issue the shutdown command
    await db.command({ shutdown: 1 });

    console.log('MongoDB server shutdown initiated.');
  } catch (error) {
    if (error instanceof Error && error.name === 'MongoNetworkError') {
      console.log('MongoDB server is shutting down gracefully.');
      console.log(error)
    } else {
      console.error('Error during MongoDB server shutdown:', error);
    }
  } finally {
    await client.close();
  }
};

async function emptyMongoDbPath(pathToMongoDb) {
  try {
    const rms = []
    // list of files in folder `pathToMongoDb`
    const files = await fs.readdir(pathToMongoDb);

    for (const file of files) {
      const filePath = path.join(pathToMongoDb, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        // trigger recursion
        await emptyMongoDbPath(filePath);
        rms.push(fs.rmdir(filePath));
      } else {
        rms.push(fs.unlink(filePath));
      }
      console.log(`Queued to remove: ${filePath}`);
    }

    await Promise.all(rms);

    console.log(`All files removed from: ${pathToMongoDb}`);

    return rms;
  } catch (error) {
    console.error(`Error removing files: ${error.message}`);
  }
};



(async () => {
  await stopMongoServerIfRunning(uri);
  console.time('foo');
  await emptyMongoDbPath(mongoPath);
  console.timeEnd('foo');
})();
