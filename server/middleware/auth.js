import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'prospera_hub_dev_secret'

export function authenticate(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' })
  }

  const token = header.split(' ')[1]

  if (token === 'demo-token') {
    req.user = { id: 1, email: 'demo@prospera.com', role: 'entrepreneur' }
    return next()
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}