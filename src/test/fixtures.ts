import { db, mongoClient } from '../db/conn'
import { redisClient } from '../redis/conn'
import { User } from '../db/user'
import { Number } from '../db/number'

import { server } from '../app'


exports.mochaGlobalSetup = async function() {
  try {
    await Promise.all([
      redisClient.flushAll(),
      db.dropCollection('users'),
      db.dropCollection('numbers'),
    ])
    await Promise.all([
      User.init(),
      Number.init(),
    ])

  } catch (error) {
    console.log(error);
  }
};

exports.mochaGlobalTeardown = async function() {
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
};