require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('./models/user')

const createUser = async () => {
  await mongoose.connect(process.env.MONGODB_URI)

  const passwordHash = await bcrypt.hash('secret', 10)
  const user = new User({ username: 'testuser', name: 'Test User', passwordHash })

  await user.save()
  console.log('User created')
  await mongoose.connection.close()
}

createUser().catch(err => {
  console.error('Error creating user:', err)
  process.exit(1)
})
