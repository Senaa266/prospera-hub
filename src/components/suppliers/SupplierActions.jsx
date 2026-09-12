import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'
import { ProgressBar } from '../ui/ProgressBar'
import { CHINA_AGENTS, statusTone } from '../../data/suppliers'

export function JoinOrderModal({ open, supplier, onClose, onJoin }) {
  const [qty, setQty] = useState('1')
  const [done, setDone] = useState(false)
  const amount = Math.max(Number(qty) || 1, 1)
  const needed = supplier?.minOrders || 1
  const nextCount = supplier ? supplier.currentOrders + amount : 0

  const close = () => {
    setQty('1')
    setDone(false)
    onClose?.()
  }

  if (!supplier) return null

  return (
    <Modal open={open} title={done ? 'You joined the group buy' : `Join ${supplier.name}`} onClose={close}>
      {done ? (
        <div className="grid gap-4">
          <p className="m-0 text-sm text-muted">
            {amount} unit{amount === 1 ? '' : 's'} added. The circle is now {Math.min(nextCount, needed)}/{needed}{' '}
            toward {supplier.groupPrice}.
          </p>
          <AppButton onClick={close}>Done</AppButton>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onJoin?.(supplier.id, amount)
            setDone(true)
          }}
        >
          <p className="m-0 text-sm text-muted">
            Lock in {supplier.groupPrice} instead of {supplier.soloPrice} once this order fills.
          </p>
          <ProgressBar value={(supplier.currentOrders / needed) * 100} label={`${supplier.name} progress`} />
          <label className="grid gap-1.5 text-sm font-semibold">
            Quantity
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="rounded-xl border border-line px-3 py-2.5" required />
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit">Commit {amount} to this order</AppButton>
            <AppButton variant="outline" onClick={close}>Cancel</AppButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

export function RequestStockModal({ open, supplier, initialSku = '', onClose, onSubmit }) {
  const [sku, setSku] = useState('')
  const [qty, setQty] = useState('2')
  const [note, setNote] = useState('')
  const [receipt, setReceipt] = useState('')

  useEffect(() => {
    if (open && supplier) setSku(initialSku || supplier.catalog[0]?.sku || '')
  }, [open, supplier, initialSku])

  const item = supplier?.catalog.find((row) => row.sku === sku) || supplier?.catalog[0]
  const amount = item ? item.price * Math.max(Number(qty) || 1, 1) : 0

  const close = () => {
    setQty('2')
    setNote('')
    setReceipt('')
    onClose?.()
  }

  if (!supplier) return null

  return (
    <Modal open={open} title={receipt ? 'Stock request sent' : `Request stock · ${supplier.name}`} onClose={close}>
      {receipt ? (
        <div className="grid gap-4">
          <p className="m-0 text-sm text-muted">
            {supplier.contactName} will confirm {item?.name} × {qty}. Reference <strong>{receipt}</strong>. Lead time:{' '}
            {supplier.leadTime}.
          </p>
          <AppButton onClick={close}>Done</AppButton>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const request = onSubmit?.(supplier.id, {
              item: item?.name || 'Stock',
              sku: item?.sku,
              qty: Math.max(Number(qty) || 1, 1),
              amount,
              note,
            })
            setReceipt(request?.id || `req-${Date.now()}`)
          }}
        >
          <label className="grid gap-1.5 text-sm font-semibold">
            Catalog item
            <select value={sku} onChange={(e) => setSku(e.target.value)} className="rounded-xl border border-line px-3 py-2.5">
              {supplier.catalog.map((row) => (
                <option key={row.sku} value={row.sku}>
                  {row.name} · GH₵ {row.price}/{row.unit}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Quantity ({item?.unit || 'units'}) · MOQ {item?.moq || 1}
            <input type="number" min={item?.moq || 1} value={qty} onChange={(e) => setQty(e.target.value)} className="rounded-xl border border-line px-3 py-2.5" required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Delivery note
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl border border-line px-3 py-2.5" placeholder="Pickup or delivery notes" />
          </label>
          <p className="m-0 text-sm text-muted">Estimated total GH₵ {amount.toLocaleString()}</p>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit">Send request</AppButton>
            <AppButton variant="outline" onClick={close}>Cancel</AppButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

export function ContactSupplierModal({ open, supplier, onClose, onSend }) {
  const [subject, setSubject] = useState('Stock availability')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  const close = () => {
    setSubject('Stock availability')
    setBody('')
    setSent(false)
    onClose?.()
  }

  if (!supplier) return null

  return (
    <Modal open={open} title={sent ? 'Message sent' : `Contact ${supplier.name}`} onClose={close} wide>
      {sent ? (
        <div className="grid gap-4">
          <p className="m-0 text-sm text-muted">{supplier.contactName} usually replies during {supplier.hours}.</p>
          <AppButton onClick={close}>Done</AppButton>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSend?.(supplier.id, { subject, body, to: supplier.email })
            setSent(true)
          }}
        >
          <dl className="grid gap-2 rounded-2xl bg-canvas px-4 py-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Contact</dt>
              <dd className="m-0 font-semibold">{supplier.contactName}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="m-0"><a className="font-semibold text-prospera" href={`tel:${supplier.phone}`}>{supplier.phone}</a></dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="m-0"><a className="font-semibold text-prospera" href={`mailto:${supplier.email}`}>{supplier.email}</a></dd>
            </div>
            <div>
              <dt className="text-muted">Hours</dt>
              <dd className="m-0 font-semibold">{supplier.hours}</dd>
            </div>
          </dl>
          <label className="grid gap-1.5 text-sm font-semibold">
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-line px-3 py-2.5" required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Message
            <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} className="rounded-xl border border-line px-3 py-2.5" required placeholder={`Hi ${supplier.contactName}, I need…`} />
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit">Send in Prospera</AppButton>
            <AppButton as="a" variant="outline" href={`https://wa.me/${supplier.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</AppButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

export function OrderHistoryModal({ open, supplier, onClose }) {
  if (!supplier) return null
  return (
    <Modal open={open} title={`Order history · ${supplier.name}`} onClose={onClose} wide>
      {supplier.history.length === 0 ? (
        <p className="m-0 text-sm text-muted">No orders yet with this supplier.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 font-semibold">Ref</th>
                <th className="py-2 pr-3 font-semibold">Item</th>
                <th className="py-2 pr-3 font-semibold">Amount</th>
                <th className="py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {supplier.history.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 pr-3">{row.date}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{row.id}</td>
                  <td className="py-2.5 pr-3">{row.item}</td>
                  <td className="py-2.5 pr-3">{row.amount ? `GH₵ ${row.amount}` : '—'}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(row.status)}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

export function ListNeedModal({ open, onClose, onSubmit }) {
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [budget, setBudget] = useState('')
  const [done, setDone] = useState(false)

  const close = () => {
    setProduct('')
    setQty('')
    setBudget('')
    setDone(false)
    onClose?.()
  }

  return (
    <Modal open={open} title={done ? 'Need posted' : 'List a product need'} onClose={close}>
      {done ? (
        <div className="grid gap-4">
          <p className="m-0 text-sm text-muted">Other businesses can join this need from Find group orders.</p>
          <AppButton onClick={close}>Done</AppButton>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit?.({ product, qty: Number(qty), budget: Number(budget) || 0 })
            setDone(true)
          }}
        >
          <label className="grid gap-1.5 text-sm font-semibold">
            What do you need?
            <input value={product} onChange={(e) => setProduct(e.target.value)} className="rounded-xl border border-line px-3 py-2.5" required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Quantity
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className="rounded-xl border border-line px-3 py-2.5" required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Budget cap (GH₵, optional)
            <input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="rounded-xl border border-line px-3 py-2.5" />
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit">Post need</AppButton>
            <AppButton variant="outline" onClick={close}>Cancel</AppButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

export function FindOrdersModal({ open, suppliers, needs, onClose, onJoin }) {
  return (
    <Modal open={open} title="Find group orders" onClose={onClose} wide>
      <div className="grid gap-3">
        {suppliers.map((supplier) => {
          const pct = Math.min(100, Math.round((supplier.currentOrders / supplier.minOrders) * 100))
          const filling = supplier.currentOrders < supplier.minOrders
          return (
            <article key={supplier.id} className="rounded-2xl border border-line bg-canvas p-4">
              <div className="mb-2 flex justify-between gap-2">
                <div>
                  <h3 className="m-0 text-base font-bold">{supplier.category}</h3>
                  <p className="mb-0 mt-1 text-sm text-muted">{supplier.name}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${filling ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                  {filling ? 'Filling' : 'Ready'}
                </span>
              </div>
              <ProgressBar value={pct} label={`${supplier.name} fill`} className="mb-2" />
              <p className="m-0 mb-3 text-sm text-muted">{supplier.currentOrders}/{supplier.minOrders} · group {supplier.groupPrice}</p>
              <div className="flex flex-wrap gap-2">
                <AppButton as={Link} to={`/suppliers/${supplier.id}`} variant="outline" onClick={onClose}>View supplier</AppButton>
                <AppButton onClick={() => onJoin(supplier)}>Join this order</AppButton>
              </div>
            </article>
          )
        })}
        {needs.length > 0 && (
          <ul className="m-0 grid list-none gap-2 p-0">
            {needs.map((need) => (
              <li key={need.id} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
                <strong>{need.product}</strong> · qty {need.qty}
                {need.budget ? ` · cap GH₵ ${need.budget}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}

export function ChinaAgentsModal({ open, onClose }) {
  const [agentId, setAgentId] = useState('')
  const agent = CHINA_AGENTS.find((item) => item.id === agentId)

  const close = () => {
    setAgentId('')
    onClose?.()
  }

  return (
    <Modal open={open} title={agent ? agent.name : 'China supplier access'} onClose={close} wide>
      {!agent ? (
        <div className="grid gap-3">
          <p className="m-0 text-sm text-muted">Liaison desks that source and ship at group rates.</p>
          {CHINA_AGENTS.map((item) => (
            <button key={item.id} type="button" onClick={() => setAgentId(item.id)} className="rounded-2xl border border-line bg-canvas px-4 py-3 text-left hover:border-prospera">
              <strong className="block">{item.name}</strong>
              <span className="text-sm text-muted">{item.city} · {item.focus}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          <p className="m-0 text-sm text-muted">{agent.leadTime} · MOQ {agent.moq}</p>
          <div className="flex flex-wrap gap-2">
            <AppButton as="a" href={`tel:${agent.phone}`}>Call {agent.phone}</AppButton>
            <AppButton as="a" variant="outline" href={`mailto:${agent.email}`}>Email</AppButton>
            <AppButton variant="ghost" onClick={() => setAgentId('')}>Back to desks</AppButton>
          </div>
        </div>
      )}
    </Modal>
  )
}
