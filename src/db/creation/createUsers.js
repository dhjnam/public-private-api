const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..', '..', '..');

const userSchema = JSON.parse(fs.readFileSync(
  path.resolve(root, 'src', 'db', 'schemas', 'user.json')
));
const numberSchema = JSON.parse(fs.readFileSync(
  path.resolve(root, 'src', 'db', 'schemas', 'number.json')
));

require('dotenv').config({
  path: path.join(root, 'env', `${process.env.NODE_ENV}.env`)
});

const { 
  MONGO_HOST, 
  MONGO_PORT, 
  MONGO_DB,
  MONGO_USER, 
  MONGO_PWD, 
  MONGO_ADMIN_USER,
  MONGO_ADMIN_PWD,
} = process.env;

db = connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/admin`);

db.createUser({
  user: MONGO_ADMIN_USER,
  pwd: MONGO_ADMIN_PWD,
  roles: [{
    role: 'root',
    db: 'admin'
  }]
});

db = connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`);

db.createUser({
  user: MONGO_USER,
  pwd: MONGO_PWD,
  roles: [{
    role: 'readWrite',
    db: MONGO_DB
  }]
})

db.createCollection("users", {
  validator: {
    $jsonSchema: userSchema
  }
});
db.createCollection("numbers", {
  validator: {
    $jsonSchema: numberSchema
  }
});
