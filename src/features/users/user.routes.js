import { Router } from 'express'
import { UserController } from './user.controller.js'

export const createUserRouter = () => {
  const userRouter = Router()
  const controller = new UserController()

  userRouter.get('/', controller.home)
  userRouter.post('/register', controller.register)
  userRouter.post('/login', controller.login)
  userRouter.post('/logout', controller.logout)
  userRouter.get('/users', controller.users)
  userRouter.delete('/clear', controller.delete)

  return userRouter
}
