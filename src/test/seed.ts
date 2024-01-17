import mongodb from 'mongodb'
import { Binary } from 'mongodb'
import { db } from '../db/conn'

export default async function seed() {
  
  // await db.collection('users').insertMany([
  //   {
  //     "username": "anton",
  //     "password": Binary.createFromBase64('2MF0ugZUI1uk/jGnpb/iyfKMTWmh8p1vwkP/ZzpXT0A=', 0),
  //     "salt": Binary.createFromBase64('8tMEdms57hQJIQMKqdxwJQ==', 0)
  //   },{
  //     "username": "berta",
  //     "password": Binary.createFromBase64('9aUM3nVbm0eXRvYOmQhjF8DTtXP5m5MBMbR3/+50dg8=', 0),
  //     "salt": Binary.createFromBase64('GJbg1oqjO5xRIglPI6JdAA==', 0)
  //   }
  // ])
}