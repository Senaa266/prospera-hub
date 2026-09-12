import { db } from '../db.js'

const SEED_NAMES = {
  '-1': 'Kofi Mensah',
  '-2': 'Ama Asante',
  '-3': 'Esi Owusu',
  '-4': 'Yaw Boateng',
}

function nameFor(userId) {
  if (!userId) return 'Guest buyer'
  if (userId > 0) {
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId)
    if (user) return user.name
  }
  return SEED_NAMES[String(userId)] || `Buyer #${userId}`
}

function groupOr404(res, id) {
  const group = db.prepare('SELECT * FROM supplier_groups WHERE id = ?').get(Number(id))
  if (!group) {
    res.status(404).json({ message: 'Supplier group not found' })
    return null
  }
  return group
}

function discountPct(solo, group) {
  if (!solo) return 0
  return Math.round(((solo - group) / solo) * 100)
}

function ordersFor(groupId) {
  return db.prepare('SELECT * FROM supplier_orders WHERE group_id = ? ORDER BY host DESC, id').all(groupId)
}

function activeUnits(groupId) {
  const { n } = db
    .prepare('SELECT COALESCE(SUM(qty), 0) AS n FROM supplier_orders WHERE group_id = ? AND status = ?')
    .get(groupId, 'active')
  return Number(n)
}

function reduceMembers(groupId) {
  const rows = ordersFor(groupId)
  const total = rows.filter((r) => r.status === 'active').reduce((s, r) => s + r.qty, 0) || 1
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: nameFor(r.user_id),
    qty: r.qty,
    sharePct: r.status === 'active' ? Math.round((r.qty / total) * 100) : 0,
    status: r.status,
    isHost: Boolean(r.host),
    note: r.note || '',
    joined: r.created_at,
  }))
}

function toDirectory(g, viewerId) {
  const total = activeUnits(g.id)
  const members = ordersFor(g.id)
  const myOrder = members.find((m) => m.user_id === viewerId)
  const amHost = Boolean(myOrder?.host) && myOrder.status === 'active'
  const pending = members.filter((m) => m.status === 'pending')
  return {
    id: g.id,
    product: g.product,
    supplier: g.supplier,
    category: g.category || 'General',
    unit: g.unit || 'unit',
    description: g.description || '',
    soloPrice: g.solo_price,
    groupPrice: g.group_price,
    minOrders: g.min_orders,
    discountPct: discountPct(g.solo_price, g.group_price),
    committedUnits: total,
    activeMembers: members.filter((m) => m.status === 'active').length,
    pendingCount: amHost ? pending.length : 0,
    pendingUnits: amHost ? pending.reduce((s, p) => s + p.qty, 0) : 0,
    unlocked: total >= g.min_orders,
    status: g.status,
    myStatus: myOrder ? myOrder.status : 'none',
    myOrder: myOrder
      ? { status: myOrder.status, qty: myOrder.qty, isHost: Boolean(myOrder.host) }
      : null,
    amHost,
    createdAt: g.created_at,
  }
}

export function listSupplierGroups(req, res) {
  const groups = db
    .prepare("SELECT * FROM supplier_groups WHERE status = 'open' ORDER BY id")
    .all()
    .map((g) => toDirectory(g, req.user.id))
  res.json({ supplierGroups: groups })
}

export function getSupplierGroup(req, res) {
  const group = groupOr404(res, req.params.id)
  if (!group) return

  const members = reduceMembers(group.id)
  const myOrder = members.find((m) => m.userId === req.user.id) || null
  const amHost = Boolean(myOrder?.isHost) && myOrder.status === 'active'
  const total = activeUnits(group.id)

  const messages = db
    .prepare('SELECT * FROM supplier_thread WHERE group_id = ? ORDER BY id ASC')
    .all(group.id)
    .map((m) => ({
      id: m.id,
      channel: m.channel,
      senderType: m.sender_type,
      senderName: m.sender_type === 'supplier' ? m.sender_name : nameFor(m.sender_user_id),
      senderId: m.sender_user_id,
      text: m.message,
      createdAt: m.created_at,
    }))

  res.json({
    me: req.user.id,
    group: {
      ...toDirectory(group, req.user.id),
      members,
      myOrder,
      amHost,
      committedValue: group.group_price * total,
      soloValue: group.solo_price * total,
      messages,
    },
  })
}

export function createSupplierGroup(req, res) {
  const { product, supplier, category, unit, description, soloPrice, groupPrice, minOrders } = req.body

  if (!product || !soloPrice || !groupPrice || !minOrders) {
    return res.status(400).json({ message: 'Product, prices and min orders are required' })
  }

  const info = db
    .prepare(
      `INSERT INTO supplier_groups (product, supplier, category, unit, description, solo_price, group_price, min_orders, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')`
    )
    .run(
      product,
      supplier || 'Group supplier',
      category || 'General',
      unit || 'unit',
      description || '',
      Number(soloPrice),
      Number(groupPrice),
      Math.max(Number(minOrders), 1)
    )

  const group = db.prepare('SELECT * FROM supplier_groups WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ group: toDirectory(group, req.user.id) })
}

export function joinSupplierGroup(req, res) {
  const { groupId, qty, note } = req.body
  const group = groupOr404(res, groupId)
  if (!group) return
  if (group.status !== 'open') {
    return res.status(400).json({ message: 'This group is closed' })
  }

  const existing = db
    .prepare('SELECT * FROM supplier_orders WHERE group_id = ? AND user_id = ?')
    .get(group.id, req.user.id)
  const members = ordersFor(group.id)
  const active = members.filter((m) => m.status === 'active')

  if (existing) {
    const isActive = existing.status === 'active'
    const isHost = Boolean(existing.host)
    const nextQty = Math.max(Number(qty) || existing.qty, 1)
    db.prepare('UPDATE supplier_orders SET qty = ?, note = ? WHERE id = ?').run(
      nextQty,
      note || existing.note || '',
      existing.id
    )
    const groupRow = {
      ...toDirectory(group, req.user.id),
      members: reduceMembers(group.id),
    }
    return res.json({
      result: 'updated',
      pending: !isActive && !isHost,
      group: groupRow,
      myOrder: { status: existing.status, qty: nextQty, isHost },
    })
  }

  let status = 'active'
  let host = 0
  if (active.length > 0) {
    const isHostAlready = active.some((m) => m.user_id === req.user.id)
    if (!isHostAlready) status = 'pending'
  } else {
    host = 1
  }

  db.prepare(
    'INSERT INTO supplier_orders (group_id, user_id, qty, host, status, note) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    group.id,
    req.user.id,
    Math.max(Number(qty) || 1, 1),
    host,
    status,
    note || ''
  )

  const next = toDirectory(group, req.user.id)
  res.json({
    result: status === 'active' ? 'joined' : 'pending',
    pending: status === 'pending',
    amHost: Boolean(host),
    group: { ...next, members: reduceMembers(group.id) },
    myOrder: { status, isHost: Boolean(host) },
  })
}

function hostOnly(res, groupId, userId) {
  const order = db
    .prepare("SELECT * FROM supplier_orders WHERE group_id = ? AND user_id = ? AND host = 1 AND status = 'active'")
    .get(groupId, userId)
  if (!order) {
    res.status(403).json({ message: 'Only the host can do that' })
    return null
  }
  return order
}

export function approveMember(req, res) {
  const group = groupOr404(res, req.params.id)
  if (!group) return
  if (!hostOnly(res, group.id, req.user.id)) return

  const order = db.prepare('SELECT * FROM supplier_orders WHERE id = ? AND group_id = ?').get(Number(req.body.orderId), group.id)
  if (!order || order.status !== 'pending') {
    return res.status(404).json({ message: 'Pending request not found' })
  }

  db.prepare("UPDATE supplier_orders SET status = 'active' WHERE id = ?").run(order.id)
  res.json({
    ok: true,
    member: reduceMembers(group.id).find((m) => m.id === order.id),
    group: { ...toDirectory(group, req.user.id), members: reduceMembers(group.id) },
  })
}

export function rejectMember(req, res) {
  const group = groupOr404(res, req.params.id)
  if (!group) return
  if (!hostOnly(res, group.id, req.user.id)) return

  const order = db.prepare('SELECT * FROM supplier_orders WHERE id = ? AND group_id = ?').get(Number(req.body.orderId), group.id)
  if (!order || order.status !== 'pending') {
    return res.status(404).json({ message: 'Pending request not found' })
  }

  db.prepare('DELETE FROM supplier_orders WHERE id = ?').run(order.id)
  res.json({ ok: true, group: { ...toDirectory(group, req.user.id), members: reduceMembers(group.id) } })
}

export function updateShare(req, res) {
  const group = groupOr404(res, req.params.id)
  if (!group) return

  const order = db
    .prepare("SELECT * FROM supplier_orders WHERE group_id = ? AND user_id = ? AND status = 'active'")
    .get(group.id, req.user.id)
  if (!order) {
    return res.status(403).json({ message: 'Join the collaboration first' })
  }

  const qty = Math.max(Number(req.body.qty) || 1, 1)
  db.prepare('UPDATE supplier_orders SET qty = ? WHERE id = ?').run(qty, order.id)

  res.json({
    ok: true,
    qty,
    group: { ...toDirectory(group, req.user.id), members: reduceMembers(group.id) },
  })
}

export function getMessages(req, res) {
  const group = groupOr404(res, req.params.id)
  if (!group) return

  const messages = db
    .prepare('SELECT * FROM supplier_thread WHERE group_id = ? ORDER BY id ASC')
    .all(group.id)
    .map((m) => ({
      id: m.id,
      channel: m.channel,
      senderType: m.sender_type,
      senderName: m.sender_type === 'supplier' ? m.sender_name : nameFor(m.sender_user_id),
      senderId: m.sender_user_id,
      text: m.message,
      createdAt: m.created_at,
    }))

  res.json({ messages })
}

export function postMessage(req, res) {
  const group = groupOr404(res, req.params.id)
  if (!group) return

  const text = String(req.body.text || '').trim().slice(0, 800)
  if (!text) {
    return res.status(400).json({ message: 'Message is required' })
  }

  const channel = req.body.channel === 'supplier' ? 'supplier' : 'team'
  const info = db
    .prepare(
      'INSERT INTO supplier_thread (group_id, channel, sender_user_id, sender_type, sender_name, message) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(group.id, channel, req.user.id, 'buyer', nameFor(req.user.id), text)

  res.status(201).json({
    message: {
      id: info.lastInsertRowid,
      channel,
      senderType: 'buyer',
      senderName: nameFor(req.user.id),
      senderId: req.user.id,
      text,
      createdAt: new Date().toISOString(),
    },
  })
}