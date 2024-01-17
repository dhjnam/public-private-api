import mongodb from 'mongodb'
import { db, mongoClient } from '../db/conn'
import { redisClient } from '../redis/conn'
import seed from './seed'
import { User } from '../db/user'

import { app, server } from '../app'


exports.mochaHooks = {
  async beforeAll() {
    try {
      await Promise.all([
        db.dropCollection('users'),
        db.dropCollection('numbers'),
      ])
      await Promise.all([
        User.init(),
        db.createCollection('numbers'),
      ])
      await seed();
  
    } catch (error) {
      console.log(error);
    }
  },
  async afterAll() {
    try {
      // await Promise.all([
      //   db.dropCollection('users'),
      //   db.dropCollection('numbers'),
      // ])
      server.close(() => {
        console.log('Server shut down')
      });
      mongoClient.close().then(() => {
        console.log('Connection to Mongodb closed')
      })
      redisClient.quit().then(() => {
        console.log('Connection to Redis closed')
      })
    } catch (error) {
      console.log(error);
    }
  }
};
