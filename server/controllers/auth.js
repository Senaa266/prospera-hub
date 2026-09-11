import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'prospera_hub_dev_secret'

function sanitize(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    businessType: row.business_type,
    role: row.role || 'entrepreneur',
  }
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const passwordHash = await bcrypt.hash(password, 10)

    try {
      const result = db
        .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
        .run(name.trim(), normalizedEmail, passwordHash)

      const user = { id: Number(result.lastInsertRowid), name: name.trim(), email: normalizedEmail, businessType: null, role: 'entrepreneur' }
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

      res.status(201).json({ token, user })
    } catch (err) {
      if (String(err.message).toLowerCase().includes('unique')) {
        return res.status(409).json({ message: 'An account with this email already exists' })
      }
      throw err
    }
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase())

    if (!row) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const match = await bcrypt.compare(password, row.password_hash)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '7d' })

    res.json({ token, user: sanitize(row) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}