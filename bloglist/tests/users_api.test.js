// tests/users_api.test.js
const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const User = require('../models/user')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({
    username: 'root',
    name: 'Superuser',
    passwordHash
  })
  await user.save()
})

describe('GET /api/users', () => {
  test('returns all users as JSON', async () => {
    const res = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(res.body.length, 1)
    const u = res.body[0]
    assert.ok(u.id)
    assert.strictEqual(u.username, 'root')
    assert.strictEqual(u.name, 'Superuser')
    assert.strictEqual(u.passwordHash, undefined)
  })
})

describe('POST /api/users', () => {
  test('creates a new user with valid data', async () => {
    const newUser = {
      username: 'alice',
      name: 'Alice Wonder',
      password: 'mypassword'
    }

    const postRes = await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const allRes = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(allRes.body.length, 2)
    assert.strictEqual(postRes.body.username, 'alice')
    assert.ok(postRes.body.id)
    assert.strictEqual(postRes.body.passwordHash, undefined)
  })

  test('fails with 400 if username missing', async () => {
    const res = await api
      .post('/api/users')
      .send({ name: 'NoUser', password: 'abc123' })
      .expect(400)
    assert.match(res.body.error, /username and password required/)
  })

  test('fails with 400 if password missing', async () => {
    const res = await api
      .post('/api/users')
      .send({ username: 'bob', name: 'Bob' })
      .expect(400)
    assert.match(res.body.error, /username and password required/)
  })

  test('fails with 400 if username too short', async () => {
    const res = await api
      .post('/api/users')
      .send({
        username: 'ab',
        name: 'AB Short',
        password: 'validpass'
      })
      .expect(400)
    assert.match(res.body.error, /username must be at least 3 characters long/)
  })

  test('fails with 400 if password too short', async () => {
    const res = await api
      .post('/api/users')
      .send({
        username: 'shorty',
        name: 'Short',
        password: '12'
      })
      .expect(400)
    assert.match(res.body.error, /password must be at least 3 characters long/)
  })

  test('fails with 400 if username not unique', async () => {
    const res = await api
      .post('/api/users')
      .send({
        username: 'root',
        name: 'Duplicate',
        password: 'anotherpass'
      })
      .expect(400)
    assert.match(res.body.error, /username.*unique/)
  })
})

after(async () => {
  await mongoose.disconnect()
})
