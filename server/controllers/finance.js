const transactions = []

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
  const userTransactions = transactions.filter((t) => t.userId === req.user.id)
  const income = userTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expense = userTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  res.json({
    report: {
      totalIncome: income,
      totalExpense: expense,
      profit: income - expense,
      transactionCount: userTransactions.length,
    },
  })
}