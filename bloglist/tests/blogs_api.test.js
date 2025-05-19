const { describe, test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')

const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

describe('when there are existing blogs', () => {
  let token

  beforeEach(async () => {
    await User.deleteMany({})
    await Blog.deleteMany({})


    const passwordHash = await bcrypt.hash('secret', 10)
    const user = await new User({
      username: 'root',
      name: 'Root User',
      passwordHash
    }).save()

    const loginRes = await api
      .post('/api/login')
      .send({ username: 'root', password: 'secret' })
      .expect(200)
    token = loginRes.body.token

    const initial = [
      { title: 'First', author: 'A', url: 'http://1', likes: 1 },
      { title: 'Second', author: 'B', url: 'http://2', likes: 2 }
    ]
    for (const blog of initial) {
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(blog)
        .expect(201)
    }
  })

  test('GET /api/blogs returns blogs with populated user', async () => {
    const res = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(res.body.length, 2)

    res.body.forEach(b => {
      assert.ok(b.user, 'blog.user missing')
      assert.strictEqual(typeof b.user.id, 'string')
      assert.strictEqual(b.user.username, 'root')
      assert.strictEqual(b.user.name, 'Root User')
    })
  })

  test('POST /api/blogs succeeds with valid token', async () => {
    const newBlog = { title: 'Third', author: 'C', url: 'http://3', likes: 3 }

    const postRes = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)


    const all = await api.get('/api/blogs').expect(200)
    assert.strictEqual(all.body.length, 3)
    assert.ok(all.body.map(b => b.title).includes('Third'))


    assert.strictEqual(postRes.body.user.username, 'root')
  })

  test('POST /api/blogs fails with 401 if no token is provided', async () => {
    const newBlog = { title: 'NoAuth', author: 'X', url: 'http://noauth' }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
  })
})

describe('deleting blogs with ownership check', () => {
  let token, otherToken, blogToDelete

  beforeEach(async () => {

    await User.deleteMany({})
    await Blog.deleteMany({})


    const h1 = await bcrypt.hash('pass1', 10)
    await new User({ username: 'user1', passwordHash: h1 }).save()
    const h2 = await bcrypt.hash('pass2', 10)
    await new User({ username: 'user2', passwordHash: h2 }).save()


    const login1 = await api.post('/api/login')
      .send({ username: 'user1', password: 'pass1' })
      .expect(200)
    token = login1.body.token

    const login2 = await api.post('/api/login')
      .send({ username: 'user2', password: 'pass2' })
      .expect(200)
    otherToken = login2.body.token

    
    const res = await api.post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Owned', author: 'A', url: 'http://owned' })
      .expect(201)

    blogToDelete = res.body
  })

  test('creator can delete their blog', async () => {
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const remaining = await api.get('/api/blogs').expect(200)
    const titles = remaining.body.map(b => b.id)
    assert.ok(!titles.includes(blogToDelete.id))
  })

  test('deletion fails with 401 if no token', async () => {
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(401)
  })

  test('deletion fails with 403 if not the creator', async () => {
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403)
  })
})

after(async () => {
  await mongoose.disconnect()
})
