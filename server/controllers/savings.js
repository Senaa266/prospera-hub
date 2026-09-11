import { db } from '../db.js'

const rowToCircle = (r, filled) => ({
  id: r.id,
  name: r.name,
  amount: r.amount,
  period: r.period,
  members: r.total_members,
  filled,
  visibility: r.visibility,
  status: r.status,
  description: '',
})

function filledFor(circleId, total) {
  const { n } = db
    .prepare('SELECT COUNT(*) AS n FROM savings_members WHERE circle_id = ?')
    .get(circleId)
  const base = Math.floor((Number(total) || 0) * 0.7)
  return Math.min(total, base + n)
}

export function listCircles(req, res) {
  const rows = db.prepare('SELECT * FROM savings_circles ORDER BY id').all()
  const circles = rows.map((r) => rowToCircle(r, filledFor(r.id, r.total_members)))
  res.json({ circles })
}

export function createCircle(req, res) {
  const { name, amount, period, members, visibility } = req.body

  if (!name || !amount) {
    return res.status(400).json({ message: 'Circle name and amount are required' })
  }

  const total = Math.max(Number(members) || 5, 2)
  const info = db
    .prepare(
      `INSERT INTO savings_circles (name, amount, period, total_members, visibility)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, String(amount), period || 'weekly', total, visibility || 'Public')

  const row = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ circle: rowToCircle(row, filledFor(row.id, row.total_members)) })
}

export function joinCircle(req, res) {
  const { circleId } = req.body
  const id = Number(circleId)
  const row = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(id)

  if (!row) {
    return res.status(404).json({ message: 'Circle not found' })
  }

  if (filledFor(id, row.total_members) >= row.total_members) {
    return res.status(400).json({ message: 'Circle is full' })
  }

  db.prepare('INSERT OR IGNORE INTO savings_members (circle_id, user_id) VALUES (?, ?)').run(
    id,
    req.user.id
  )
  res.json({ circle: rowToCircle(row, filledFor(id, row.total_members)) })
}