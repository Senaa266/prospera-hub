import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ContactSupplierModal,
  JoinOrderModal,
  OrderHistoryModal,
  RequestStockModal,
} from '../components/suppliers/SupplierActions'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { ProgressBar } from '../components/ui/ProgressBar'
import { statusTone } from '../data/suppliers'
import { useSuppliers } from '../hooks/useSuppliers'

function SupplierDetail() {
  const { id } = useParams()
  const { suppliers, joinOrder, requestStock, sendMessage } = useSuppliers()
  const supplier = suppliers.find((item) => item.id === id)
  const [joinOpen, setJoinOpen] = useState(false)
  const [stockSku, setStockSku] = useState('')
  const [contactOpen, setContactOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  if (!supplier) {
    return (
      <PageShell>
        <PageHeader title="Supplier" accent="not found" subtitle="That desk is not in the network yet." />
        <AppButton as={Link} to="/suppliers" variant="outline">
          ← All suppliers
        </AppButton>
      </PageShell>
    )
  }

  const pct = Math.min(100, Math.round((supplier.currentOrders / supplier.minOrders) * 100))

  return (
    <PageShell wide>
      <AppButton as={Link} to="/suppliers" variant="ghost" className="mb-4 px-0 hover:bg-transparent">
        ← All suppliers
      </AppButton>

      <PageHeader
        title={supplier.name}
        accent={supplier.discount}
        subtitle={`${supplier.category} · ${supplier.region}`}
        actions={
          <>
            <AppButton onClick={() => setJoinOpen(true)}>Join this order</AppButton>
            <AppButton variant="outline" onClick={() => setStockSku(supplier.catalog[0]?.sku || '')}>
              Request stock
            </AppButton>
            <AppButton variant="ghost" onClick={() => setContactOpen(true)}>
              Contact
            </AppButton>
            <AppButton variant="ghost" onClick={() => setHistoryOpen(true)}>
              Order history
            </AppButton>
          </>
        }
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppCard>
          <span className="text-sm text-muted">Contact</span>
          <strong className="mt-1 block text-ink-strong">{supplier.contactName}</strong>
          <a className="mt-1 block text-sm font-semibold text-prospera no-underline" href={`tel:${supplier.phone}`}>
            {supplier.phone}
          </a>
          <a className="block text-sm text-muted no-underline hover:text-prospera" href={`mailto:${supplier.email}`}>
            {supplier.email}
          </a>
        </AppCard>
        <AppCard>
          <span className="text-sm text-muted">Location</span>
          <strong className="mt-1 block text-ink-strong">{supplier.address}</strong>
          <p className="mb-0 mt-1 text-sm text-muted">{supplier.hours}</p>
        </AppCard>
        <AppCard>
          <span className="text-sm text-muted">Delivery</span>
          <strong className="mt-1 block text-ink-strong">{supplier.delivery}</strong>
          <p className="mb-0 mt-1 text-sm text-muted">Lead time: {supplier.leadTime}</p>
        </AppCard>
        <AppCard>
          <span className="text-sm text-muted">Group buy</span>
          <strong className="mt-1 block text-ink-strong">
            {supplier.currentOrders}/{supplier.minOrders}
          </strong>
          <ProgressBar value={pct} label={`${supplier.name} fill`} className="mt-2" />
          <p className="mb-0 mt-2 text-sm text-muted">{supplier.moqNote}</p>
        </AppCard>
      </section>

      <AppCard className="mb-6">
        <h2 className="mb-1 mt-0 text-lg font-bold">Catalog & MOQ</h2>
        <p className="mb-4 mt-0 text-sm text-muted">
          Rated {supplier.rating} · {supplier.fulfilled} fulfilled orders
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3 font-semibold">SKU</th>
                <th className="py-2 pr-3 font-semibold">Item</th>
                <th className="py-2 pr-3 font-semibold">Solo</th>
                <th className="py-2 pr-3 font-semibold">Group</th>
                <th className="py-2 pr-3 font-semibold">MOQ</th>
                <th className="py-2 font-semibold"> </th>
              </tr>
            </thead>
            <tbody>
              {supplier.catalog.map((row) => (
                <tr key={row.sku} className="border-b border-line last:border-0">
                  <td className="py-2.5 pr-3 font-mono text-xs">{row.sku}</td>
                  <td className="py-2.5 pr-3">{row.name}</td>
                  <td className="py-2.5 pr-3">GH₵ {row.price}</td>
                  <td className="py-2.5 pr-3 font-semibold text-prospera-dark">GH₵ {row.groupPrice}</td>
                  <td className="py-2.5 pr-3">
                    {row.moq} {row.unit}
                  </td>
                  <td className="py-2.5">
                    <AppButton variant="outline" className="px-3 py-1.5 text-xs" onClick={() => setStockSku(row.sku)}>
                      Request
                    </AppButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>

      <AppCard className="overflow-x-auto p-0">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="m-0 text-lg font-bold">Fulfillment log</h2>
          <AppButton variant="ghost" onClick={() => setHistoryOpen(true)}>
            Full history
          </AppButton>
        </div>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-5 py-2 font-semibold">Date</th>
              <th className="px-5 py-2 font-semibold">Item</th>
              <th className="px-5 py-2 font-semibold">Amount</th>
              <th className="px-5 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {supplier.history.slice(0, 6).map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                <td className="px-5 py-2.5">{row.date}</td>
                <td className="px-5 py-2.5">{row.item}</td>
                <td className="px-5 py-2.5">{row.amount ? `GH₵ ${row.amount}` : '—'}</td>
                <td className="px-5 py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(row.status)}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppCard>

      <JoinOrderModal open={joinOpen} supplier={supplier} onClose={() => setJoinOpen(false)} onJoin={joinOrder} />
      <RequestStockModal
        open={Boolean(stockSku)}
        supplier={supplier}
        initialSku={stockSku}
        onClose={() => setStockSku('')}
        onSubmit={requestStock}
      />
      <ContactSupplierModal
        open={contactOpen}
        supplier={supplier}
        onClose={() => setContactOpen(false)}
        onSend={sendMessage}
      />
      <OrderHistoryModal open={historyOpen} supplier={supplier} onClose={() => setHistoryOpen(false)} />
    </PageShell>
  )
}

export default SupplierDetail
