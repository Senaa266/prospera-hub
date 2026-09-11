import { Link } from 'react-router-dom'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'
import { ProgressBar } from '../ui/ProgressBar'

export function FindOrdersModal({ open, suppliers, needs, onClose, onJoin }) {
  return (
    <Modal open={open} title="Find group orders" onClose={onClose} wide>
      <div className="grid gap-3">
        {suppliers.map((supplier) => {
          const pct = Math.min(100, Math.round((supplier.currentOrders / supplier.minOrders) * 100))
          const openBuy = supplier.currentOrders < supplier.minOrders
          return (
            <article key={supplier.id} className="rounded-2xl border border-line bg-canvas p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="m-0 text-base font-bold text-ink-strong">{supplier.category}</h3>
                  <p className="mb-0 mt-1 text-sm text-muted">{supplier.name}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    openBuy ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {openBuy ? 'Filling' : 'Ready'}
                </span>
              </div>
              <ProgressBar value={pct} label={`${supplier.name} fill`} className="mb-2" />
              <p className="m-0 mb-3 text-sm text-muted">
                {supplier.currentOrders}/{supplier.minOrders} · group {supplier.groupPrice}
              </p>
              <div className="flex flex-wrap gap-2">
                <AppButton as={Link} to={`/suppliers/${supplier.id}`} variant="outline" onClick={onClose}>
                  View supplier
                </AppButton>
                <AppButton
                  onClick={() => {
                    onJoin(supplier)
                  }}
                >
                  Join this order
                </AppButton>
              </div>
            </article>
          )
        })}

        {needs.length > 0 && (
          <section>
            <h3 className="mb-2 mt-2 text-sm font-bold text-ink-strong">Posted needs</h3>
            <ul className="m-0 grid list-none gap-2 p-0">
              {needs.map((need) => (
                <li key={need.id} className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
                  <strong>{need.product}</strong> · qty {need.qty}
                  {need.budget ? ` · cap GH₵ ${need.budget}` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  )
}

export default FindOrdersModal
