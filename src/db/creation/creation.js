const { exec, spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs/promises');
const { promisify } = require('util');

const { MongoClient } = require('mongodb');

const root = path.resolve(__dirname, '..', '..', '..')
const env = process.env.NODE_ENV

require('dotenv').config({
  path: path.resolve(root, 'env', `${env}.env`)
})

const wait = promisify(setTimeout)
const mongodbPath = path.resolve(root, process.env.MONGO_PATH);  
const configFilePath = path.resolve(root, process.env.MONGO_CONFIG);
const port = process.env.MONGO_PORT

const { 
  MONGO_HOST, 
  MONGO_PORT, 
  MONGO_DB,
  MONGO_USER, 
  MONGO_PWD, 
  MONGO_ADMIN_USER,
  MONGO_ADMIN_PWD,
} = process.env;

const uri = `mongodb://${MONGO_HOST}:${MONGO_PORT}`;

(async () => {
  // (1.0) start mongod without config
  const mongoNoConfProc = mongoProcess([
    '--dbpath', mongodbPath,
    '--port', port,
  ])
  var s = 2000
  await wait(s)
  // (1.1) connect to mongo and define admin user and api user
  // (1.2) close connection
  // (1.3) shutdown mongoproces
  
  // exec(`mongosh --nodb \
  //   --file \
  //   ${path.resolve(__dirname, 'createUsers.js')}`, 
  //   (err, stdout, stdin) => {
  //     // console.log(`ERROR:\n\n${err}`);
  //     // console.log(`STD_OUT:\n\n${stdout}`);
  //     // console.log(`STD_IN:\n\n${stdin}`);
  //     mongoNoConfProc.kill();
  //   }
  // )
  
  const mongoshCreateUsersProc = configureUsers([
    `--nodb`,
    `mongodb://${MONGO_HOST}:${MONGO_PORT}`,
    '--file', path.resolve(__dirname, 'createUsers.js'),
    // '--bind_ip', '127.0.0.1',
  ]);
  // await wait(s)
  // mongoshCreateUsersProc.kill();
  // mongoshCreateUsersProc.stdin.end();


  await wait(s)
  mongoNoConfProc.kill();
  // mongoNoConfProc.stdin.end();

  // await wait(s)
})();




// (2.0) start mongod with config
// (2.1) connect to mongo as api user, this time with restrictions from mongodb config file `...mongodb.conf`
// (2.2) create private-public db
// (2.3) define schemas for user and numbers
// (2.4) close connection
// (2.5) shutdown mongod with config

function configureUsers(args) {

  const proc = spawn('mongosh', args)

  proc.stdout.on('data', (data) => {
    console.log(`mongosh stdout: ${data}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`mongosh stderr: ${data}`);
  });

  proc.on('close', (code) => {
    console.log(`mongosh process exited with code ${code}`);
  });

  proc.on('error', (err) => {
    console.error(`Error starting mongosh process: ${err.message}`);
  });

  return proc
}

function mongoProcess(args) {

  const proc = spawn('mongod', args);
  
  proc.stdout.on('data', (data) => {
    console.log(`MongoDB stdout: ${data}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`MongoDB stderr: ${data}`);
  });
  
  proc.on('close', (code) => {
    console.log(`MongoDB process exited with code ${code}`);
  });
  
  proc.on('error', (err) => {
    console.error(`Error starting MongoDB process: ${err.message}`);
  });

  return proc

}
