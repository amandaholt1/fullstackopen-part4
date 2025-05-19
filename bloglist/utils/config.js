const path = require('path')

const envFile =
  process.env.NODE_ENV === 'test'
    ? path.resolve(__dirname, '../.env.test')
    : path.resolve(__dirname, '../.env')

require('dotenv').config({ path: envFile })

const MONGODB_URI =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI

const PORT = process.env.PORT || 3001
const SECRET = process.env.SECRET

module.exports = { MONGODB_URI, PORT, SECRET }
