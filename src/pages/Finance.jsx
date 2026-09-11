import { useState } from 'react'
import { useChat } from '../context/ChatContext'
import Icon from '../components/icons'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'

const STARTER = [
  { date: '2026-09-10', type: 'income', desc: 'Necklace sales', amount: 450 },
  { date: '2026-09-09', type: 'expense', desc: 'Beads purchase', amount: 200 },
  { date: '2026-09-08', type: 'income', desc: 'Bracelet orders x5', amount: 300 },
  { date: '2026-09-07', type: 'expense', desc: 'Packaging', amount: 50 },
]

function Finance() {
  const { open } = useChat()
  const [entries, setEntries] = useState(STARTER)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState({ date: '', type: 'income', desc: '', amount: '' })

  const totalIncome = entries.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)
  const totalExpense = entries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
  const profit = totalIncome - totalExpense

  const addEntry = (event) => {
    event.preventDefault()
    const amount = Number(draft.amount)
    if (!draft.date || !draft.desc || !amount) return
    setEntries((current) => [{ ...draft, amount }, ...current])
    setDraft({ date: '', type: 'income', desc: '', amount: '' })
    setShowForm(false)
  }

  return (
    <PageShell>
      <PageHeader
        title="Financial"
        accent="Tracking"
        subtitle="Log revenue and expenses. Ask Sena for a statement when you have enough history."
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <AppCard className="border-emerald-100">
          <span className="text-sm text-muted">Total Revenue</span>
          <strong className="mt-1 block text-2xl text-emerald-700">GH₵ {totalIncome.toLocaleString()}</strong>
        </AppCard>
        <AppCard className="border-rose-100">
          <span className="text-sm text-muted">Total Expenses</span>
          <strong className="mt-1 block text-2xl text-rose-700">GH₵ {totalExpense.toLocaleString()}</strong>
        </AppCard>
        <AppCard>
          <span className="text-sm text-muted">Profit</span>
          <strong className="mt-1 block text-2xl text-ink-strong">GH₵ {profit.toLocaleString()}</strong>
        </AppCard>
      </section>

      <div className="mb-5 flex flex-wrap gap-2">
        <AppButton variant="dark" onClick={() => setShowForm((value) => !value)}>
          + Add transaction
        </AppButton>
        <AppButton variant="outline" onClick={() => open('Write a financial report from my logged sales and expenses.')}>
          <Icon name="sparkles" size={16} />
          AI financial report
        </AppButton>
      </div>

      {showForm && (
        <form
          onSubmit={addEntry}
          className="mb-5 grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)] sm:grid-cols-4"
        >
          <input
            type="date"
            required
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            className="rounded-xl border border-line px-3 py-2.5"
          />
          <select
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            className="rounded-xl border border-line px-3 py-2.5"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            required
            placeholder="Description"
            value={draft.desc}
            onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
            className="rounded-xl border border-line px-3 py-2.5"
          />
          <div className="flex gap-2">
            <input
              required
              type="number"
              min="1"
              placeholder="GH₵"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2.5"
            />
            <AppButton type="submit">Save</AppButton>
          </div>
        </form>
      )}

      <AppCard className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={`${e.date}-${e.desc}-${i}`} className="border-b border-line last:border-0 transition hover:bg-canvas">
                <td className="px-4 py-3">{e.date}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      e.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {e.type === 'income' ? '↑ Income' : '↓ Expense'}
                  </span>
                </td>
                <td className="px-4 py-3">{e.desc}</td>
                <td className={`px-4 py-3 font-semibold ${e.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {e.type === 'income' ? '+' : '-'}GH₵ {e.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppCard>

      <AppCard className="mt-6 bg-prospera-soft/60">
        <h4 className="m-0 text-ink-strong">AI financial advice</h4>
        <p className="mb-0 mt-2 text-sm leading-6 text-muted">
          After you log more sales, Sena can draft a statement and flag spending patterns. Ask for a
          90-day cash plan and she will also save a tracker on your dashboard.
        </p>
      </AppCard>
    </PageShell>
  )
}

export default Finance
