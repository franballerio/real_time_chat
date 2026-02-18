import { Router } from 'express'
import { UsersController } from './user.controller.js'

export const createUserRouter = () => {
  const userRouter = Router()
  const controller = new UsersController()

  userRouter.post('/register', controller.register)
  userRouter.post('/login', controller.login)
  userRouter.post('/logout', controller.logout)
  userRouter.get('/getAll', controller.users)

  return userRouter
}
