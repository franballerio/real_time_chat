import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise';
import { JWT_SECRET } from '../config.js'

import { create, login, getUsers, clear } from '../models/localDB.js'

export class controller {

  constructor({ dbModel }) {
    this.dbModel = dbModel
  }

  home = async (req, res) => {
    //console.log(req.session)
    const { userData } = req.session
    if (!userData) return res.render('index')

    try {
      res.redirect('/chat')
    } catch {}  
  }

  chat = async (req, res) => {
    const { userData } = req.session
    if (!userData) return res.redirect('/')

    res.render('chat', { userData: userData })    
  }

  register = async (req, res) => {
    //console.log(req.body)
    const { email, user_name, password } = req.body
    try {
      // the db manager creates the user and returns the id
      const newUser = await create({ email, user_name, password })
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
  }

  login = async (req, res) => {
    const { userORemail, password } = req.body

    try {
      const user = await login({ userORemail, password })

      if (user.login) {
        // create a jwtoken for session auth
        const token = jwt.sign(
          { id: user.id, email: user.email, user_name: user.user_name },
          JWT_SECRET,
          { expiresIn: '1h' }
        )

        console.log(`User ${userORemail} validated`)

        res
          .cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 // 1 hour
          })
          .json({ id: user._id })
        }
      } catch (error) {
        res.status(401).send(error.message)
      }    
  }

  logout = async (req, res) => {
    res
      .clearCookie('access_token')
      .json({message: 'Logout Successful'})
  }

  users = async (req, res) => {
    const users = getUsers()
    res.json(users)
  }

  delete = async (req, res) => {
    clear()
    res.send(200)    
  }

}

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
        //console.log(msg)
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
