import DBlocal from 'db-local'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

import { SALT_ROUNDS } from '../config.js'
import { validateRegister } from '../schemas/userRegister.js'
import { validateLogin } from '../schemas/userLogin.js'
// import { z } from 'zod'

const { Schema } = new DBlocal({ path: './db' })

const User = Schema('User', {
  _id: { type: String, required: true },
  user_name: { type: String, required: true, unique: true},
  email: { type: String, required: true },
  password: { type: String, required: true }
})

const Chat = Schema('Chat', {
  _id: { type: String, required: true },
  users: [{ type: String, ref: 'User' }],
  createdAt: { type: Date },
  updatedAt: { type: Date }
})

const Message = Schema('Message', {
  _id: { type: String, required: true },
  chatId: { type: String, ref: 'Chat', required: true },
  senderId: { type: String, ref: 'User', required: true },
  senderUsername: { type: String, ref: 'User', required: true },
  recieverId: { type: String, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date },
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

  static async createChat({ room, users }) {
    try {
      const existentChat = Chat.findOne({ _id: room })
      const now = new Date().toISOString()

      if (!existentChat) {
        Chat.create({
          _id: room,
          users: users,
          createdAt: now,
          updatedAt: now
        }).save()
        console.log(`Chat created: ${room}`)
      } else {
        console.log(`Chat already exists: ${room}`)
      }
      return room
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  static async newMessage({ msg, room, reciever, sender, senderUsername }) {
    try {
      const msgId = crypto.randomUUID()

    const newMessage = Message.create({
      _id: msgId,    // Generate a unique Id for the message
      chatId: room,        // Use 'room' as the conversation Id
      senderId: sender,
      senderUsername: senderUsername,
      recieverId: reciever,
      text: msg,
      createdAt: new Date().toISOString(),       // Explicitly set the createdAt date
      readBy: [sender]             // Initialize 'readBy' with the sender's Id
    }).save()

      console.log(`Message created: ${msgId}`)
      return newMessage
    } catch (error) {
      console.error('Error creating message:', error)
      throw error
    }
  }

  static async fetchChat({ room }) {
    return await Message.find(m => m.chatId === room)
  }
}
