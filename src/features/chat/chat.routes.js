import { Router } from 'express'
import { ChatController } from './chat.controller.js'

export const createChatRouter = () => {
  const chatRouter = Router()
  const controller = new ChatController()

  chatRouter.get('/chat', controller.chat)

  return chatRouter
}
