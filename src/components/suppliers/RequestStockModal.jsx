import { useEffect, useState } from 'react'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'

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
          <p className="m-0 text-sm leading-6 text-muted">
            {supplier.contactName} will confirm {item?.name} × {qty}. Reference{' '}
            <strong className="text-ink">{receipt}</strong>. Typical lead time: {supplier.leadTime}.
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
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Catalog item
            <select
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              className="rounded-xl border border-line px-3 py-2.5"
            >
              {supplier.catalog.map((row) => (
                <option key={row.sku} value={row.sku}>
                  {row.name} · GH₵ {row.price}/{row.unit}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Quantity ({item?.unit || 'units'}) · MOQ {item?.moq || 1}
            <input
              type="number"
              min={item?.moq || 1}
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              className="rounded-xl border border-line px-3 py-2.5"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Delivery note
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Pickup in Accra, or deliver to my stall…"
              className="rounded-xl border border-line px-3 py-2.5 font-medium"
            />
          </label>
          <p className="m-0 text-sm text-muted">Estimated total GH₵ {amount.toLocaleString()} at solo price.</p>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit">Send request</AppButton>
            <AppButton variant="outline" onClick={close}>
              Cancel
            </AppButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default RequestStockModal
