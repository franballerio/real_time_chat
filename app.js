import express from 'express'
import cookieParser from 'cookie-parser'
import { Server } from "socket.io"
import { createServer } from "node:http"
import cors from 'cors';

import { PORT } from './config.js'
import { createApiRouter } from './src/routes/index.js'
import { chatHandler } from './src/features/chat/chat.handler.js'
import { jwtGet } from './src/middlewares/JWT.js';

export const app = () => {
    const app = express()
    app.use(cors())
    app.use(express.json())
    app.use(cookieParser())
    app.set('view engine', 'ejs')
    app.disable('x-powered-by')
    
    const http_server = createServer(app);
    const io = new Server(http_server, {
      connectionStateRecovery: {},
      cors: 'http://localhost:3000'
    });
    
    app.use((req, res, next) => { jwtGet(req, next) })
    app.use('/', createApiRouter())
    chatHandler({ io })
    
    http_server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
}
