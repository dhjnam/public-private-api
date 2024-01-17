import { config } from 'dotenv';
config({ path: `./env/${process.env.NODE_ENV}.env` });

import { MongoClient } from 'mongodb';

const { MONGO_HOST, MONGO_PORT, MONGO_USER, MONGO_PWD, MONGO_DB } = process.env
const uri = `mongodb://${MONGO_USER}:${MONGO_PWD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`

export const mongoClient = new MongoClient(uri);
mongoClient.connect();

export const db = mongoClient.db(process.env.MONGO_NAME);
