import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Icon from '../components/icons'
import './Feature.css'

function Finance() {
  const [entries] = useState([
    { date: '2026-09-10', type: 'income', desc: 'Necklace sales', amount: 450 },
    { date: '2026-09-09', type: 'expense', desc: 'Beads purchase', amount: 200 },
    { date: '2026-09-08', type: 'income', desc: 'Bracelet orders x5', amount: 300 },
    { date: '2026-09-07', type: 'expense', desc: 'Packaging', amount: 50 },
  ])

  const totalIncome = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0)
  const totalExpense = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0)
  const profit = totalIncome - totalExpense

  return (
    <div className="feature-page">
      <Sidebar />
      <main className="feature-main">
        <div className="feature-header">
          <h1>Financial Tracking</h1>
          <p>Log your expenses and revenue. Let AI give you insights and financial statements.</p>
        </div>

        <div className="finance-summary">
          <div className="fin-card income">
            <span>Total Revenue</span>
            <strong>GH₵ {totalIncome.toLocaleString()}</strong>
          </div>
          <div className="fin-card expense">
            <span>Total Expenses</span>
            <strong>GH₵ {totalExpense.toLocaleString()}</strong>
          </div>
          <div className="fin-card profit">
            <span>Profit</span>
            <strong>GH₵ {profit.toLocaleString()}</strong>
          </div>
        </div>

        <div className="finance-actions">
          <button className="btn-primary-dark" type="button">+ Add transaction</button>
          <button className="btn-ai-link" type="button">
            <Icon name="sparkles" size={16} />
            AI financial report
          </button>
        </div>

        <table className="finance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}>
                <td>{e.date}</td>
                <td>
                  <span className={`type-badge ${e.type}`}>
                    {e.type === 'income' ? '↑ Income' : '↓ Expense'}
                  </span>
                </td>
                <td>{e.desc}</td>
                <td className={e.type === 'income' ? 'amount-income' : 'amount-red'}>
                  {e.type === 'income' ? '+' : '-'}GH₵ {e.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="info-box">
          <h4>AI Financial Advice</h4>
          <p>After adding at least 10 transactions, AI can generate a full financial statement, highlight spending patterns, and suggest improvements.</p>
        </div>
      </main>
    </div>
  )
}

export default Finance