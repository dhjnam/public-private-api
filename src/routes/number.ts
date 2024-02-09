import express from 'express'
import { db } from '../db/conn'
import { ObjectId } from 'mongodb'

import { promisify } from 'util'
import crypto from 'crypto';

import type { IUser } from '../db/user'

const generateKeyPair = promisify(crypto.generateKeyPair)
const generateKeyPairSync = crypto.generateKeyPairSync

const generatePrivatePublic = function(method, options?) {
  let opts = options || {};
  let passphrase = opts.passphrase
  if (method === 'rsa') {
    const n = process.env.NODE_ENV === 'prod' ? 2048 : 512
    opts.keySize = opts.keySize || n
    opts.modulusLength = opts.modulusLength || n
  } else if (method === 'ec') {
    // Can choose other curves like 'secp384r1' or 'secp521r1'
    opts.namedCurve = opts.namedCurve || 'secp256k1'
  } else {
    return null
  }
  const { publicKey, privateKey } = generateKeyPairSync(method, {
    ...opts,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem', passphrase }
  });
  return { privateKey, publicKey }
}


const router = express.Router()

router.get(
  '/private/:method', 
  // passport.authenticate('session'), 
  async (req: any, res, next) => {
    if (req.isUnauthenticated()) {
      return res.status(401).json({
        message: 'Not authorized'
      });
    }
    let method = req.params.method
    try {
      const number = await db.collection('numbers').findOne({
        user: new ObjectId(req.user.id),
      })
      if (number && number[method]) {
        return res.status(200).send({
          privateKey: number[method].private,
          publicKey: number[method].public
        });
      } else {
        return res.status(204).json({ message: 'No private / public key pair generated yet.' })
      }
    } catch (error) {
      console.error(error)
      return next(error)
    }
  }
)

router.get('/public/:method', async (req, res, next) => {
  // req.user: logged in user
  // req.query.user: user of requested public key
  let user;
  if (req.query && req.query.user) { // if user is specified
    user = req.query.user
  } else if (req.isAuthenticated()) { // if I am logged in
    const me = req.user as IUser
    user = me.username
  } else { // return 404
    return res
      .status(404)
      .send({ message: "Not logged in and no user specified" })
  }
  try {
    const method = req.params.method
    const id = await db.collection('users').findOne({
      username: user
    })
    if (!id) {
      return res
        .status(404)
        .send({ message: `The specified user ${user} does not exist` })
    }
    const number = await db.collection('numbers').findOne({
      user: id._id
    })
    if (number && number[method]) {
      return res
        .status(200)
        .send({
          privateKey: number[method].private,
          publicKey: number[method].public
        })
    }
    return res
      .status(204)
      .send({ message: "User has not generated any keypair yet" })
  } catch (error) {
    console.log(error)
    return next(error)
  }
});

router.post(
  '/generate/:method', 
  // passport.authenticate('session'),
  async (req: any, res, next) => {
    if (req.isUnauthenticated()) {
      return res.status(401).json({
        message: 'Not authorized'
      });
    }
    try {
      let method = req.params.method
      const number = await db.collection('numbers').findOne({ 
        user: new ObjectId(req.user.id) 
      })
      if (number && number[method]) {        
        return res.status(409).json({ 
          message: `Private / public key pair already exists for method ${method}`,
          private: number[method].private, 
          public: number[method].public, 
        })
      } else {
        
        const keyPairResult = generatePrivatePublic(method)
        if (keyPairResult === null) {
          return res.status(400).json({ message: `Invalid method: ${method}` })
        }
        let { privateKey, publicKey } = keyPairResult

        try {
          await db.collection('numbers').updateOne({
            user: new ObjectId(req.user.id)
          }, {
            $set: {
              [method]: {
                private: privateKey,
                public: publicKey
              }
            }
          }, {
            upsert: true
          })
          return res.status(201).json({
            message: `Successfully generated private / public key pair for method ${method}`,
            privateKey,
            publicKey, 
          })
        } catch (error) {
          console.error(error);
          res.status(400).json({
            message: `Invalid method: ${method}`
          })
          return next(error);
        }
      }
    } catch (error) {
      console.log(error)
      res.status(500).json({
        message: 'Internal server error'
      })
      return next(error);
    }
  }
)

export default router
