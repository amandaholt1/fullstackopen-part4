const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (req, res, next) => {
  try {
    const users = await User
      .find({})
      .populate('blogs', {
        title: 1, author: 1, url: 1, likes: 1, id: 1
      })
    res.json(users)
  } catch (err) {
    next(err)
  }
})


usersRouter.post('/', async (req, res, next) => {
  const { username, name, password } = req.body

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'username and password required' })
  }
  if (username.length < 3) {
    return res
      .status(400)
      .json({ error: 'username must be at least 3 characters long' })
  }
  if (password.length < 3) {
    return res
      .status(400)
      .json({ error: 'password must be at least 3 characters long' })
  }

  try {
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({ username, name, passwordHash })
    const saved = await user.save()
    res.status(201).json(saved)
  } catch (err) {
    if (err.name === 'MongoServerError' && err.code === 11000) {
      return res
        .status(400)
        .json({ error: 'username must be unique' })
    }
    next(err)
  }
})

module.exports = usersRouter
