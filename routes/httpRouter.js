import router from 'express'

import { controller } from ''

export const httpRouter = router()
// we get the dbModel from the app creation
const controller = new controller({ dbModel })

httpRouter.get('/', controller.home)
httpRouter.get('/chat', controller.chat)

httpRouter.post('/register', controller.register)
httpRouter.post('/login', controller.login)
httpRouter.post('/logout', controller.logout)

httpRouter.delete('/users', controller.users)
