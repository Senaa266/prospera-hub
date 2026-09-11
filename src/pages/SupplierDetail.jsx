import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/icons'
import ContactSupplierModal from '../components/suppliers/ContactSupplierModal'
import JoinOrderModal from '../components/suppliers/JoinOrderModal'
import OrderHistoryModal from '../components/suppliers/OrderHistoryModal'
import RequestStockModal from '../components/suppliers/RequestStockModal'
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
  const [modal, setModal] = useState('')
  const [requestSku, setRequestSku] = useState('')

  if (!supplier) {
    return (
      <PageShell>
        <Link to="/suppliers" className="mb-4 inline-flex text-sm font-semibold text-muted no-underline hover:text-ink">
          ← Back to suppliers
        </Link>
        <AppCard className="text-center">
          <p className="m-0 font-semibold text-ink-strong">We could not find that supplier.</p>
          <AppButton as={Link} to="/suppliers" className="mt-4">
            Browse suppliers
          </AppButton>
        </AppCard>
      </PageShell>
    )
  }

  const pct = Math.min(100, Math.round((supplier.currentOrders / supplier.minOrders) * 100))

  return (
    <PageShell>
      <Link to="/suppliers" className="mb-4 inline-flex text-sm font-semibold text-muted no-underline hover:text-ink">
        ← All suppliers
      </Link>
      <PageHeader
        title={supplier.name}
        subtitle={`${supplier.category} · ${supplier.region}`}
        actions={
          <>
            <AppButton onClick={() => setModal('request')}>Request stock</AppButton>
            <AppButton variant="outline" onClick={() => setModal('contact')}>
              Contact
            </AppButton>
            <AppButton variant="ghost" onClick={() => setModal('history')}>
              Order history
            </AppButton>
          </>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppCard>
          <span className="text-sm text-muted">Contact</span>
          <strong className="mt-1 block">{supplier.contactName}</strong>
          <a className="text-sm font-semibold text-prospera" href={`tel:${supplier.phone}`}>
            {supplier.phone}
          </a>
        </AppCard>
        <AppCard>
          <span className="text-sm text-muted">Location</span>
          <strong className="mt-1 block">{supplier.address}</strong>
          <span className="text-sm text-muted">{supplier.region}</span>
        </AppCard>
        <AppCard>
          <span className="text-sm text-muted">Delivery</span>
          <strong className="mt-1 block">{supplier.delivery}</strong>
          <span className="text-sm text-muted">{supplier.leadTime}</span>
        </AppCard>
        <AppCard>
          <span className="text-sm text-muted">Reliability</span>
          <strong className="mt-1 block">{supplier.rating} / 5</strong>
          <span className="text-sm text-muted">{supplier.fulfilled} fulfilled orders</span>
        </AppCard>
      </section>

      <AppCard className="mb-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-bold">Open group buy</h2>
            <p className="mb-0 mt-1 text-sm text-muted">
              {supplier.currentOrders}/{supplier.minOrders} committed · {supplier.moqNote}
            </p>
          </div>
          <span className="rounded-full bg-prospera-soft px-3 py-1 text-xs font-bold text-prospera-dark">
            Save {supplier.discount}
          </span>
        </div>
        <ProgressBar value={pct} label={`${supplier.name} group buy`} className="mb-4" />
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-canvas px-3 py-2">
            Solo <strong className="block">{supplier.soloPrice}</strong>
          </div>
          <div className="rounded-xl bg-prospera-soft/70 px-3 py-2">
            Group <strong className="block">{supplier.groupPrice}</strong>
          </div>
        </div>
        <AppButton onClick={() => setModal('join')}>Join this order</AppButton>
      </AppCard>

      <h2 className="mb-3 text-lg font-bold text-ink-strong">Catalog</h2>
      <div className="mb-6 overflow-x-auto rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">Solo</th>
              <th className="px-4 py-3 font-semibold">Group</th>
              <th className="px-4 py-3 font-semibold">MOQ</th>
              <th className="px-4 py-3 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            {supplier.catalog.map((row) => (
              <tr key={row.sku} className="border-b border-line last:border-0 hover:bg-canvas">
                <td className="px-4 py-3 font-mono text-xs">{row.sku}</td>
                <td className="px-4 py-3">
                  {row.name}
                  <span className="block text-xs text-muted">per {row.unit}</span>
                </td>
                <td className="px-4 py-3">GH₵ {row.price}</td>
                <td className="px-4 py-3 font-semibold text-prospera-dark">GH₵ {row.groupPrice}</td>
                <td className="px-4 py-3">{row.moq}</td>
                <td className="px-4 py-3">
                  <AppButton
                    variant="outline"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() => {
                      setRequestSku(row.sku)
                      setModal('request')
                    }}
                  >
                    Request
                  </AppButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-lg font-bold text-ink-strong">Fulfillment log</h2>
      <AppCard className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {supplier.history.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                <td className="px-4 py-3">{row.item}</td>
                <td className="px-4 py-3">{row.amount ? `GH₵ ${row.amount}` : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(row.status)}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppCard>

      <p className="mt-4 text-sm text-muted">
        <Icon name="clock" size={14} /> Hours {supplier.hours} · Email{' '}
        <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
      </p>

      <JoinOrderModal
        open={modal === 'join'}
        supplier={supplier}
        onClose={() => setModal('')}
        onJoin={joinOrder}
      />
      <RequestStockModal
        open={modal === 'request'}
        supplier={supplier}
        initialSku={requestSku}
        onClose={() => {
          setModal('')
          setRequestSku('')
        }}
        onSubmit={requestStock}
      />
      <ContactSupplierModal
        open={modal === 'contact'}
        supplier={supplier}
        onClose={() => setModal('')}
        onSend={sendMessage}
      />
      <OrderHistoryModal open={modal === 'history'} supplier={supplier} onClose={() => setModal('')} />
    </PageShell>
  )
}

export default SupplierDetail
