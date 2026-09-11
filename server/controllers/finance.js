import { db } from '../db.js'

const toRow = (t) => ({ id: t.id, type: t.type, desc: t.description, amount: t.amount, date: t.date })

/**
 * Builds a logged financial snapshot for the user's own transactions.
 * Returns undefined when the user has no books logged yet.
 * @param {number} userId
 */
export function getFinanceSnapshot(userId) {
  const rows = db
    .prepare('SELECT type, amount FROM transactions WHERE user_id = ?')
    .all(userId)
  if (rows.length === 0) return undefined

  const revenue = rows.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const expenses = rows.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

  return {
    currency: 'GH₵',
    revenue,
    expenses,
    profit: revenue - expenses,
    notes: `${rows.length} logged transactions`,
    transactionCount: rows.length,
  }
}

export function listTransactions(req, res) {
  const rows = db
    .prepare(
      `SELECT * FROM transactions
       WHERE user_id = ? OR user_id IS NULL
       ORDER BY date DESC, id DESC`
    )
    .all(req.user.id)
  res.json({ transactions: rows.map(toRow) })
}

export function addTransaction(req, res) {
  const { type, desc, amount, date } = req.body

  if (!type || !desc || !amount) {
    return res.status(400).json({ message: 'Type, description and amount are required' })
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ message: 'Type must be income or expense' })
  }

  const info = db
    .prepare(
      `INSERT INTO transactions (user_id, type, description, amount, date)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      type,
      String(desc),
      Number(amount),
      date || new Date().toISOString().split('T')[0]
    )

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ transaction: toRow(transaction) })
}

export function getReport(req, res) {
  const rows = db
    .prepare('SELECT type, amount FROM transactions WHERE user_id = ? OR user_id IS NULL')
    .all(req.user.id)

  const income = rows.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const expense = rows.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

  res.json({
    report: {
      totalIncome: income,
      totalExpense: expense,
      profit: income - expense,
      transactionCount: rows.length,
    },
  })
}