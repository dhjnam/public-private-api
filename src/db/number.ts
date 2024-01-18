import { config } from 'dotenv';
config({ path: `./env/${process.env.NODE_ENV}.env` });

import { db } from './conn';

import path from 'path';
import fs from 'fs';

const root = path.resolve(__dirname, '..', '..');

const jsonSchema = JSON.parse(fs.readFileSync(
  path.resolve(root, 'src', 'db', 'schemas', 'number.json'),
  'utf-8'
));

export interface IPrivatePublic {
  private: number,
  public: number,
}

export interface INumber {
  rsa?: IPrivatePublic,
  ec?: IPrivatePublic,
}

export class Number {

  static async init() {
    const collection = await db.createCollection<INumber>('numbers', {  
      validator: {
        $jsonSchema: jsonSchema
      }
    });

    await collection.createIndex({ user: 1 }, { unique: true });
  }

}
