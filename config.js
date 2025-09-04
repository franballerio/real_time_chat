import 'dotenv/config'

export const PORT = process.env.PORT
export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS)
export const JWT_SECRET= process.env.JWT_SECRET
