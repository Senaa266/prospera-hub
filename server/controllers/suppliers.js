import { db } from '../db.js'

const rowToGroup = (g, orders) => ({
  id: g.id,
  product: g.product,
  supplier: g.supplier,
  soloPrice: g.solo_price,
  groupPrice: g.group_price,
  minOrders: g.min_orders,
  currentOrders: Math.min(g.min_orders, orders),
})

function ordersCount(groupId) {
  return db.prepare('SELECT COUNT(*) AS n FROM supplier_orders WHERE group_id = ?').get(groupId).n
}

export function listSupplierGroups(req, res) {
  const groups = db
    .prepare('SELECT * FROM supplier_groups ORDER BY id')
    .all()
    .map((g) => rowToGroup(g, ordersCount(g.id)))
  res.json({ supplierGroups: groups })
}

export function createSupplierGroup(req, res) {
  const { product, supplier, soloPrice, groupPrice, minOrders } = req.body

  if (!product || !soloPrice || !groupPrice || !minOrders) {
    return res.status(400).json({ message: 'Product, prices and min orders are required' })
  }

  const info = db
    .prepare(
      `INSERT INTO supplier_groups (product, supplier, solo_price, group_price, min_orders)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      product,
      supplier || 'Group supplier',
      Number(soloPrice),
      Number(groupPrice),
      Math.max(Number(minOrders), 1)
    )

  const group = db.prepare('SELECT * FROM supplier_groups WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({ group: rowToGroup(group, 0) })
}

export function joinSupplierGroup(req, res) {
  const { groupId, qty } = req.body
  const group = db.prepare('SELECT * FROM supplier_groups WHERE id = ?').get(Number(groupId))

  if (!group) {
    return res.status(404).json({ message: 'Supplier group not found' })
  }

  db.prepare(
    'INSERT OR IGNORE INTO supplier_orders (group_id, user_id, qty) VALUES (?, ?, ?)'
  ).run(group.id, req.user.id, Math.max(Number(qty) || 1, 1))

  res.json({ group: rowToGroup(group, ordersCount(group.id)) })
}