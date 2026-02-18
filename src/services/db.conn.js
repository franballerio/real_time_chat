import {DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER} from '../../app/config.js'
import { Pool } from 'pg'

export const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: DB_PORT,
})

export const connect = async () => {
  try {
    await pool.query('SELECT 1')
    console.log('Connection to the db established')
  } catch (e) {
    throw e
  }
}

