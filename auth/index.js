import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

import { PORT, JWT_SECRET } from './config.js'
import { UserDB } from './db.js'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs')

app.use((req, res, next) => {
  const token = req.cookies.access_cookie
  req.session = { userData: null }

  try {
    const data = jwt.verify(token, JWT_SECRET)
    req.session.userData = data
  } catch {}

  next()
})

app.get('/', (req, res) => {
  const { userData } = req.session
  if (!userData) return res.render('index')

  try {
    res.render('index', userData)
  } catch {}  
})

// users routes
app.get('/users', (req, res) => {
  const users = UserDB.getUsers()
  res.json(users)
})

app.post('/register', async (req, res) => {
  console.log(req.body)
  const { email, user_name, password } = req.body
  try {
    // the db manager creates the user and returns the id
    const id = await UserDB.create({ email, user_name, password })
    console.log(`User created id: ${id}`)
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.post('/login', async (req, res) => {
  const { userORemail, password } = req.body
  console.log(userORemail)
  console.log(password)

  try {
    const user = await UserDB.login({ userORemail, password })
    // create a jwtoken for session auth
    const token = jwt.sign(
      { id: user.id, email: user.email, user_name: user.user_name },
      JWT_SECRET,
      { expiresIn: '1h' }
    )
    console.log('User validated')
    res
      // send the token to the client so it can resend it for auth
      .cookie('access_cookie', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60
      })
      .send(user)
  } catch (error) {
    res.status(401).send(error.message)
  }
})

app.get('/protected', (req, res) => {
  const { userData } = req.session

  if (!userData) res.status(403).send('Acces denied')
  res.render('protected', userData)
})

app.post('/logout', (req, res) => {
  res
    .clearCookie('access_cookie')
    .json({message: 'Logout Successful'})
})

app.delete('/users', (req, res) => {
  UserDB.clear()
  res.send(200)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
