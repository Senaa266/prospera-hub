import { useState } from 'react'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'
import { ProgressBar } from '../ui/ProgressBar'

export function JoinOrderModal({ open, supplier, onClose, onJoin }) {
  const [qty, setQty] = useState('1')
  const [done, setDone] = useState(false)
  const amount = Math.max(Number(qty) || 1, 1)
  const nextCount = supplier ? supplier.currentOrders + amount : 0
  const needed = supplier?.minOrders || 1

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
          <p className="m-0 text-sm leading-6 text-muted">
            {amount} unit{amount === 1 ? '' : 's'} added. The circle is now {Math.min(nextCount, needed)}/
            {needed} toward the group price of {supplier.groupPrice}.
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
          <ProgressBar
            value={(supplier.currentOrders / needed) * 100}
            label={`${supplier.name} group buy progress`}
          />
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Quantity
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              className="rounded-xl border border-line px-3 py-2.5 text-base font-medium"
              required
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit">Commit {amount} to this order</AppButton>
            <AppButton variant="outline" onClick={close}>
              Cancel
            </AppButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default JoinOrderModal
