import { app } from './app.js'
import { localDB } from './models/localDB.js'

const whatsapp = app({ dbModel: localDB })