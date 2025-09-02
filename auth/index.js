import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { Server } from "socket.io"
import { createServer } from "node:http"
import mysql from 'mysql2/promise';
import cors from 'cors';


import { PORT, JWT_SECRET } from './config.js'
import { UserDB } from './db.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs')
const http_server = createServer(app);
const io = new Server(http_server, {
  connectionStateRecovery: {}
});


app.use((req, res, next) => {
  console.log(req.headers)
  // Check for token in Authorization header or cookies
  const headerToken = req.headers['authorization']?.split(' ')[1]
  const cookieToken = req.cookies['access_token']
  //console.log(cookieToken)

  const token = headerToken || cookieToken
  
  req.session = { userData: null }

  try {
    if (token) {
      const data = jwt.verify(token, JWT_SECRET)
      console.log(data)
      req.session.userData = data
    }
  } catch {}

  next()
})

app.get('/', (req, res) => {
  console.log(req.session)
  const { userData } = req.session
  if (!userData) return res.render('index')

  try {
    res.redirect('/chat')
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

    const token = jwt.sign(
      { id: id, email: email, user_name: user_name },
      JWT_SECRET,
      { expiresIn: '1h' }
    )    

    console.log({token})
    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 // 1 hour
      })
      .json({ token: token });
  } catch (error) {
    res.status(400).send(error.message)
  }
})

app.post('/login', async (req, res) => {
  const { userORemail, password } = req.body

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
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 // 1 hour
      })
      .json({ token: token })
  } catch (error) {
    res.status(401).send(error.message)
  }
})

app.get('/chat', (req, res) => {
  const { userData } = req.session

  if (!userData) return res.redirect('/')
  
  console.log(userData)
  res.render('chat', userData)  
})

app.post('/logout', (req, res) => {
  res
    .clearCookie('access_token')
    .json({message: 'Logout Successful'})
})
app.delete('/users', (req, res) => {
  UserDB.clear()
  res.send(200)
})

//io.use()

io.on("connection", async (socket) => {
    console.log("Cliente conectado!")

    socket.on("disconnect", () => {
        console.log(`Client: ${socket.client} has disconnected`);
    })

    socket.on("chat message", async (msg, user_name) => {
        // console.log(msg)
        //let result
        // try {
        //     // console.log([msg, username]);
        //     [result] = await connection.execute("INSERT INTO chat_messages (message, user) VALUES (?, ?)", [msg, username]);
        // }
        // catch (error) {
        //     console.error("Error al guardar el mensaje en la base de datos:", error);
        //     return;
        // }
        // console.log("Mensaje recibido: " + msg);
        //io.emit("chat message", msg, result.insertId.toString(), username);
        io.emit("chat message", msg, user_name);
    })

    // if (!socket.recovered) {
    //     const [result] = await connection.execute(
    //         "SELECT * FROM chat_messages WHERE id > ?", [socket.handshake.auth.serverOffset || 0]
    //     );
        
    //     result.forEach(row => {
    //         socket.emit("chat message", row.message, row.id, row.user);
    //     });
    // }

})

http_server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
