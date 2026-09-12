import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import AIOffer from '../components/AIOffer'
import Icon from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { suppliers as suppliersApi } from '../api/client'
import { AppButton } from '../components/ui/AppButton'
import OfferModal from '../components/suppliers/OfferModal'
import './Feature.css'
import './Suppliers.css'

const formatGH = (n) => `GH₵ ${Number(n).toLocaleString()}`

const CATEGORY_ICONS = {
  Beads: 'sparkles',
  Fabric: 'rocket',
  Packaging: 'bookmark',
  Cosmetics: 'shield',
  Food: 'target',
}

function CategoryIcon({ category }) {
  const name = CATEGORY_ICONS[category] || 'wallet'
  return <Icon name={name} size={18} />
}

function Suppliers() {
  const { token, user } = useAuth()
  const [searchParams] = useSearchParams()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('discount')
  const [active, setActive] = useState(null)
  const [offerOpen, setOfferOpen] = useState(false)
  const autoOpenedRef = useRef(false)

  const openGroup = useCallback(
    async (id) => {
      try {
        const data = await suppliersApi.detail(id, token)
        setActive(data)
      } catch (e) {
        setError(e.message)
      }
    },
    [token]
  )

  const load = useCallback(async () => {
    try {
      const data = await suppliersApi.list(token)
      setGroups(data.supplierGroups)
      if (!autoOpenedRef.current) {
        autoOpenedRef.current = true
        const gid = searchParams.get('group')
        if (gid) {
          const g = data.supplierGroups.find((x) => String(x.id) === gid)
          if (g) await openGroup(g.id)
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, searchParams, openGroup])

  useEffect(() => {
    load()
  }, [load])

  const closeGroup = () => {
    setActive(null)
    load()
  }

  const createOffer = useCallback(
    async (payload) => {
      await suppliersApi.createGroup(payload, token)
      await load()
    },
    [token, load]
  )

  const categories = useMemo(() => {
    const set = [...new Set(groups.map((g) => g.category))]
    set.sort()
    return ['All', ...set]
  }, [groups])

  const myCollabs = useMemo(
    () => groups.filter((g) => g.myStatus === 'active' || g.myStatus === 'pending'),
    [groups]
  )
  const myOffers = useMemo(() => groups.filter((g) => g.amSupplier), [groups])
  const approvals = useMemo(() => groups.filter((g) => g.pendingCount > 0), [groups])

  const filtered = useMemo(() => {
    let list = groups
    if (category !== 'All') list = list.filter((g) => g.category === category)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (g) =>
          g.product.toLowerCase().includes(q) ||
          g.supplier.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      if (sort === 'price') return a.groupPrice - b.groupPrice
      if (sort === 'progress') return b.committedUnits / b.minOrders - a.committedUnits / a.minOrders
      return b.discountPct - a.discountPct
    })
  }, [groups, category, query, sort])

  const avgDiscount = useMemo(() => {
    if (groups.length === 0) return 0
    return Math.round(groups.reduce((s, g) => s + g.discountPct, 0) / groups.length)
  }, [groups])

  const mySavings = useMemo(() => {
    let value = 0
    for (const g of myCollabs) {
      if (g.myStatus !== 'active' || !g.unlocked) continue
      if (typeof g.myOrder?.qty === 'number') {
        value += g.myOrder.qty * (g.soloPrice - g.groupPrice)
      }
    }
    return value
  }, [myCollabs])

  const myUnitsToUnlock = useMemo(() => {
    let units = 0
    for (const g of myCollabs) {
      if (g.myStatus !== 'active') continue
      units += Math.max(g.minOrders - g.committedUnits, 0)
    }
    return units
  }, [myCollabs])

  const approvalsTitle = (g) =>
    g.pendingCount === 1
      ? `1 buyer wants in · ${g.pendingUnits} unit${g.pendingUnits === 1 ? '' : 's'}`
      : `${g.pendingCount} buyers want in · ${g.pendingUnits} units`

  return (
    <div className="feature-page">
      <Sidebar />
      <main className="feature-main">
        <div className="feature-header suppliers-header">
          <div>
            <h1>Peer Supplier</h1>
            <p>
              Every business here can buy and sell. List your own bulk offer, or team up with other
              owners to hit a supplier&apos;s group price — the supplier is on Prospera with you.
            </p>
          </div>
          <div className="supplier-actions">
            <AppButton variant="dark" onClick={() => setOfferOpen(true)}>
              <Icon name="plus" size={15} />
              List a bulk offer
            </AppButton>
          </div>
        </div>

        <div className="supplier-stats">
          <div className="supplier-stat">
            <Icon name="chart" size={20} />
            <div>
              <span>Avg group discount</span>
              <strong>{avgDiscount}%</strong>
            </div>
          </div>
          <div className="supplier-stat">
            <Icon name="users" size={20} />
            <div>
              <span>Your collaborations</span>
              <strong>{myCollabs.length}</strong>
            </div>
          </div>
          <div className="supplier-stat">
            <Icon name="target" size={20} />
            <div>
              <span>Units to unlock</span>
              <strong>{myUnitsToUnlock}</strong>
            </div>
          </div>
          <div className="supplier-stat">
            <Icon name="wallet" size={20} />
            <div>
              <span>Projected monthly savings</span>
              <strong>{formatGH(mySavings)}</strong>
            </div>
          </div>
        </div>

        {error && <div className="supplier-error">{error}</div>}

        {approvals.length > 0 && (
          <section className="approvals-panel">
            <div className="approvals-title">
              <Icon name="shield" size={18} />
              <h2>Buyers waiting on your approval</h2>
            </div>
            <div className="approvals-list">
              {approvals.map((g) => (
                <div className="approval-row" key={g.id}>
                  <div>
                    <strong>{g.product}</strong>
                    <span>{approvalsTitle(g)}</span>
                  </div>
                  <button className="btn-primary-dark" type="button" onClick={() => openGroup(g.id)}>
                    Review
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {myOffers.length > 0 && (
          <>
            <h2 className="section-title">Your offers</h2>
            <div className="my-collabs">
              {myOffers.map((g) => (
                <button
                  type="button"
                  className="my-collab"
                  key={`offer-${g.id}`}
                  onClick={() => openGroup(g.id)}
                >
                  <CategoryIcon category={g.category} />
                  <div>
                    <strong>{g.product}</strong>
                    <span>
                      {g.pendingCount > 0
                        ? `${g.pendingCount} request${g.pendingCount === 1 ? '' : 's'} to review`
                        : g.unlocked
                          ? 'Unlocked — confirm the deal'
                          : `${g.minOrders - g.committedUnits} more unit${
                              g.minOrders - g.committedUnits === 1 ? '' : 's'
                            } to unlock`}
                    </span>
                  </div>
                  <span
                    className={`my-collab-state ${
                      g.pendingCount > 0 ? 'state-pending' : g.unlocked ? 'state-unlocked' : 'state-active'
                    }`}
                  >
                    {g.pendingCount > 0 ? 'Approvals' : g.unlocked ? 'Unlocked' : 'Open'}
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            </div>
          </>
        )}

        {myCollabs.length > 0 && (
          <>
            <h2 className="section-title">Your collaborations</h2>
            <div className="my-collabs">
              {myCollabs.map((g) => (
                <button
                  type="button"
                  className="my-collab"
                  key={`${g.id}-${g.myStatus}`}
                  onClick={() => openGroup(g.id)}
                >
                  <CategoryIcon category={g.category} />
                  <div>
                    <strong>{g.product}</strong>
                    <span>
                      {g.myStatus === 'pending'
                        ? 'Awaiting the supplier’s approval'
                        : 'Split board & chat'}
                    </span>
                  </div>
                  <span
                    className={`my-collab-state ${
                      g.myStatus === 'pending' ? 'state-pending' : 'state-active'
                    }`}
                  >
                    {g.myStatus}
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            </div>
          </>
        )}

        <div className="supplier-toolbar">
          <div className="search-box">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products or suppliers"
            />
          </div>
          <div className="sort-box">
            <Icon name="sort" size={17} />
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="discount">Biggest discount</option>
              <option value="price">Lowest group price</option>
              <option value="progress">Closest to unlock</option>
            </select>
          </div>
        </div>

        <div className="category-chips">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${category === c ? 'chip-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <h2 className="section-title">Browse group buys</h2>
        {loading ? (
          <div className="supplier-loading">Loading suppliers…</div>
        ) : filtered.length === 0 ? (
          <div className="supplier-empty">
            No products match "{query}". Try another search — or list your own offer above.
          </div>
        ) : (
          <div className="suppliers-grid">
            {filtered.map((g) => {
              const pct = Math.min((g.committedUnits / g.minOrders) * 100, 100)
              const cta = g.amSupplier
                ? 'Manage offer'
                : g.myStatus === 'pending'
                  ? 'View request'
                  : g.myStatus === 'active'
                    ? 'Open your buy'
                    : 'Team up'
              return (
                <div className="supplier-card" key={g.id}>
                  <div className="supplier-badge">Save {g.discountPct}%</div>
                  <h3>{g.product}</h3>
                  <p className="supplier-name">
                    {g.supplier} · {g.category}
                    {g.supplierUserId ? (
                      <span className="spp-chip spp-chip-app">on Prospera</span>
                    ) : (
                      <span className="spp-chip">marketplace supplier</span>
                    )}
                  </p>
                  <div className="price-comparison">
                    <div className="price-old">
                      <span>Solo price</span>
                      <strong>
                        {formatGH(g.soloPrice)} / {g.unit}
                      </strong>
                    </div>
                    <div className="price-new">
                      <span>Group price</span>
                      <strong>
                        {formatGH(g.groupPrice)} / {g.unit}
                      </strong>
                    </div>
                  </div>
                  <div className="order-progress">
                    <span>
                      {g.unlocked
                        ? `${g.committedUnits}/${g.minOrders} units committed — unlocked`
                        : `${g.committedUnits}/${g.minOrders} units — still ${Math.max(
                            g.minOrders - g.committedUnits,
                            0
                          )} to unlock`}
                    </span>
                    <div className="progress-bar">
                      <div className={g.unlocked ? 'bar-unlocked' : ''} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="card-members">
                    <Icon name="users" size={14} />
                    {g.activeMembers} buyer{g.activeMembers === 1 ? '' : 's'}
                    {g.amSupplier && <span className="chip-chip chip-you">your offer</span>}
                    {g.myStatus === 'pending' && (
                      <span className="chip-chip chip-wait">request sent</span>
                    )}
                    {g.myStatus === 'active' && <span className="chip-chip chip-in">you&apos;re in</span>}
                  </div>
                  <button className="btn-join" type="button" onClick={() => openGroup(g.id)}>
                    {cta}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="steps-strip">
          <div className="step">
            <span>1</span>
            <strong>Pick a deal</strong>
            <p>Browse offers listed by businesses on Prospera or your local marketplace.</p>
          </div>
          <div className="step">
            <span>2</span>
            <strong>Team up</strong>
            <p>State your units. The supplier approves you and the group moves closer to the price.</p>
          </div>
          <div className="step">
            <span>3</span>
            <strong>Unlock & get it</strong>
            <p>When enough units are committed the group price unlocks, the supplier fulfills, and each buyer&apos;s purchase lands in their Finance.</p>
          </div>
        </div>

        <AIOffer
          title="Selling in bulk too?"
          text="Ask Sena to price an offer, estimate how many committed buyers you need, or compare your margins against the marketplace."
          cta="Ask your coach"
        />
      </main>

      {active && (
        <CollabModal
          data={active}
          me={user?.id}
          token={token}
          onClose={closeGroup}
          onChanged={load}
        />
      )}

      <OfferModal open={offerOpen} onClose={() => setOfferOpen(false)} onSubmit={createOffer} />
    </div>
  )
}

function CollabModal({ data, me, token, onClose, onChanged }) {
  const [group, setGroup] = useState(data.group)
  const isSupplier = Boolean(group.amSupplier)
  const [channel, setChannel] = useState(isSupplier ? 'supplier' : 'team')
  const [text, setText] = useState('')
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [group.messages.length, channel])

  const act = async (fn) => {
    setBusy(true)
    setMsg('')
    try {
      const res = await fn()
      if (res?.group) setGroup(res.group)
      onChanged()
    } catch (e) {
      setMsg(e.message)
    } finally {
      setBusy(false)
    }
  }

  const doJoin = () => act(() => suppliersApi.join(group.id, qty, note, token))

  const doSend = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const res = await suppliersApi.sendMessage(group.id, trimmed, channel, token)
      setGroup((g) => ({ ...g, messages: [...g.messages, res.message] }))
      setText('')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setBusy(false)
    }
  }

  const changeShare = (delta) => {
    const next = Math.max(group.myOrder.qty + delta, 1)
    act(() => suppliersApi.updateShare(group.id, next, token))
  }

  const doApprove = (member) => act(() => suppliersApi.approve(group.id, member.id, token))
  const doReject = (member) => act(() => suppliersApi.reject(group.id, member.id, token))
  const doFulfill = () =>
    act(async () => {
      const res = await suppliersApi.fulfill(group.id, token)
      setMsg(`Deal done — ${res.notes.length} buyer${res.notes.length === 1 ? '' : 's'} billed at group price.`)
      return res
    })

  const copyInvite = () => {
    const url = `${window.location.origin}/suppliers?group=${group.id}`
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const pct = Math.min((group.committedUnits / group.minOrders) * 100, 100)
  const channelMessages = group.messages.filter((m) => m.channel === channel)
  const isActive = group.myOrder?.status === 'active'
  const pendingMembers = group.members.filter((m) => m.status === 'pending')
  const fulfilled = group.status === 'fulfilled'

  return (
    <div className="collab-overlay" role="dialog" aria-modal="true">
      <div className="collab-modal">
        <div className="collab-head">
          <div>
            <h2>{group.product}</h2>
            <p>
              {group.supplier} · {formatGH(group.soloPrice)} → {formatGH(group.groupPrice)} /{' '}
              {group.unit} · save {group.discountPct}%
            </p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="collab-body">
          <div className="collab-left">
            {fulfilled && (
              <div className="fulfilled-banner">
                <Icon name="check" size={16} />
                <span>
                  Deal fulfilled {formatDate(group.fulfilledAt)}. Purchases were recorded in each
                  buyer&apos;s Finance.
                </span>
              </div>
            )}

            <div className="unlock-panel">
              <div className="unlock-line">
                <span>
                  {group.unlocked
                    ? `Unlocked — group price of ${formatGH(group.groupPrice)} / ${group.unit}`
                    : `${group.committedUnits}/${group.minOrders} ${
                        group.unit === 'yard' ? 'yards' : 'units'
                      } committed`}
                </span>
                <span className="unlock-pct">{Math.round(pct)}%</span>
              </div>
              <div className="progress-bar">
                <div className={group.unlocked ? 'bar-unlocked' : ''} style={{ width: `${pct}%` }} />
              </div>
              <p>
                {isSupplier
                  ? group.unlocked
                    ? `The deal is live. Confirm it to bill ${group.activeMembers} buyer${
                        group.activeMembers === 1 ? '' : 's'
                      } at ${formatGH(group.groupPrice)} / ${group.unit} and close the offer.`
                    : `${Math.max(group.minOrders - group.committedUnits, 0)} more ${
                        group.unit === 'yard' ? 'yards' : 'units'
                      } to unlock — share the link or answer buyers in chat.`
                  : group.unlocked
                    ? `Live. Your share costs ${formatGH(
                        (group.myOrder?.qty || qty) * group.groupPrice
                      )} — ${formatGH((group.myOrder?.qty || 0) * (group.soloPrice - group.groupPrice))} saved vs buying alone.`
                    : `${Math.max(group.minOrders - group.committedUnits, 0)} more ${
                        group.unit === 'yard' ? 'yards' : 'units'
                      } to unlock — every committed unit lowers the price for everyone.`}
              </p>

              {isSupplier && !fulfilled && (
                <div className="fulfill-cta">
                  <button
                    className="btn-primary-dark"
                    type="button"
                    disabled={busy || !group.unlocked}
                    onClick={doFulfill}
                  >
                    {group.unlocked
                      ? 'Confirm order & fulfill'
                      : `Waiting on ${Math.max(group.minOrders - group.committedUnits, 0)} more units`}
                  </button>
                </div>
              )}
            </div>

            {isSupplier && pendingMembers.length > 0 && (
              <div className="approvals-inline">
                <div className="split-head">
                  <h3>Requests to approve</h3>
                  <span>{pendingMembers.length} waiting</span>
                </div>
                <div className="split-board">
                  {pendingMembers.map((m) => (
                    <div className="split-row split-pending" key={m.id}>
                      <div className="split-avatar">{m.name.charAt(0)}</div>
                      <div className="split-info">
                        <div className="split-name">
                          <strong>{m.name}</strong>
                          <span className="pending-tag">pending</span>
                        </div>
                        <div className="split-detail">
                          <span>
                            {m.qty} {group.unit === 'yard' ? 'yd' : group.unit}
                            {m.qty > 1 ? 's' : ''}
                            {group.unlocked && <span className="cost"> · {formatGH(m.qty * group.groupPrice)}</span>}
                          </span>
                        </div>
                        {m.note && <div className="split-note">"{m.note}"</div>}
                      </div>
                      <div className="split-actions">
                        <button className="approve-btn" type="button" disabled={busy} onClick={() => doApprove(m)}>
                          <Icon name="check" size={15} /> Approve
                        </button>
                        <button
                          className="reject-btn"
                          type="button"
                          disabled={busy}
                          onClick={() => doReject(m)}
                          aria-label="Reject request"
                        >
                          <Icon name="x" size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="split-head">
              <h3>{isSupplier ? 'Buyers in this buy' : 'Split board'}</h3>
              <span>
                {group.activeMembers} buyer{group.activeMembers === 1 ? '' : 's'} · shares are
                instant
              </span>
            </div>

            <div className="split-board">
              {group.members.filter((m) => m.status !== 'pending' || isSupplier).map((m) => {
                const isMe = m.userId === me
                return (
                  <div
                    className={`split-row ${isMe ? 'split-me' : ''} ${m.status === 'pending' ? 'split-pending' : ''}`}
                    key={m.id}
                  >
                    <div className="split-avatar">{m.name.charAt(0)}</div>
                    <div className="split-info">
                      <div className="split-name">
                        <strong>
                          {m.name}
                          {isMe && <span className="you-tag">you</span>}
                        </strong>
                        {m.status === 'pending' && <span className="pending-tag">pending</span>}
                      </div>
                      <div className="split-detail">
                        <span>
                          {m.qty} {group.unit === 'yard' ? 'yd' : group.unit}
                          {m.qty > 1 ? 's' : ''}
                        </span>
                        {m.status === 'active' && <span>{m.sharePct}% of the buy</span>}
                        {m.status === 'active' && group.unlocked && (
                          <span className="cost">{formatGH(m.qty * group.groupPrice)}</span>
                        )}
                      </div>
                      {m.note && <div className="split-note">"{m.note}"</div>}
                    </div>
                    {isMe && m.status === 'active' && !isSupplier && (
                      <div className="split-actions">
                        <div className="qty-stepper">
                          <button type="button" disabled={busy || m.qty <= 1} onClick={() => changeShare(-1)}>
                            −
                          </button>
                          <span>{m.qty}</span>
                          <button type="button" disabled={busy} onClick={() => changeShare(1)}>
                            +
                          </button>
                        </div>
                      </div>
                    )}
                    {isMe && m.status === 'pending' && (
                      <div className="split-actions">
                        <span className="waiting-tag">Awaiting supplier</span>
                      </div>
                    )}
                  </div>
                )
              })}
              {group.members.length === 0 && (
                <div className="supplier-empty">No buyers yet — share your invite link to start.</div>
              )}
            </div>

            {!group.myOrder && !isSupplier && !fulfilled && (
              <div className="join-panel">
                <h3>{group.supplierUserId ? 'Request to join this buy' : 'Join this group buy'}</h3>
                <p>
                  Tell the supplier how many {group.unit === 'yard' ? 'yards' : 'units'} you need
                  {group.supplierUserId
                    ? ' — they will approve you before the count moves.'
                    : ' — your units count toward the unlock right away.'}
                </p>
                <div className="join-controls">
                  <div className="qty-stepper">
                    <button type="button" onClick={() => setQty(Math.max(qty - 1, 1))}>
                      −
                    </button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => setQty(qty + 1)}>
                      +
                    </button>
                  </div>
                  <input
                    className="note-input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Need 2 bags, can collect this week"
                  />
                </div>
                <button className="btn-primary-dark" type="button" disabled={busy} onClick={doJoin}>
                  {group.supplierUserId ? 'Send request' : 'Join group buy'}
                </button>
                {msg && <div className="modal-msg">{msg}</div>}
              </div>
            )}

            {isActive && (
              <div className="share-calc">
                <span>{group.unlocked ? 'Your cost at group price' : 'Your cost once unlocked'}</span>
                <strong>
                  {formatGH(group.myOrder.qty * group.groupPrice)}
                  <small>
                    {' '}
                    (solo: {formatGH(group.myOrder.qty * group.soloPrice)})
                  </small>
                </strong>
              </div>
            )}

            {!isSupplier && (
              <button className="invite-btn" type="button" onClick={copyInvite}>
                <Icon name="copy" size={15} />
                {copied ? 'Invite link copied' : 'Copy invite link to grow the group'}
              </button>
            )}

            {!group.unlocked && !fulfilled && (
              <div className="tip-box">
                <Icon name="sparkles" size={16} />
                {isSupplier
                  ? 'Drop a message in the chat or share your invite link to bring in the buyers you need.'
                  : 'Invite a partner or bump your share to cross the unlock line — everyone pays less.'}
              </div>
            )}
          </div>

          <div className="collab-chat">
            <div className="chat-tabs">
              {!isSupplier && (
                <button
                  type="button"
                  className={channel === 'team' ? 'tab-active' : ''}
                  onClick={() => setChannel('team')}
                >
                  Buyers
                </button>
              )}
              <button
                type="button"
                className={channel === 'supplier' ? 'tab-active' : ''}
                onClick={() => setChannel('supplier')}
              >
                Supplier
              </button>
            </div>
            <div className="chat-thread" ref={chatRef}>
              {channelMessages.length === 0 && (
                <div className="chat-empty">
                  {channel === 'supplier'
                    ? `Talk to ${isSupplier ? 'buyers' : group.supplier} about quantities, lead time and delivery.`
                    : 'Coordinate with other buyers — who takes how much, and who lifts what.'}
                </div>
              )}
              {channelMessages.map((m) => (
                <div
                  className={`msg-row ${
                    m.senderType === 'supplier'
                      ? 'msg-supplier'
                      : m.senderId === me
                        ? 'msg-me'
                        : 'msg-them'
                  }`}
                  key={m.id}
                >
                  <div className="msg-name">
                    {m.senderName}
                    {m.senderType === 'supplier' && <span className="supplier-bubble">supplier</span>}
                    {m.senderId === me && <span className="you-bubble">you</span>}
                  </div>
                  <div className="msg-bubble">{m.text}</div>
                  <div className="msg-time">{formatTime(m.createdAt)}</div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    doSend()
                  }
                }}
                placeholder={
                  channel === 'supplier'
                    ? `Message ${isSupplier ? 'your buyers' : group.supplier}…`
                    : 'Message other buyers…'
                }
              />
              <button type="button" disabled={busy || !text.trim()} onClick={doSend} aria-label="Send">
                <Icon name="send" size={17} />
              </button>
            </div>
          </div>
        </div>

        {msg && !fulfilled && <div className="modal-msg modal-msg-foot">{msg}</div>}
        {fulfilled && <div className="modal-msg modal-msg-foot modal-msg-ok">{msg}</div>}
      </div>
    </div>
  )
}

function formatTime(value) {
  try {
    const d = new Date(`${value}Z`)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(`${value}`.replace('Z', '')).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return value
  }
}

export default Suppliers