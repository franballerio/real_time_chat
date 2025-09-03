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
  connectionStateRecovery: {},
  // this is for allowing the client to send requests when it runs in another port
  cors: 'http://localhost:3000'
});


app.use((req, res, next) => {
  // Check for token in Authorization header or cookies
  const headerToken = req.headers['authorization']?.split(' ')[1]
  const cookieToken = req.cookies['access_token']
  const token = headerToken || cookieToken
  
  req.session = { userData: null }

  try {
    if (token) {
      const data = jwt.verify(token, JWT_SECRET)
      req.session.userData = data
    }
  } catch {}

  next()
})

app.get('/', (req, res) => {
  //console.log(req.session)
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
  //console.log(req.body)
  const { email, user_name, password } = req.body
  try {
    // the db manager creates the user and returns the id
    const newUser = await UserDB.create({ email, user_name, password })
    console.log(`User created ${newUser}`)

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, user_name: newUser.user_name },
      JWT_SECRET, 
      { expiresIn: '1h' }
    )    

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 // 1 hour
      })
      .json({ id: id });
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
      .json({ id: user._id })
  } catch (error) {
    res.status(401).send(error.message)
  }
})

app.get('/chat', (req, res) => {
  const { userData } = req.session
  if (!userData) return res.redirect('/')

  res.render('chat', { userData: userData })
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

io.use((socket, next) => {
  const username = socket.handshake.auth.user_name
  const id = socket.handshake.auth.userID
  if (!username) return new Error('Invalid username')
  
  socket.user_name = username
  socket.userID = id
  next()
})

io.on("connection", async (socket) => {
    console.log(`Client: ${socket.user_name} has connected!`)

    // send to all connections the new user
    socket.broadcast.emit("user connected", {
      userSocketID: socket.id,
      user_name: socket.user_name,
    });

    // we send to the user, all existing users
    const users = [];
    for (let [id, connectedSocket] of io.of("/").sockets) {
      if (socket.handshake.auth.user_name != connectedSocket.user_name)
      users.push({
        userID: connectedSocket.userID,
        user_name: connectedSocket.user_name,
      });
    }

    socket.emit("users", users);

    socket.on("disconnect", () => {
        console.log(`Client: ${socket.user_name} has disconnected!`);
    })

    socket.on('joinRoom', ({ room }) => {
      console.log(`User ${socket.user_name, socket.userID} joining room: ${room}`)
      socket.join(room)
    })

    socket.on("chat message", async ({ msg, room, reciever }) => {
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
        io.to(room).emit("chat message", {
          content: msg,
          from: socket.user_name,
          to: reciever
        });
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
