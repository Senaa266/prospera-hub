import { useEffect, useState } from 'react'
import { useChat } from '../context/ChatContext'
import Icon from '../components/icons'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'

const STORAGE_KEY = 'prospera-finance-entries'

const STARTER = [
  { id: 'fin-1', date: '2026-09-10', type: 'income', desc: 'Necklace sales', amount: 450 },
  { id: 'fin-2', date: '2026-09-09', type: 'expense', desc: 'Beads purchase', amount: 200 },
  { id: 'fin-3', date: '2026-09-08', type: 'income', desc: 'Bracelet orders x5', amount: 300 },
  { id: 'fin-4', date: '2026-09-07', type: 'expense', desc: 'Packaging', amount: 50 },
]

function loadEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    /* ignore */
  }
  return STARTER
}

function Finance() {
  const { open } = useChat()
  const [entries, setEntries] = useState(loadEntries)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState({ date: '', type: 'income', desc: '', amount: '' })
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch {
      setSaveError('Could not save locally. Storage may be full.')
    }
  }, [entries])

  const totalIncome = entries.filter((e) => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)
  const totalExpense = entries.filter((e) => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
  const profit = totalIncome - totalExpense

  const addEntry = (event) => {
    event.preventDefault()
    setSaveError('')
    const amount = Number(draft.amount)
    if (!draft.date || !draft.desc || !amount) {
      setSaveError('Add a date, description, and amount before saving.')
      return
    }
    setEntries((current) => [
      { id: `fin-${Date.now()}`, ...draft, amount },
      ...current,
    ])
    setDraft({ date: '', type: 'income', desc: '', amount: '' })
    setShowForm(false)
  }

  return (
    <PageShell>
      <PageHeader
        title="Financial"
        accent="Tracking"
        subtitle="Log revenue and expenses locally on this device. Ask Sena for a statement when you have enough history."
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
        <AppButton
          variant="outline"
          onClick={() => open('Write a financial report from my logged sales and expenses.')}
        >
          <Icon name="sparkles" size={16} />
          AI financial report
        </AppButton>
      </div>

      {saveError ? (
        <p className="mb-4 text-sm font-semibold text-rose-700" role="alert">
          {saveError}
        </p>
      ) : null}

      {showForm && (
        <form
          onSubmit={addEntry}
          className="mb-5 grid gap-3 rounded-2xl border border-line bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-4"
        >
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Date
            <input
              type="date"
              required
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Type
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted">
            Description
            <input
              required
              placeholder="Necklace sales"
              value={draft.desc}
              onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
              className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink"
            />
          </label>
          <div className="grid gap-1">
            <label className="text-xs font-semibold text-muted" htmlFor="finance-amount">
              Amount (GH₵)
            </label>
            <div className="flex gap-2">
              <input
                id="finance-amount"
                required
                type="number"
                min="1"
                placeholder="450"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                className="min-w-0 flex-1 rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink"
              />
              <AppButton type="submit">Save</AppButton>
            </div>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <EmptyState
          icon="chart"
          title="No transactions yet"
          description="Log your first sale or expense to unlock totals and AI reporting."
          actionLabel="Add transaction"
          onAction={() => setShowForm(true)}
        />
      ) : (
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
              {entries.map((e) => (
                <tr key={e.id || `${e.date}-${e.desc}`} className="border-b border-line last:border-0 hover:bg-canvas">
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
      )}

      <AppCard className="mt-6 bg-prospera-soft/60">
        <h4 className="m-0 text-ink-strong">AI financial advice</h4>
        <p className="mb-0 mt-2 text-sm leading-6 text-muted">
          After you log more sales, Sena can draft a statement and flag spending patterns. Ask for a
          90-day cash plan when you are ready.
        </p>
      </AppCard>
    </PageShell>
  )
}

export default Finance
