import { db } from './db.js'
import { GRANTS, SAVING_CIRCLES, SUPPLIERS, TRANSACTIONS } from './seedData.js'

db.exec('DELETE FROM grants; DELETE FROM savings_circles; DELETE FROM supplier_groups; DELETE FROM transactions;')

const insertGrant = db.prepare(`
  INSERT INTO grants (title, amount, amount_max, description, eligibility, deadline, type, region, source, external_url, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
for (const g of GRANTS) {
  insertGrant.run(
    g.title,
    g.amount,
    g.amount_max,
    g.description,
    g.eligibility,
    g.deadline,
    g.type,
    g.region,
    g.source,
    g.external_url,
    g.image_url
  )
}

const insertCircle = db.prepare(`
  INSERT INTO savings_circles (name, amount, period, total_members, visibility, status)
  VALUES (?, ?, ?, ?, ?, ?)
`)
for (const c of SAVING_CIRCLES) {
  insertCircle.run(c.name, c.amount, c.period, c.total_members, c.visibility, c.status)
}

const insertSupplier = db.prepare(`
  INSERT INTO supplier_groups (product, supplier, solo_price, group_price, min_orders, status)
  VALUES (?, ?, ?, ?, ?, ?)
`)
for (const s of SUPPLIERS) {
  insertSupplier.run(s.product, s.supplier, s.solo_price, s.group_price, s.min_orders, s.status)
}

const insertTx = db.prepare(`
  INSERT INTO transactions (user_id, type, description, amount, date)
  VALUES (?, ?, ?, ?, ?)
`)
for (const t of TRANSACTIONS) {
  insertTx.run(t.user_id, t.type, t.description, t.amount, t.date)
}

console.log(
  `seeded: ${GRANTS.length} grants, ${SAVING_CIRCLES.length} circles, ${SUPPLIERS.length} supplier groups, ${TRANSACTIONS.length} transactions`
)

db.close()