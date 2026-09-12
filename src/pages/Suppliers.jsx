import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChinaAgentsModal,
  ContactSupplierModal,
  FindOrdersModal,
  JoinOrderModal,
  ListNeedModal,
  OrderHistoryModal,
  RequestStockModal,
} from '../components/suppliers/SupplierActions'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useSuppliers } from '../hooks/useSuppliers'

function Suppliers() {
  const { suppliers, needs, joinOrder, requestStock, sendMessage, addNeed } = useSuppliers()
  const [joinTarget, setJoinTarget] = useState(null)
  const [stockTarget, setStockTarget] = useState(null)
  const [contactTarget, setContactTarget] = useState(null)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [needOpen, setNeedOpen] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [chinaOpen, setChinaOpen] = useState(false)

  return (
    <PageShell wide>
      <PageHeader
        title="Peer"
        accent="Supplier"
        subtitle="Need a product but can't afford bulk? Team up with similar businesses and unlock supplier discounts together."
        actions={
          <>
            <AppButton variant="dark" onClick={() => setNeedOpen(true)}>
              List a product need
            </AppButton>
            <AppButton variant="outline" onClick={() => setFindOpen(true)}>
              Find group orders
            </AppButton>
          </>
        }
      />

      <h2 className="mb-4 mt-0 text-lg font-bold text-ink-strong">Active group orders</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {suppliers.map((supplier) => {
          const pct = Math.min(100, Math.round((supplier.currentOrders / supplier.minOrders) * 100))
          const filling = supplier.currentOrders < supplier.minOrders
          return (
            <AppCard key={supplier.id} className="relative overflow-hidden">
              <span className="absolute right-4 top-4 rounded-full bg-prospera px-2.5 py-1 text-xs font-bold text-white">
                Save {supplier.discount}
              </span>
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">{supplier.region}</p>
              <h3 className="mb-1 mt-1 pr-20 text-xl font-bold text-ink-strong">{supplier.category}</h3>
              <p className="mb-4 mt-0 text-sm text-muted">Supplier: {supplier.name}</p>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-canvas px-3 py-2">
                  <span className="block text-xs text-muted">Solo price</span>
                  <strong className="text-sm line-through decoration-rose-400">{supplier.soloPrice}</strong>
                </div>
                <div className="rounded-xl bg-prospera-soft px-3 py-2">
                  <span className="block text-xs text-muted">Group price</span>
                  <strong className="text-sm text-prospera-dark">{supplier.groupPrice}</strong>
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-1.5 flex justify-between text-xs font-semibold text-muted">
                  <span>
                    {supplier.currentOrders}/{supplier.minOrders} orders needed
                  </span>
                  <span className={filling ? 'text-amber-700' : 'text-emerald-700'}>{pct}%</span>
                </div>
                <ProgressBar value={pct} label={`${supplier.name} fill`} />
              </div>
              <div className="flex flex-wrap gap-2">
                <AppButton as={Link} to={`/suppliers/${supplier.id}`} variant="outline">
                  View supplier
                </AppButton>
                <AppButton onClick={() => setJoinTarget(supplier)}>Join this order</AppButton>
                <AppButton variant="ghost" onClick={() => setStockTarget(supplier)}>
                  Request stock
                </AppButton>
                <AppButton variant="ghost" onClick={() => setContactTarget(supplier)}>
                  Contact
                </AppButton>
                <AppButton variant="ghost" onClick={() => setHistoryTarget(supplier)}>
                  Order history
                </AppButton>
              </div>
            </AppCard>
          )
        })}
      </div>

      <AppCard className="mt-6 bg-linear-to-br from-indigo-50 to-prospera-soft/70">
        <h4 className="m-0 text-ink-strong">China supplier access</h4>
        <p className="mb-4 mt-2 text-sm leading-6 text-muted">
          Looking for products from China? Browse liaison desks that source and ship at group-discounted rates.
        </p>
        <AppButton variant="dark" onClick={() => setChinaOpen(true)}>
          Browse China agents
        </AppButton>
      </AppCard>

      <JoinOrderModal
        open={Boolean(joinTarget)}
        supplier={joinTarget}
        onClose={() => setJoinTarget(null)}
        onJoin={joinOrder}
      />
      <RequestStockModal
        open={Boolean(stockTarget)}
        supplier={stockTarget}
        onClose={() => setStockTarget(null)}
        onSubmit={requestStock}
      />
      <ContactSupplierModal
        open={Boolean(contactTarget)}
        supplier={contactTarget}
        onClose={() => setContactTarget(null)}
        onSend={sendMessage}
      />
      <OrderHistoryModal
        open={Boolean(historyTarget)}
        supplier={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
      <ListNeedModal open={needOpen} onClose={() => setNeedOpen(false)} onSubmit={addNeed} />
      <FindOrdersModal
        open={findOpen}
        suppliers={suppliers}
        needs={needs}
        onClose={() => setFindOpen(false)}
        onJoin={(supplier) => {
          setFindOpen(false)
          setJoinTarget(supplier)
        }}
      />
      <ChinaAgentsModal open={chinaOpen} onClose={() => setChinaOpen(false)} />
    </PageShell>
  )
}

export default Suppliers
