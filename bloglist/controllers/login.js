const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')
const config = require('../utils/config')

loginRouter.post('/', async (req, res, next) => {
  const { username, password } = req.body

  try {
    const user = await User.findOne({ username })
    const passwordValid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false

    if (!user || !passwordValid) {
      return res.status(401).json({ error: 'invalid username or password' })
    }

    const tokenPayload = {
      username: user.username,
      id: user._id.toString(),
    }

    const token = jwt.sign(tokenPayload, config.SECRET)

    res.status(200).send({
      token,
      username: user.username,
      name: user.name,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = loginRouter
