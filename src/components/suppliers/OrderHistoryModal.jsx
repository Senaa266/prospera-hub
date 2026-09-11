import { Modal } from '../ui/Modal'
import { statusTone } from '../../data/suppliers'

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
                <th className="py-2 pr-3 font-semibold">Reference</th>
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
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(row.status)}`}>
                      {row.status}
                    </span>
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

export default OrderHistoryModal
