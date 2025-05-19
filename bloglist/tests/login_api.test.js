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
  const pwHash = await bcrypt.hash('sekret', 10)
  await new User({ username: 'root', name: 'Root', passwordHash: pwHash }).save()
})

describe('POST /api/login', () => {
  test('succeeds with valid credentials', async () => {
    const res = await api
      .post('/api/login')
      .send({ username: 'root', password: 'sekret' })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.ok(res.body.token)
    assert.strictEqual(res.body.username, 'root')
  })

  test('fails with wrong password', async () => {
    await api
      .post('/api/login')
      .send({ username: 'root', password: 'wrong' })
      .expect(401)
  })

  test('fails with non-existent user', async () => {
    await api
      .post('/api/login')
      .send({ username: 'nouser', password: 'sekret' })
      .expect(401)
  })
})

after(async () => {
  await mongoose.disconnect()
})
