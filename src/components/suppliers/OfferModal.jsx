import { useState } from 'react'
import Icon from '../icons'
import { AppButton } from '../ui/AppButton'

const CATEGORIES = ['Beads', 'Fabric', 'Packaging', 'Cosmetics', 'Food', 'Other']

const units = (category) =>
  ({
    Beads: 'bag',
    Fabric: 'yard',
    Packaging: 'unit',
    Cosmetics: 'kg',
    Food: 'kg',
  })[category] || 'unit'

const fmtGH = (n) => `GH₵ ${Number(n).toLocaleString()}`

function OfferModal({ open, onClose, onSubmit }) {
  const [product, setProduct] = useState('')
  const [category, setCategory] = useState('Other')
  const [unit, setUnit] = useState('unit')
  const [description, setDescription] = useState('')
  const [soloPrice, setSoloPrice] = useState('')
  const [groupPrice, setGroupPrice] = useState('')
  const [minOrders, setMinOrders] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const solo = Number(soloPrice)
  const group = Number(groupPrice)
  const min = Number(minOrders || 0)
  const validPrices = solo > 0 && group > 0 && group < solo
  const savePct = validPrices ? Math.round(((solo - group) / solo) * 100) : 0

  const selectCategory = (c) => {
    setCategory(c)
    setUnit(units(c))
  }

  const submit = async () => {
    const next = {}
    if (!product.trim()) next.product = 'Give your offer a clear product name'
    if (!(solo > 0)) next.soloPrice = 'Enter a solo price'
    if (!(group > 0)) next.groupPrice = 'Enter a group price'
    if (solo > 0 && group > 0 && group >= solo) next.groupPrice = 'Group price must be lower than solo'
    if (!(min >= 1)) next.minOrders = 'Minimum units must be 1 or more'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setBusy(true)
    try {
      await onSubmit({
        product: product.trim(),
        category,
        unit: unit.trim() || units(category),
        description: description.trim(),
        soloPrice: solo,
        groupPrice: group,
        minOrders: min,
      })
      onClose()
    } catch (e) {
      setErrors({ form: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="offer-overlay" role="dialog" aria-modal="true">
      <div className="offer-modal">
        <div className="offer-head">
          <div>
            <h2>List a bulk offer</h2>
            <p>
              You are the supplier. Other businesses on Prospera will team up to buy from you at
              your group price.
            </p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="offer-body">
          <label className="offer-field">
            <span>Product name</span>
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Handmade glass bead strands"
            />
            {errors.product && <em>{errors.product}</em>}
          </label>

          <div className="offer-row">
            <label className="offer-field">
              <span>Category</span>
              <select value={category} onChange={(e) => selectCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="offer-field">
              <span>Unit</span>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="bag, yard, kg…"
              />
            </label>
          </div>

          <label className="offer-field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Quality notes, delivery area, lead time…"
            />
          </label>

          <div className="offer-row">
            <label className="offer-field">
              <span>Solo price per unit</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={soloPrice}
                onChange={(e) => setSoloPrice(e.target.value)}
                placeholder="35"
              />
              {errors.soloPrice && <em>{errors.soloPrice}</em>}
            </label>
            <label className="offer-field">
              <span>Group price per unit</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={groupPrice}
                onChange={(e) => setGroupPrice(e.target.value)}
                placeholder="24"
              />
              {errors.groupPrice && <em>{errors.groupPrice}</em>}
            </label>
            <label className="offer-field">
              <span>Units to unlock</span>
              <input
                type="number"
                min="1"
                step="1"
                value={minOrders}
                onChange={(e) => setMinOrders(e.target.value)}
                placeholder="5"
              />
              {errors.minOrders && <em>{errors.minOrders}</em>}
            </label>
          </div>

          <div className={`offer-rule ${validPrices ? 'offer-rule-ok' : ''}`}>
            <Icon name="target" size={16} />
            <span>
              {validPrices
                ? `Buyers save ${savePct}% per unit when ${min} units are committed (${fmtGH(
                    group
                  )} vs ${fmtGH(solo)}).`
                : 'Set a group price below the solo price so the deal is worth it.'}
            </span>
          </div>

          {errors.form && <div className="offer-error">{errors.form}</div>}

          <div className="offer-actions">
            <AppButton variant="ghost" onClick={onClose}>
              Cancel
            </AppButton>
            <AppButton variant="dark" onClick={submit} disabled={busy}>
              {busy ? 'Listing…' : 'List my offer'}
              <Icon name="plus" size={16} />
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfferModal