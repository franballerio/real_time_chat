import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config.js'

export class httpController {

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
      const newUser = await this.dbModel.createUser({ email, user_name, password })
      console.log(`User created ${newUser}`)

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
      res.status(400).send(error.message)
    }    
  }

  login = async (req, res) => {
    const { userORemail, password } = req.body

    try {
      const user = await this.dbModel.login({ userORemail, password })

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
    const users = this.dbModel.getUsers()
    res.json(users)
  }

  delete = async (req, res) => {
    this.dbModel.clear()
    res.send(200)    
  }
}