import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../../../app/config.js'
import { UserService } from './user.service.js'

export class UsersController {

  register = async (req, res) => {
    const { email, user_name, password } = req.body
    try {
      const newUser = await UserService.createUser({ email, user_name, password })
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, user_name: newUser.user_name },
        JWT_SECRET, 
        { expiresIn: '1h' }
      )    

      res
        .cookie('access_token', token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 1000 * 60 * 60 // 1 hour
        })
        .json({ id: newUser.id });
    } catch (error) {
      res.status(400).json({ "error": error.message })
    }    
  }

  login = async (req, res) => {
    const { credentials, password } = req.body
    try {
      const user = await UserService.login({ credential: credentials, password: password })

      if (user.login) {
        const token = jwt.sign(
          { id: user.id, email: user.email, user_name: user.user_name },
          JWT_SECRET,
          { expiresIn: '1h' }
        )

        res
          .cookie('access_token', token, {
            httpOnly: false,
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
    const { userData } = req.session
    if (!userData) return res.redirect('/')

    const users = UserService.getAllUsers(userData.id)
    res.json(users)
  }

  delete = async (req, res) => {
    UserService.clear()
    res.send(200)    
  }
}
