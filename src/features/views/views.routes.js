import { Router } from 'express'
import { ViewsController } from './views.controller.js'

export const createViewsRouter = () => {
  const viewsRouter = Router()
  const viewsController = new ViewsController()

  viewsRouter.get('/', viewsController.home)
  viewsRouter.get('/chat', viewsController.chat)

  return viewsRouter
}