import { app } from './app.js'
import { localDB } from './src/features/db/localDB.js'

const whatsapp = app({ dbModel: localDB })