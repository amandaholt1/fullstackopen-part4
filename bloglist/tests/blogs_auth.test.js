const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  const pwHash = await bcrypt.hash('secret', 10)
  const user = new User({
    username: 'root',
    name: 'Root User',
    passwordHash: pwHash,
    blogs: []
  })
  await user.save()

  const initialBlogs = [
    { title: 'First',  author: 'A', url: 'http://1', likes: 1, user: user._id },
    { title: 'Second', author: 'B', url: 'http://2', likes: 2, user: user._id }
  ]
  const saved = await Blog.insertMany(initialBlogs)

  user.blogs = saved.map(b => b._id)
  await user.save()
})

describe('GET /api/blogs', () => {
  test('blogs include a populated user object', async () => {
    const res = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    res.body.forEach(blog => {
      assert.ok(blog.user, 'blog.user missing')
      assert.strictEqual(typeof blog.user.id, 'string')
      assert.strictEqual(blog.user.username, 'root')
      assert.strictEqual(blog.user.name, 'Root User')
    })
  })
})

describe('POST /api/blogs', () => {
  test('new blog is assigned to the first user', async () => {
    const loginRes = await api
      .post('/api/login')
      .send({ username: 'root', password: 'secret' })
      .expect(200)
    const token = loginRes.body.token

    const newBlog = {
      title: 'Third',
      author: 'C',
      url: 'http://3',
      likes: 3
    }

    const postRes = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  
    const created = postRes.body
    assert.ok(created.user, 'Returned blog.user is missing')
    assert.strictEqual(created.user.username, 'root')

    const all = await api.get('/api/blogs').expect(200)
    const found = all.body.find(b => b.id === created.id)
    assert.strictEqual(found.user.id, created.user.id)
  })
})

after(async () => {
  await mongoose.disconnect()
})
