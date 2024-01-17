import express from 'express'
import crypto from 'crypto'
// import { Binary } from 'mongodb'
import passport from 'passport'
import { db } from '../db/conn'
import { Strategy } from 'passport-local'

// import fs from 'fs'

import type { IUser } from '../db/user'

const iterations = 310000
const keylen = 32
const digest = 'sha256'

/**
 * Setup passport-local strategy
 */

const strategy = new Strategy((username: string, password: string, cb) => {
  db.collection('users')
    .findOne({ username })
    .then(user => {
      if (!user) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      crypto.pbkdf2(password, user.salt.buffer, iterations, keylen, digest, function(err, hashedPassword) {
        if (err) return cb(err);
        if (!crypto.timingSafeEqual(user.hashedPassword.buffer, hashedPassword)) {
          return cb(null, false, { message: 'Incorrect username or password.' });
        }
        return cb(null, user);
      });
    })
    .catch(error => {
      return cb(error)
    })
})
passport.use(strategy)
passport.use('local', strategy)

passport.serializeUser(function(user: IUser, cb) {
  // console.log('serialize')
  // console.log(user)
  // fs.writeFile(`./data/serialize_${user.username}.json`, JSON.stringify(user), () => {})
  process.nextTick(function() {
    cb(null, { 
      id: user._id, 
      username: user.username,
    });
  });
});

passport.deserializeUser(function(user: IUser, cb) {
  // console.log('deserialize')
  // console.log(user)
  // fs.writeFile(`./data/deserialize_${user.username}.json`, JSON.stringify(user), () => {})
  process.nextTick(function() {
    return cb(null, user);
  });
});

/**
 * The routes
 */
const router = express.Router()

router.post('/register', async (req, res, next) => {
  if (!validatePassword(req.body.password)) {
    return res.status(409).json({
      message: 'Password must have at least 8 characters and consist of at least one letter, one number and one of the special symbols .,-!"§$%&/()=?*#'
    })
  }
  const salt = crypto.randomBytes(16);
  const hashedPassword = crypto.pbkdf2Sync(req.body.password, salt, iterations, keylen, digest);
  try {
    await db.collection('users').insertOne({
      username: req.body.username,
      hashedPassword,
      salt
    })
    return res.status(201).json({ message: 'Successfully registered!' })
  } catch (error) {
    if (error.code === 11000) { // E11000 duplicate key error collection
      return res.status(409).json({
        message: 'Username already taken!'
      })
    }
    return next(error)
  }
  next();
})

router.post('/login', passport.authenticate('local'), (req, res, next) => {
  res.status(200).json({ message: 'Successfully logged in!' })
})

export default router

/**
 * Some helper functions
 */
function validatePassword(password: string): boolean {
  return !!(password.length >= 8) 
    && !!(password.match(/[a-zA-Z]/))
    && !!(password.match(/[.,+\-!"§$%&/()=?*#]/))
    && !!(password.match(/[0-9]/))
}