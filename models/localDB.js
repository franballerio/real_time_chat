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

export class localDB {
  static async create({ email, user_name, password }) {
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
      const [ user ]  = User.find(u => u.user_name === userORemail || u.email === userORemail)
      const validPassword = await bcrypt.compare(password, user.password)

      if (user && validPassword) {
        return { login: true }
      }
    }
    throw new Error('Invalid input')
  }
}