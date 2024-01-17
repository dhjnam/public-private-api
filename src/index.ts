import { config } from 'dotenv';
config({ path: `./env/${process.env.NODE_ENV}.env` });

import { app, server } from './app'
import { mongoClient } from './db/conn'
import { redisClient } from './redis/conn'

/**
 * Graceful exit
 */

process.on('beforeExit', (code) => {
  console.log(`... before exit event. Code: ${code}`);
})
process.on('exit', (code) => {
  console.log(`... exit event. Exit code: ${code}`);
  console.log();
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received.');
  mongoClient.close().then((res) => {
    console.log('Connection to Mongodb closed');
  })
  redisClient.quit().then(() => {
    console.log('Connection to Redis closed');
  })
  server.close(() => {
    console.log('Server shut down');
  });
})
