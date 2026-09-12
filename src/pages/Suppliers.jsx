import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import AIOffer from '../components/AIOffer'
import Icon from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { suppliers as suppliersApi } from '../api/client'
import { useSuppliers } from '../hooks/useSuppliers'
import { AppButton } from '../components/ui/AppButton'
import FindOrdersModal from '../components/suppliers/FindOrdersModal'
import JoinOrderModal from '../components/suppliers/JoinOrderModal'
import ListNeedModal from '../components/suppliers/ListNeedModal'
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
  const autoOpenedRef = useRef(false)
  const { needs, suppliers: portalSuppliers, addNeed, joinOrder } = useSuppliers()
  const [portal, setPortal] = useState('')
  const [portalSupplier, setPortalSupplier] = useState(null)

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

  const openPortal = (type, supplier = null) => {
    setPortalSupplier(supplier)
    setPortal(type)
  }

  const closePortal = () => {
    setPortal('')
    setPortalSupplier(null)
  }

  const categories = useMemo(() => {
    const set = [...new Set(groups.map((g) => g.category))]
    set.sort()
    return ['All', ...set]
  }, [groups])

  const myCollabs = useMemo(
    () => groups.filter((g) => g.myStatus === 'active' || g.myStatus === 'pending'),
    [groups]
  )
  const hosting = useMemo(() => groups.filter((g) => g.pendingCount > 0), [groups])

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

  const hostingTitle = (g) =>
    g.pendingCount === 1
      ? `1 pending request · ${g.pendingUnits} unit${g.pendingUnits === 1 ? '' : 's'}`
      : `${g.pendingCount} pending requests · ${g.pendingUnits} units`

  return (
    <div className="feature-page">
      <Sidebar />
      <main className="feature-main">
        <div className="feature-header suppliers-header">
          <div>
            <h1>Peer Supplier</h1>
            <p>
              Can't buy in bulk alone? Team up with similar businesses, bargain your split, and
              unlock supplier group prices together.
            </p>
          </div>
          <div className="supplier-actions">
            <AppButton variant="outline" onClick={() => openPortal('need')}>
              <Icon name="plus" size={15} />
              List a product need
            </AppButton>
            <AppButton variant="dark" onClick={() => openPortal('find')}>
              <Icon name="search" size={15} />
              Find group orders
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

        {hosting.length > 0 && (
          <section className="approvals-panel">
            <div className="approvals-title">
              <Icon name="shield" size={18} />
              <h2>Needs your approval as host</h2>
            </div>
            <div className="approvals-list">
              {hosting.map((g) => (
                <div className="approval-row" key={g.id}>
                  <div>
                    <strong>{g.product}</strong>
                    <span>{hostingTitle(g)}</span>
                  </div>
                  <button className="btn-primary-dark" type="button" onClick={() => openGroup(g.id)}>
                    Review
                  </button>
                </div>
              ))}
            </div>
          </section>
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
                      {g.myStatus === 'pending' ? 'Awaiting host approval' : 'Split board & chat'}
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

        <h2 className="section-title">Browse group orders</h2>
        {loading ? (
          <div className="supplier-loading">Loading suppliers…</div>
        ) : filtered.length === 0 ? (
          <div className="supplier-empty">
            No products match "{query}". Try a different search or category.
          </div>
        ) : (
          <div className="suppliers-grid">
            {filtered.map((g) => {
              const pct = Math.min((g.committedUnits / g.minOrders) * 100, 100)
              return (
                <div className="supplier-card" key={g.id}>
                  <div className="supplier-badge">Save {g.discountPct}%</div>
                  <h3>{g.product}</h3>
                  <p className="supplier-name">
                    {g.supplier} · {g.category}
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
                    {g.activeMembers} collab{g.activeMembers === 1 ? 'or' : 'ors'}
                    {g.myStatus === 'pending' && <span className="chip-chip">request pending</span>}
                  </div>
                  <button className="btn-join" type="button" onClick={() => openGroup(g.id)}>
                    {g.myStatus === 'active'
                      ? 'Open your collab'
                      : g.myStatus === 'pending'
                      ? 'View request'
                      : 'Team up'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="steps-strip">
          <div className="step">
            <span>1</span>
            <strong>Pick a product</strong>
            <p>Search verified suppliers offering group rates.</p>
          </div>
          <div className="step">
            <span>2</span>
            <strong>Request to join</strong>
            <p>State how many units you want and your split.</p>
          </div>
          <div className="step">
            <span>3</span>
            <strong>Bargain & chat</strong>
            <p>Adjust shares, invite partners, talk to the supplier, then unlock the deal.</p>
          </div>
        </div>

        <AIOffer
          title="Not sure how to price your share?"
          text="Ask Sena to work out your cheapest unit cost, fair split, or reorder plan with the group price baked in."
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

      <ListNeedModal open={portal === 'need'} onClose={closePortal} onSubmit={addNeed} />
      <FindOrdersModal
        open={portal === 'find'}
        suppliers={portalSuppliers}
        needs={needs}
        onClose={closePortal}
        onJoin={(supplier) => openPortal('join', supplier)}
      />
      <JoinOrderModal
        open={portal === 'join'}
        supplier={portalSupplier}
        onClose={closePortal}
        onJoin={(supplierId, qty) => {
          joinOrder(supplierId, qty)
          closePortal()
        }}
      />
    </div>
  )
}

function CollabModal({ data, me, token, onClose, onChanged }) {
  const [group, setGroup] = useState(data.group)
  const [channel, setChannel] = useState('team')
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
                {group.unlocked
                  ? `The group deal is live. Total group value ${formatGH(
                      group.committedValue
                    )} vs ${formatGH(group.soloValue)} buying alone.`
                  : `${Math.max(group.minOrders - group.committedUnits, 0)} more ${
                      group.unit === 'yard' ? 'yards' : 'units'
                    } to unlock — invite a partner or bump your share.`}
              </p>
            </div>

            <div className="split-head">
              <h3>Split board</h3>
              <span>
                {group.activeMembers} member{group.activeMembers === 1 ? '' : 's'} · swaps are
                instant
              </span>
            </div>

            <div className="split-board">
              {group.members.map((m) => {
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
                        {m.isHost && <span className="host-tag">host</span>}
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
                    {group.amHost && m.status === 'pending' && !isMe && (
                      <div className="split-actions">
                        <button
                          className="approve-btn"
                          type="button"
                          disabled={busy}
                          onClick={() => doApprove(m)}
                        >
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
                    )}
                    {isMe && m.status === 'active' && (
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
                        <span className="waiting-tag">Waiting for host</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {!group.myOrder && (
              <div className="join-panel">
                <h3>Join this collaboration</h3>
                <p>
                  Tell the host how many {group.unit === 'yard' ? 'yards' : 'units'} you need and how
                  you'd like to split it.
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
                    placeholder="e.g. Happy with 50/50, need it next week"
                  />
                </div>
                <button className="btn-primary-dark" type="button" disabled={busy} onClick={doJoin}>
                  {group.activeMembers === 0 ? 'Start this group' : 'Request to join'}
                </button>
                {msg && <div className="modal-msg">{msg}</div>}
              </div>
            )}

            {isActive && (
              <div className="share-calc">
                <span>Your cost at group price</span>
                <strong>
                  {formatGH(group.myOrder.qty * group.groupPrice)}
                  <small>
                    {' '}
                    (solo: {formatGH(group.myOrder.qty * group.soloPrice)})
                  </small>
                </strong>
              </div>
            )}

            <button className="invite-btn" type="button" onClick={copyInvite}>
              <Icon name="copy" size={15} />
              {copied ? 'Invite link copied' : 'Copy invite link to add collaborators'}
            </button>

            {!group.unlocked && (
              <div className="tip-box">
                <Icon name="sparkles" size={16} />
                Tip: bump your share or invite a partner to cross the unlock line — everyone pays less.
              </div>
            )}
          </div>

          <div className="collab-chat">
            <div className="chat-tabs">
              <button
                type="button"
                className={channel === 'team' ? 'tab-active' : ''}
                onClick={() => setChannel('team')}
              >
                Team
              </button>
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
                  Start the conversation {channel === 'supplier' ? 'with the supplier' : 'with your team'} —
                  clarify quantities, timings and who lifts what.
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
                  channel === 'supplier' ? `Message ${group.supplier}…` : 'Message your collaborators…'
                }
              />
              <button type="button" disabled={busy || !text.trim()} onClick={doSend} aria-label="Send">
                <Icon name="send" size={17} />
              </button>
            </div>
          </div>
        </div>

        {msg && <div className="modal-msg modal-msg-foot">{msg}</div>}
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

export default Suppliers