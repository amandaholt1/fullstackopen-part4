const express = require('express')
const Blog = require('../models/blog')
const { userExtractor } = require('../utils/middleware')

const blogsRouter = express.Router()

blogsRouter.get('/', async (req, res, next) => {
  try {
    const blogs = await Blog
      .find({})
      .populate('user', { username: 1, name: 1, id: 1 })
    res.json(blogs)
  } catch (err) {
    next(err)
  }
})

blogsRouter.post('/', userExtractor, async (req, res, next) => {
  const { title, author, url, likes } = req.body
  if (!title || !url) {
    return res.status(400).json({ error: 'title or url missing' })
  }

  try {
    const user = req.user  

    const blog = new Blog({
      title,
      author,
      url,
      likes: likes || 0,
      user: user._id
    })

    const saved = await blog.save()
    user.blogs = user.blogs.concat(saved._id)
    await user.save()

    const populated = await saved.populate('user', {
      username: 1, name: 1, id: 1
    })

    res.status(201).json(populated)
  } catch (err) {
    next(err)
  }
})


blogsRouter.delete('/:id', userExtractor, async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) {
      return res.status(404).end()
    }

    const ownerId = blog.user.toString()
    const requesterId = req.user._id.toString()

    if (ownerId !== requesterId) {
      return res.status(403).json({ error: 'forbidden: not the creator' })
    }

    await Blog.findByIdAndDelete(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})


blogsRouter.put('/:id', async (req, res, next) => {
  const { likes } = req.body
  try {
    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      { likes },
      { new: true, runValidators: true, context: 'query' }
    ).populate('user', { username: 1, name: 1, id: 1 })

    if (updated) return res.json(updated)
    res.status(404).end()
  } catch (err) {
    next(err)
  }
})

module.exports = blogsRouter
