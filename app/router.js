import { Router } from 'express'
import { createUserRouter } from '../src/features/users/user.routes.js'
import { createViewsRouter } from '../src/features/views/views.routes.js'
import { jwtGet } from '../src/middlewares/JWT.js'

export const createRouter = () => {
  const apiRouter = Router()

  // added jwt middleware here so it executes before the routes succesfully 
  apiRouter.use('/api/users', jwtGet, createUserRouter())
  apiRouter.use('/', jwtGet, createViewsRouter())

  return apiRouter
}
