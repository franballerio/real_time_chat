import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config.js'

export const jwtGet = (req, next) => {
    // Check for token in Authorization header or cookies
    const headerToken = req.headers['authorization']?.split(' ')[1]
    const cookieToken = req.cookies['access_token']
    const token = headerToken || cookieToken

    req.session = { userData: null }

    try {
    if (token) {
        const data = jwt.verify(token, JWT_SECRET)
        req.session.userData = data
    }
    } catch {}

    next()
}