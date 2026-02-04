import bcrypt from 'bcrypt'
import { SALT_ROUNDS } from '../../../config.js'
import { validateRegister } from './schema.register.js'
import { validateLogin } from './schema.login.js'
import { UserRepository } from './user.repository.js'

export class UserService {
  static async createUser({ email, user_name, password }) {
    const validUser = validateRegister({ email, user_name, password })

    if (validUser.success) {
      const existentEmail = UserRepository.findOne({ email })
      const existentUser_name = UserRepository.findOne({ user_name })

      if (!existentUser_name && !existentEmail) {
        const id = crypto.randomUUID()
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

        UserRepository.create({
          _id: id,
          email,
          user_name,
          password: hashedPassword
        })

        return {
          id: id,
          email: email,
          user_name: user_name          
        }
      } else {
        throw new Error('Already registered')
      }
    } else {
      throw new Error(validUser.error.message)
    }
  }

  static getUsers(user_name) {
    return UserRepository.find(u => u.user_name != user_name)
  }

  static clear() {
    UserRepository.remove(user => user)
  }

  static async login({ userORemail, password }) {
    const validUser = validateLogin({ credential: userORemail, password: password })

    if (validUser.success) {
      const [user] = UserRepository.find(u => u.user_name === userORemail || u.email === userORemail)
      
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
}
