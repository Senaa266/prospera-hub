import { useState } from 'react'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'

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
          <p className="m-0 text-sm text-muted">
            Other businesses can join this need and unlock a group price. It now appears under Find group
            orders.
          </p>
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
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            What do you need?
            <input
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder="e.g. Kraft mailer bags"
              className="rounded-xl border border-line px-3 py-2.5"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Quantity
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              className="rounded-xl border border-line px-3 py-2.5"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Budget cap (GH₵, optional)
            <input
              type="number"
              min="0"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              className="rounded-xl border border-line px-3 py-2.5"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit">Post need</AppButton>
            <AppButton variant="outline" onClick={close}>
              Cancel
            </AppButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default ListNeedModal
