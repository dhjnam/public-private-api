import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV}` });

import RedisStore from 'connect-redis'
import { createClient } from 'redis'

export const redisClient = createClient({
  url: process.env.REDIS_URL
});
redisClient.connect()
  .catch(console.error);

export const redisStore = new RedisStore({
  client: redisClient,
  prefix: "pp:",
})
