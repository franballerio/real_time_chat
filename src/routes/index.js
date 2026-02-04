import { Router } from 'express'
import { createUserRouter } from '../features/users/user.routes.js'
import { createChatRouter } from '../features/chat/chat.routes.js'

export const createApiRouter = () => {
  const apiRouter = Router()

  apiRouter.use('/', createUserRouter())
  apiRouter.use('/', createChatRouter())

  return apiRouter
}
