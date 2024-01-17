import express from 'express'
import passport from 'passport'
import { config } from 'dotenv';
config({ path: `./env/${process.env.NODE_ENV}.env` });

import session from 'express-session'
import cookieParser from 'cookie-parser'
import { redisStore } from './redis/conn'
import cors from 'cors';
import { authRouter, numberRouter } from './routes'

export const app = express();

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: true },
  store: redisStore,
}));

app.use(passport.authenticate('session'));

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());  // replaces deprecated bodyParser
app.use('/api/v0', authRouter);
app.use('/api/v0', numberRouter);

export const server = app.listen(process.env.API_PORT, () => {
  console.log(`Server is listening on port ${process.env.API_PORT}`);
})
