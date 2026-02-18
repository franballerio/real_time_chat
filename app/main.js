import express from 'express'
import cookieParser from 'cookie-parser'
import { Server } from "socket.io"
import { createServer } from "node:http"
import cors from 'cors';

import { PORT } from './config.js'
import { connect as connectDB } from '../src/services/db.conn.js';
import { createRouter } from './router.js'
import { ioHandler } from '../src/features/io/io.controller.js'
import { jwtGet } from '../src/middlewares/JWT.js';


export const app = async () => {
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
    
    app.use((req, res, next) => { jwtGet(req, res, next) })
    app.use('/', createRouter())
    ioHandler({ io })
    
    try {
      await connectDB()
    } catch (err) {
      console.error('Failed to start Server due to a db connection error %s', err)
      process.exit(1)
    }

    http_server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
}
