import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../../app/config.js'

export const jwtGet = (req, res, next) => {
	// Check for token in Authorization header or cookies
	const headerToken = req.headers['authorization']?.split(' ')[1]
	const cookieToken = req.cookies['access_token']
	const token = headerToken || cookieToken

	req.session = { userData: null }

	try {
		if (token) {
				const data = jwt.verify(token, JWT_SECRET)
				req.session.userData = data
				console.log('[JWT MIDDLEWARE] user:', req.session.userData)
		} else {
      req.session.userData = null
    }
	} catch (error) {
    // If token is invalid or expired, clear user data from session
    req.session.userData = null
    console.error('[JWT MIDDLEWARE] Token verification failed:', error.message)
  }
	next()
}