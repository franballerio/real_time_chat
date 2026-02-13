import bcrypt from 'bcrypt'
import { SALT_ROUNDS } from '../../../config.js'
import { validateRegister } from './schema.register.js'
import { validateLogin } from './schema.login.js'
import { pool } from '../db/psql.js'

export class UserService {

  static async getAllUsers(user_name) {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE NOT user_name = $1', [user_name])
      return rows
    } catch (e) {
      throw new Error(e)
    }
  }

  static async getUserByUsername(user_name) {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE user_name = $1', [user_name])
      return rows
    } catch (e) {
      throw new Error(e)
    }
  }

  static async getUserByEmail(email) {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
      return rows
    } catch (e) {
      throw new Error(e)
    }
  }

  static async createUser({ email, user_name, password }) {
    console.log('[SERVICE] Validating', email, user_name)
    const validUser = validateRegister({ email, user_name, password })
    // always look at the error first
    if (validUser.error) throw new Error(validUser.error.message)

    const existentEmail = await this.getUserByEmail(email)
    const existentUser_name = await this.getUserByUsername(user_name)
    if (existentUser_name.length > 0 || existentEmail.length > 0) throw new Error('Already registered')

    const id = crypto.randomUUID()
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    try {
      const user = await pool.query('INSERT INTO users (_id, user_name, email, password) values ($1, $2, $3, $4)', [id, user_name, email, hashedPassword])
    } catch (e) {
      throw new Error(e)
    }
 
    return {
      id: id,
      email: email,
      user_name: user_name          
    } 
  }

  static async login({ credential, password }) {
    // credential could be user_name or email
    const validUser = validateLogin({ credential, password })
    if (validUser.error) return new Error(validUser.error) 
    
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE user_name = $1 OR email = $1', [credential])
      if ( rows.length === 0 ) throw new Error('Invalid credentials')
      
      const user = rows[0]
      const validPassword = await bcrypt.compare(password, user.password)
      if (!validPassword) throw new Error('Invalid credentials')
        
        return { 
          login: true,
          id: user._id,
          email: user.email,
          user_name: user.user_name,
        }
    } catch (e) {
        console.log(e)
        throw new Error(e)
    }
  }   
}
