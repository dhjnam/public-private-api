import { getCookieValueByName } from '../util/cookies'

import { db, mongoClient } from '../db/conn'
import supertest from 'supertest'
import { app, server } from '../app'
import chai from 'chai'

chai.should()

const request = supertest(app);
const url = '/api/v0'

describe('POST /register', function() {
  
  beforeEach(function() {})

  afterEach(function() {})

  it('201: username not already taken', async function() {
    const res = await request.post(`${url}/register`)
      .send({ username: 'john', password: '1234abcd$' })
    res.status.should.equal(201)
  })

  it('409: username already taken', function(done) {
    request.post(`${url}/register`)
      .send({ username: 'john', password: '1234abcd$' })
      .expect(409)
      .end(function(err, res) {
        if (err) return done(err);
        res.body.message.should.equal('Username already taken!')
        return done();
      });
  })

  it('409: password too short', function(done) {
    request.post(`${url}/register`)
      .send({ username: 'jane', password: '123abc$' })
      .expect(409)
      .end(function(err, res) {
        if (err) return done(err);
        return done();
      });
  })

  it('409: password character requirement not satisfied', async function() {
    const [ noSpecial, noLetter, noNumber ] = await Promise.all([
      request
        .post(`${url}/register`)
        .send({ username: 'jane', password: 'abcd1234' }),
      request
        .post(`${url}/register`)
        .send({ username: 'jane', password: '1234.+-*,' }),
      request
        .post(`${url}/register`)
        .send({ username: 'jane', password: 'abcd.+-*,' }),
    ])
    noSpecial.status.should.equal(409)
    noLetter.status.should.equal(409)
    noNumber.status.should.equal(409)
  })

})

describe('POST /login', function() {

  before(function(done) {
    request
      .post(`${url}/register`)
      .send({ username: 'john', password: '1234abcd$' })
      .end((err, res) => {
        if (err) return done(err);
        done();
    })
  })

  it('200: existing user with valid password', async function() {
    const res = await request
      .post(`${url}/login`)
      .send({ username: 'john', password: '1234abcd$'})
    res.status.should.equal(200)
    res.header.should.have.property('set-cookie')
    
    const connectSid = getCookieValueByName(res.header['set-cookie'], 'connect.sid')

    // const cookies = res.header['set-cookie']
    // let connectSid: string;
    // for (let cookie of cookies) {
    //   let keyVals = cookie.split('=')
    //   if (keyVals[0] === 'connect.sid') {
    //     connectSid = keyVals.slice(1).join('=')
    //   }
    // }
    connectSid.should.exist
    connectSid.should.match(/^s%3A[^;]+; Path=\/; HttpOnly$/)
  })

  it('401: invalid username', async function() {
    const res = await request
      .post(`${url}/login`)
      .send({ username: 'someInvalidUsername', password: '1234abcd$' })
    res.status.should.equal(401)
  })
    
  it('401: invalid password', async function() {
    const res = await request
      .post(`${url}/login`)
      .send({ username: 'john', password: 'notJohnsPwd' })
    res.status.should.equal(401)
  })

})
