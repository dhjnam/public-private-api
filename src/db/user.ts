import { config } from 'dotenv';
config({ path: `./env/${process.env.NODE_ENV}.env` });

import mongodb from 'mongodb';
import { db } from './conn';

import path from 'path';
import fs from 'fs';

const root = path.resolve(__dirname, '..', '..');

const jsonSchema = JSON.parse(fs.readFileSync(
  path.resolve(root, 'src', 'db', 'schemas', 'user.json'),
  'utf-8'
));

export interface IUser {
  _id: mongodb.ObjectId,
  username: string,
  hashedPassword: any, // dhjn: must figure out appropriate type!
  salt: any, // dhjn: see hashedPassword 
}

export class User {

  static async init() {
    const collection = await db.createCollection<IUser>('users', {  
      validator: {
        $jsonSchema: jsonSchema
      }
    });

    await collection.createIndex({ username: 1 }, { unique: true });
  }

}
