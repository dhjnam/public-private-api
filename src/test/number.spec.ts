import { app } from '../app';
import supertest from 'supertest';
import chai from 'chai';
import { getCookieStringByName } from '../util/cookies'

chai.should()

/* Constants */

const request = supertest(app)
const url = `/api/v0`
const methods = ['rsa', 'ec']
const keyRegExp = (type: 'private' | 'public') => 
  new RegExp(
    `^-----BEGIN ${type.toUpperCase()} KEY-----` + 
    '\r?\n([A-Za-z0-9+\/=\r\n]+)\r?\n' + 
    `-----END ${type.toUpperCase()} KEY-----\r?\n$`
  )
const dummyPassword = 'abcd1234$'
const dummyUser = 'max'

/* Helper functions */

function register(username=dummyUser, password=dummyPassword) {
  return async function() {
    const res = await request
      .post(`${url}/register`)
      .send({ username, password })
    res.status.should.equal(201)
  }
}

function login(username=dummyUser, password=dummyPassword) {
  return async function() {
    const res = await request
      .post(`${url}/login`)
      .send({ username, password })
    res.status.should.equal(200)

    // find the connect.sid cookie
    this.sessionCookie = this.sessionCookie || {}
    this.sessionCookie[username] = getCookieStringByName(res.header['set-cookie'], 'connect.sid')
  }
}

function generate(username=dummyUser) {
  return async function() {
    return Promise.all(
      methods.map(method => request
        .post(`${url}/generate/${method}`)
        .set('Cookie', [this.sessionCookie[username]]))
    )
  }
}

function checkKey(resBody, type: 'private' | 'public') {
  const index = `${type}Key`
  resBody.should.have.property(index)
  const key = resBody[index]
  key.should.be.a('string')
  key.should.match(keyRegExp(type))
}


/* Specs */

describe('POST /generate/{method}', function() {
  
  before(register(dummyUser))
  
  context('Logged in: Generate private/public key pair', function() {  
    
    before(login(dummyUser))
    for (let method of methods) {
      it(`201: method: ${method}`, async function() {
        const res = await request
          .post(`${url}/generate/${method}`)
          .set('Cookie', [this.sessionCookie[dummyUser]])
        res.status.should.equal(201)
        checkKey(res.body, 'public')
        checkKey(res.body, 'private')
      })

      it(`409: private / public keypair for ${method} already exists`, async function() {
        const res = await request
          .post(`${url}/generate/rsa`)
          .set('Cookie', [this.sessionCookie[dummyUser]])
        res.status.should.equal(409)
      })
    }

    it('400: non existing method: asr', async function() {
      const res = await request
        .post(`${url}/generate/asr`)
        .set('Cookie', [this.sessionCookie[dummyUser]])
      res.status.should.equal(400)
    })

  })
  
  context('Not logged in: Generate private/public key pair', function() {  
    for (let method of methods) {
      it(`401: method: ${method}`, async function() {
        const res = await request
          .post(`${url}/generate/${method}`)
        res.status.should.equal(401)
        res.body.should.not.have.property('publicKey')
        res.body.should.not.have.property('privateKey')
      })
    }

    it('401: non existing method: asr', async function() {
      const res = await request
          .post(`${url}/generate/asr`)
        res.status.should.equal(401)
    })
  })
})

context('public / private', function() {

  // TODO: In all 200 status codes, you must actually check that the provided public or private keys belong to the person specified in ?user=person

  before(function() { this.start = new Date() })

  before(async function() {
    await Promise.all([
      register('legend')()
        .then(() => login('legend').call(this))
        .then(() => generate('legend').call(this)),
      register('logen')()
        .then(() => login('logen').call(this))
        .then(() => generate('logen').call(this)),
      register('neo')()
        .then(() => login('neo').call(this)),
      register('nina')()
        .then(() => login('nina').call(this)),
    ])
  })

  before(function() { this.end = new Date() })
  
  describe('POST /private', function() {
  
    describe('Logged in', function() {
      
      for (let method of methods) {
        it(`200: private / public keypair for ${method} exists`, async function() {
  
          console.log(this.end - this.start);
          
          const res = await request
            .get(`${url}/private/${method}`)
            .set('Cookie', [this.sessionCookie['legend']])
          res.status.should.equal(200)
          res.body.should.have.property('publicKey')
          res.body.should.have.property('privateKey')
        })
      }
      
      for (let method of methods) {
        it(`204: private / public keypair for ${method} exists not`, async function() {
          const res = await request
            .get(`${url}/private/${method}`)
            .set('Cookie', [this.sessionCookie['neo']])
          res.status.should.equal(204)
          res.body.should.not.have.property('publicKey')
          res.body.should.not.have.property('privateKey')
        })
      }
    })
  
    describe('Not logged in', function() {
  
      for (let method of methods) {
        it(`401: Not logged in, regardless of method (${method})`, async function() {
          const res = await request
            .get(`${url}/private/${method}`)
          res.status.should.equal(401)
          res.body.should.not.have.property('publicKey')
          res.body.should.not.have.property('privateKey')
        })
      }
  
      it(`401: Not logged in, even for non existing method (asr)`, async function() {
        const res = await request
          .get(`${url}/private/asr`)
        res.status.should.equal(401)
        res.body.should.not.have.property('publicKey')
        res.body.should.not.have.property('privateKey')
      })
    })
  
  })
  
  describe('GET /public', function() {
  
    context('Logged in', function() {
  
      describe('user has private / public keypair generated', function() {
        
        for (let method of methods) {
          
          it(`200: method: ${method} - no query`, async function() {
            const res = await request
              .get(`${url}/public/${method}`)
              .set('Cookie', [this.sessionCookie['legend']])
            res.status.should.equal(200)
          })
          
          it(`200: method: ${method} - query with myself as user`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=legend`)
              .set('Cookie', [this.sessionCookie['legend']])
            res.status.should.equal(200)
          })

          it(`200: method: ${method} - other user, that has key generated`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=logen`)
              .set('Cookie', [this.sessionCookie['legend']])
            res.status.should.equal(200)
          })

          it(`200: method: ${method} - other user, that has key not yet generated`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=neo`)
              .set('Cookie', [this.sessionCookie['legend']])
            res.status.should.equal(204)
          })

          it(`404: method: ${method} - non existing user`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=mrX`)
              .set('Cookie', [this.sessionCookie['legend']])
            res.status.should.equal(404)
          })
        }

      })
      
      describe('user has no private / public keypair generated', function() {
        
        for (let method of methods) {
          it(`204: method: ${method} - no query`, async function() {
            const res = await request
              .get(`${url}/public/${method}`)
              .set('Cookie', [this.sessionCookie['neo']])
            res.status.should.equal(204)
          })
          it(`204: method: ${method} - query with myself as user`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=neo`)
              .set('Cookie', [this.sessionCookie['neo']])
            res.status.should.equal(204)
          })
          it(`204: method: ${method} - other user`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=nina`)
              .set('Cookie', [this.sessionCookie['neo']])
            res.status.should.equal(204)
          })
          it(`404: method: ${method} - non existing user`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=mrX`)
              .set('Cookie', [this.sessionCookie['neo']])
            res.status.should.equal(404)
          })
        }

      })
  
    })
    
    context('Not logged in', function() {
      
      describe('private / public keypair generated', function() {
        for (let method of methods) {
          it(`404: method: ${method} - no query`, async function() {
            const res = await request
              .get(`${url}/public/${method}`)
            res.status.should.equal(404)
          })
          it(`200: method: ${method} - other user`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=legend`)
            res.status.should.equal(200)
          })
          it(`404: method: ${method} - non existing user`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=mrX`)
            res.status.should.equal(404)
          })
        }
      })
      
      describe('no private / public keypair generated', function() {
        for (let method of methods) {
          it(`404: method: ${method} - no query`, async function() {
            const res = await request
              .get(`${url}/public/${method}`)
            res.status.should.equal(404)
          })
          it(`204: method: ${method} - other user`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=neo`)
            res.status.should.equal(204)
          })
          it(`404: method: ${method} - non existing user`, async function() {
            const res = await request
              .get(`${url}/public/${method}?user=mrX`)
            res.status.should.equal(404)
          })
        }
      })
  
    })
  })

})
