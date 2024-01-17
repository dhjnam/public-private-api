/**
 * Initialize database
 */

import { User } from './user';
import { Number } from './number';
import { db, mongoClient } from './conn';

async function reset() {
  await drop();
  await init();
};

async function drop() {
  await Promise.all([
    db.dropCollection('users'),
    db.dropCollection('numbers'),
  ])
};

async function init() {
  await Promise.all([
    User.init(),
    Number.init(),
  ]);
};

(() => {
  reset().then(() => {
    mongoClient.close().then(() => {
      console.log('connection closed')
    })
  }).catch(err => {
    console.error(err)
  });
})();