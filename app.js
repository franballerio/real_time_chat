import express from 'express'
import cookieParser from 'cookie-parser'
import { Server } from "socket.io"
import { createServer } from "node:http"
import cors from 'cors';

import { PORT } from './config.js'
import { createHttpRouter } from './routes/httpRouter.js';
import { ioController } from './controllers/ioController.js'
import { jwtGet } from './middlewares/JWT.js';

export const app = ({ dbModel }) => {
    const app = express()
    app.use(cors())
    app.use(express.json())
    app.use(cookieParser())
    app.set('view engine', 'ejs')
    app.disable('x-powered-by')
    
    const http_server = createServer(app);
    const io = new Server(http_server, {
      connectionStateRecovery: {},
      // this is for allowing the client to send requests when it runs in another port
      cors: 'http://localhost:3000'
    });
    
    app.use((req, res, next) => { jwtGet(req, next) })
    app.use('/', createHttpRouter({ dbModel }))
    ioController({ io: io, dbModel: dbModel })
    
    http_server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
}