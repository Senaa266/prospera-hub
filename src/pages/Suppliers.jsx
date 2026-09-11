import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/icons'
import ChinaAgentsModal from '../components/suppliers/ChinaAgentsModal'
import ContactSupplierModal from '../components/suppliers/ContactSupplierModal'
import FindOrdersModal from '../components/suppliers/FindOrdersModal'
import JoinOrderModal from '../components/suppliers/JoinOrderModal'
import ListNeedModal from '../components/suppliers/ListNeedModal'
import OrderHistoryModal from '../components/suppliers/OrderHistoryModal'
import RequestStockModal from '../components/suppliers/RequestStockModal'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useSuppliers } from '../hooks/useSuppliers'

function Suppliers() {
  const { suppliers, needs, joinOrder, requestStock, sendMessage, addNeed } = useSuppliers()
  const [active, setActive] = useState(null)
  const [modal, setModal] = useState('')

  const open = (type, supplier = null) => {
    setActive(supplier)
    setModal(type)
  }

  const close = () => {
    setModal('')
    setActive(null)
  }

  return (
    <PageShell>
      <PageHeader
        title="Peer"
        accent="Suppliers"
        subtitle="Team up on bulk buys, request stock, and keep every supplier conversation in one place."
        actions={
          <>
            <AppButton variant="dark" onClick={() => open('need')}>
              <Icon name="plus" size={15} />
              List a product need
            </AppButton>
            <AppButton variant="outline" onClick={() => open('find')}>
              <Icon name="search" size={15} />
              Find group orders
            </AppButton>
          </>
        }
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <AppCard>
          <span className="text-sm text-muted">Active desks</span>
          <strong className="mt-1 block text-2xl">{suppliers.length}</strong>
        </AppCard>
        <AppCard>
          <span className="text-sm text-muted">Open group buys</span>
          <strong className="mt-1 block text-2xl">
            {suppliers.filter((item) => item.currentOrders < item.minOrders).length}
          </strong>
        </AppCard>
        <AppCard>
          <span className="text-sm text-muted">Posted needs</span>
          <strong className="mt-1 block text-2xl">{needs.length}</strong>
        </AppCard>
      </section>

      <h2 className="mb-3 mt-6 text-lg font-bold text-ink-strong">Active group orders</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {suppliers.map((supplier) => {
          const pct = Math.min(100, Math.round((supplier.currentOrders / supplier.minOrders) * 100))
          const filling = supplier.currentOrders < supplier.minOrders
          return (
            <AppCard key={supplier.id} className="flex flex-col">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 text-lg font-bold text-ink-strong">{supplier.category}</h3>
                  <p className="mb-0 mt-1 text-sm text-muted">{supplier.name}</p>
                </div>
                <span className="rounded-full bg-prospera-soft px-2.5 py-1 text-xs font-bold text-prospera-dark">
                  Save {supplier.discount}
                </span>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-canvas px-3 py-2">
                  <span className="text-muted">Solo</span>
                  <strong className="block">{supplier.soloPrice}</strong>
                </div>
                <div className="rounded-xl bg-prospera-soft/70 px-3 py-2">
                  <span className="text-muted">Group</span>
                  <strong className="block">{supplier.groupPrice}</strong>
                </div>
              </div>
              <p className="mb-1 text-xs font-semibold text-muted">
                {supplier.currentOrders}/{supplier.minOrders} orders · {supplier.region}
              </p>
              <ProgressBar value={pct} label={`${supplier.name} group fill`} className="mb-4" />
              <div className="mt-auto grid grid-cols-2 gap-2">
                <AppButton as={Link} to={`/suppliers/${supplier.id}`} variant="dark">
                  View supplier
                </AppButton>
                <AppButton onClick={() => open('join', supplier)}>Join this order</AppButton>
                <AppButton variant="outline" onClick={() => open('request', supplier)}>
                  Request stock
                </AppButton>
                <AppButton variant="outline" onClick={() => open('contact', supplier)}>
                  Contact
                </AppButton>
                <AppButton
                  variant="ghost"
                  className="col-span-2"
                  onClick={() => open('history', supplier)}
                >
                  Order history
                </AppButton>
                <span className="sr-only">{filling ? 'Group buy still filling' : 'Group buy ready'}</span>
              </div>
            </AppCard>
          )
        })}
      </div>

      <AppCard className="mt-8">
        <h3 className="m-0 text-ink-strong">China supplier access</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          Liaison desks in Guangzhou, Yiwu, and Shenzhen can source and ship at group-discounted rates.
        </p>
        <AppButton className="mt-2" onClick={() => open('china')}>
          Browse China agents
        </AppButton>
      </AppCard>

      <JoinOrderModal
        open={modal === 'join'}
        supplier={active}
        onClose={close}
        onJoin={joinOrder}
      />
      <RequestStockModal
        open={modal === 'request'}
        supplier={active}
        onClose={close}
        onSubmit={requestStock}
      />
      <ContactSupplierModal
        open={modal === 'contact'}
        supplier={active}
        onClose={close}
        onSend={sendMessage}
      />
      <OrderHistoryModal open={modal === 'history'} supplier={active} onClose={close} />
      <ListNeedModal open={modal === 'need'} onClose={close} onSubmit={addNeed} />
      <FindOrdersModal
        open={modal === 'find'}
        suppliers={suppliers}
        needs={needs}
        onClose={close}
        onJoin={(supplier) => open('join', supplier)}
      />
      <ChinaAgentsModal open={modal === 'china'} onClose={close} />
    </PageShell>
  )
}

export default Suppliers
