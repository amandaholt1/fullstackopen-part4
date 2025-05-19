const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = require('./config')

const requestLogger = (req, res, next) => {
  console.log('Method:', req.method)
  console.log('Path:  ', req.path)
  console.log('Body:  ', req.body)
  console.log('---')
  next()
}

const tokenExtractor = (req, res, next) => {
  const auth = req.get('authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    req.token = auth.substring(7)
  } else {
    req.token = null
  }
  next()
}


const userExtractor = async (req, res, next) => {
  if (!req.token) {
    return res.status(401).json({ error: 'token missing' })
  }

  let decoded
  try {
    decoded = jwt.verify(req.token, config.SECRET)
  } catch {
    return res.status(401).json({ error: 'token invalid' })
  }

  if (!decoded.id) {
    return res.status(401).json({ error: 'token invalid' })
  }

  const user = await User.findById(decoded.id)
  if (!user) {
    return res.status(401).json({ error: 'user not found' })
  }

  req.user = user
  next()
}

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (err, req, res, next) => {
  console.error(err.message)
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }
  next(err)
}

module.exports = {
  requestLogger,
  tokenExtractor,
  userExtractor,
  unknownEndpoint,
  errorHandler
}
