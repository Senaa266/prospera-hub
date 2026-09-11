const transactions = [
  { id: 1, userId: 1, type: 'income', desc: 'Necklace sales', amount: 450, date: '2026-09-10' },
  { id: 2, userId: 1, type: 'expense', desc: 'Beads purchase', amount: 200, date: '2026-09-09' },
  { id: 3, userId: 1, type: 'income', desc: 'Bracelet orders x5', amount: 300, date: '2026-09-08' },
  { id: 4, userId: 1, type: 'expense', desc: 'Packaging', amount: 50, date: '2026-09-07' },
]

/**
 * Builds a logged financial snapshot for Sena. Returns undefined when no books exist.
 * @param {number} userId
 */
export function getFinanceSnapshot(userId) {
  const userTransactions = transactions.filter((t) => t.userId === userId)
  if (userTransactions.length === 0) return undefined

  const revenue = userTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = userTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    currency: 'GH₵',
    revenue,
    expenses,
    profit: revenue - expenses,
    notes: `${userTransactions.length} logged transactions`,
    transactionCount: userTransactions.length,
  }
}

export function listTransactions(req, res) {
  const userTransactions = transactions.filter((t) => t.userId === req.user.id)
  res.json({ transactions: userTransactions })
}

export function addTransaction(req, res) {
  const { type, desc, amount, date } = req.body

  if (!type || !desc || !amount) {
    return res.status(400).json({ message: 'Type, description and amount are required' })
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ message: 'Type must be income or expense' })
  }

  const transaction = {
    id: transactions.length + 1,
    userId: req.user.id,
    type,
    desc,
    amount: Number(amount),
    date: date || new Date().toISOString().split('T')[0],
  }
  transactions.push(transaction)
  res.status(201).json({ transaction })
}

export function getReport(req, res) {
  const snapshot = getFinanceSnapshot(req.user.id)
  res.json({
    report: {
      totalIncome: snapshot?.revenue ?? 0,
      totalExpense: snapshot?.expenses ?? 0,
      profit: snapshot?.profit ?? 0,
      transactionCount: snapshot?.transactionCount ?? 0,
    },
  })
}