import DBlocal from 'db-local'
import bcrypt from 'bcrypt'

import { SALT_ROUNDS } from '../config.js'
import { validateRegister } from '../schemas/userRegister.js'
import { validateLogin } from '../schemas/userLogin.js'
// import { z } from 'zod'

const { Schema } = new DBlocal({ path: './db' })
// this is the local database, is like a create table
const User = Schema('User', {
  _id: { type: String, required: true },
  user_name: { type: String, required: true, unique: true},
  email: { type: String, required: true },
  password: { type: String, required: true }
})

const Chat = Schema('Chat', {
  _id: { type: String, required: true },
  users: [{ type: String, ref: 'User' }],
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() }
})

const Message = Schema('Message', {
  _id: { type: String, required: true },
  conversationId: { type: String, ref: 'Conversation', required: true },
  senderId: { type: String, ref: 'User', required: true },
  recieverId: { type: String, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
  readBy: [{ type: String, ref: 'User' }]
})

export class localDB {
  
  static async createUser({ email, user_name, password }) {
    // validate user first
    const validUser = validateRegister({ email, user_name, password })

    //console.log(validUser)

    if (validUser.success) {
      const existentEmail = User.findOne({ email })
      const existentUser_name =  User.findOne({ user_name })
      if (!existentUser_name && !existentEmail) {
        const id = crypto.randomUUID()
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

        User.create({
          _id: id,
          email,
          user_name,
          password: hashedPassword
        }).save()

        console.log(id)
        return {
          id: id,
          email: email,
          user_name: user_name          
        }
      } else {
        throw new Error('Already registered')
      }
    } else {
      return validUser.error.message
      // return z.treeifyError(validUser.error).properties
    }
  }

  static getUsers(user_name) {
    return User.find(u => u.user_name != user_name)
  }

  static clear() {
    User.remove(user => user)
  }

  static async login({ userORemail, password }) {

    const validUser = validateLogin({ credential: userORemail, password: password })

    if (validUser.success) {
      const [user] = User.find(u => u.user_name === userORemail || u.email === userORemail)
      
      if (user) {
        const validPassword = await bcrypt.compare(password, user.password)
        if (validPassword) return { 
          login: true,
          id: user._id,
          email: user.email,
          user_name: user.user_name,
        }
      }
    }
    throw new Error('Invalid input')
  }

  static async createChat({ room, ids }) {
    if (Chat.findOne({ room })) return room
    
    Chat.create({
      _id: room,
      users: ids,
    }).save()
  }

  static async newMessage({ msg, room, reciever, sender}) {
    const newMessage = Message.create({
      _id: crypto.randomUUID(),    // Generate a unique ID for the message
      conversationId: room,        // Use 'room' as the conversation ID
      senderId: sender,
      recieverId: reciever,
      text: msg,
      readBy: [sender]             // Initialize 'readBy' with the sender's ID
    }).save()

    return newMessage    
  }
}