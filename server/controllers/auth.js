import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const users = []

export async function register(req, res) {
  try {
    const { name, email, password, businessType } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }

    if (users.find((u) => u.email === email)) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = { id: users.length + 1, name, email, businessType, password: hashedPassword }
    users.push(user)

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })

    const { password: _, ...safeUser } = user
    res.status(201).json({ token, user: safeUser })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body
    const user = users.find((u) => u.email === email)

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })

    const { password: _, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}