import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GRANTS, SAVING_CIRCLES, SUPPLIERS, TRANSACTIONS } from './seedData.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(dir, 'data')
mkdirSync(dataDir, { recursive: true })

const dbPath = process.env.DATABASE_URL || path.join(dataDir, 'prospera.db')

export const db = new DatabaseSync(dbPath)
export const closeDb = () => db.close()

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  business_type TEXT,
  role TEXT DEFAULT 'entrepreneur',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  amount TEXT,
  amount_max REAL,
  description TEXT,
  eligibility TEXT,
  deadline TEXT,
  type TEXT,
  region TEXT,
  source TEXT,
  external_url TEXT,
  image_url TEXT,
  fetched_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS savings_circles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount TEXT,
  period TEXT DEFAULT 'weekly',
  total_members INTEGER,
  visibility TEXT DEFAULT 'Public',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS supplier_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product TEXT NOT NULL,
  supplier TEXT,
  solo_price REAL,
  group_price REAL,
  min_orders INTEGER,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  qty INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS supplier_thread (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  channel TEXT DEFAULT 'team',
  sender_user_id INTEGER,
  sender_type TEXT DEFAULT 'buyer',
  sender_name TEXT,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`

db.exec(schema)

try {
  db.exec('ALTER TABLE grants ADD COLUMN fetched_at TEXT')
} catch {
  /* column already exists on newer databases */
}

for (const [table, column, ddl] of [
  ['supplier_groups', 'category', 'ALTER TABLE supplier_groups ADD COLUMN category TEXT'],
  ['supplier_groups', 'unit', 'ALTER TABLE supplier_groups ADD COLUMN unit TEXT'],
  ['supplier_groups', 'description', 'ALTER TABLE supplier_groups ADD COLUMN description TEXT'],
  ['supplier_orders', 'host', 'ALTER TABLE supplier_orders ADD COLUMN host INTEGER DEFAULT 0'],
  ['supplier_orders', 'status', "ALTER TABLE supplier_orders ADD COLUMN status TEXT DEFAULT 'active'"],
  ['supplier_orders', 'note', 'ALTER TABLE supplier_orders ADD COLUMN note TEXT'],
]) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all()
    if (!cols.some((c) => c.name === column)) db.exec(ddl)
  } catch {
    /* ignore */
  }
}

function seedIfEmpty() {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n

  if (count('grants') === 0) {
    const ins = db.prepare(`
      INSERT INTO grants (title, amount, amount_max, description, eligibility, deadline, type, region, source, external_url, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const g of GRANTS) {
      ins.run(g.title, g.amount, g.amount_max, g.description, g.eligibility, g.deadline, g.type, g.region, g.source, g.external_url, g.image_url)
    }
  }

  if (count('savings_circles') === 0) {
    const ins = db.prepare(`INSERT INTO savings_circles (name, amount, period, total_members, visibility, status) VALUES (?, ?, ?, ?, ?, ?)`)
    for (const c of SAVING_CIRCLES) ins.run(c.name, c.amount, c.period, c.total_members, c.visibility, c.status)
  }

if (count('supplier_groups') === 0) {
    const ins = db.prepare(
      `INSERT INTO supplier_groups (product, supplier, category, unit, description, solo_price, group_price, min_orders, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const s of SUPPLIERS) {
      ins.run(s.product, s.supplier, s.category, s.unit, s.description, s.solo_price, s.group_price, s.min_orders, s.status)
    }
  }

  if (count('transactions') === 0) {
    const ins = db.prepare(`INSERT INTO transactions (user_id, type, description, amount, date) VALUES (?, ?, ?, ?, ?)`)
    for (const t of TRANSACTIONS) ins.run(t.user_id, t.type, t.description, t.amount, t.date)
  }
}

seedIfEmpty()

function seedDemoSupplierOrders() {
  const seeded = db.prepare(`SELECT COUNT(*) AS n FROM meta WHERE key = 'supplier_orders_seeded'`).get().n
  if (seeded > 0) return
  const skip = ['Beads & accessories', 'Fabric (Ankara / Kente)', 'Packaging materials', 'Shea soap base & oils']
  const groups = db.prepare('SELECT id, product, min_orders FROM supplier_groups ORDER BY id').all()
  if (groups.length === 0) return
  const ins = db.prepare(
    'INSERT OR IGNORE INTO supplier_orders (group_id, user_id, qty) VALUES (?, ?, 1)'
  )
  let userId = -100
  for (const g of groups) {
    if (skip.includes(g.product)) continue
    const base = Math.min(g.min_orders - 1, Math.floor(g.min_orders * 0.7))
    for (let i = 1; i <= base; i += 1) {
      ins.run(g.id, userId)
      userId -= 1
    }
  }
  db.prepare(`INSERT INTO meta (key, value) VALUES ('supplier_orders_seeded', '1')`).run()
}

seedDemoSupplierOrders()

function syncSupplierCatalog() {
  const upd = db.prepare(
    `UPDATE supplier_groups SET category = ?, unit = ?, description = ?, status = ?
     WHERE product = ? AND supplier = ?`
  )
  const ins = db.prepare(
    `INSERT INTO supplier_groups (product, supplier, category, unit, description, solo_price, group_price, min_orders, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  for (const s of SUPPLIERS) {
    const info = upd.run(s.category, s.unit, s.description, s.status, s.product, s.supplier)
    if (info.changes === 0) {
      ins.run(s.product, s.supplier, s.category, s.unit, s.description, s.solo_price, s.group_price, s.min_orders, s.status)
    }
  }
}

syncSupplierCatalog()

function groupIdByProduct(product) {
  return db.prepare('SELECT id FROM supplier_groups WHERE product = ? ORDER BY id LIMIT 1').get(product)?.id
}

function demoUserId() {
  const byEmail = db
    .prepare("SELECT id FROM users WHERE email = 'smoke@prospera.test' ORDER BY id LIMIT 1")
    .get()
  if (byEmail) return byEmail.id
  const first = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get()
  return first?.id ?? null
}

function ensureDemoHost() {
  const groupId = groupIdByProduct('Beads & accessories')
  const uid = demoUserId()
  if (!groupId || !uid) return
  db.prepare(
    `INSERT OR IGNORE INTO supplier_orders (group_id, user_id, qty, host, status, note)
     VALUES (?, ?, 2, 1, 'active', 'We already sell bead jewellery — happy to lead.')`
  ).run(groupId, uid)
  db.prepare("UPDATE supplier_orders SET host = 1, status = 'active' WHERE group_id = ? AND user_id = ?").run(groupId, uid)
  db.prepare('UPDATE supplier_orders SET host = 0 WHERE group_id = ? AND user_id != ? AND host = 1').run(groupId, uid)
}

function seedDemoCollabs() {
  const seeded = db
    .prepare(`SELECT COUNT(*) AS n FROM meta WHERE key = 'supplier_collab_seeded'`)
    .get().n
  if (seeded > 0) return

  const ins = db.prepare(
    `INSERT OR IGNORE INTO supplier_orders (group_id, user_id, qty, host, status, note)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  const msg = db.prepare(
    `INSERT INTO supplier_thread (group_id, channel, sender_user_id, sender_type, sender_name, message)
     VALUES (?, ?, ?, ?, ?, ?)`
  )

  const beads = groupIdByProduct('Beads & accessories')
  const fabric = groupIdByProduct('Fabric (Ankara / Kente)')
  const pack = groupIdByProduct('Packaging materials')
  const soap = groupIdByProduct('Shea soap base & oils')

  if (beads) {
    ins.run(beads, demoUserId(), 2, 1, 'active', 'We already sell bead jewellery — happy to lead.')
    ins.run(beads, -1, 1, 0, 'active', 'Ok — I can take 1 bag, say 50/50?')
    ins.run(beads, -2, 2, 0, 'pending', 'Can I take 2 bags? I will split equally.')
    msg.run(beads, 'supplier', null, 'supplier', 'Kantamanto Wholesale rep', 'Stock is ready. Once your group confirms, I will hold the GH₵24 rate for 7 days.')
    msg.run(beads, 'team', -1, 'buyer', 'Kofi Mensah', 'Two of us on the beads so far.')
  }
  if (fabric) {
    ins.run(fabric, -1, 3, 1, 'active', 'Leading this order.')
    ins.run(fabric, -2, 2, 0, 'active', 'Taking 2 yards for uniforms.')
    ins.run(fabric, -3, 2, 0, 'active', '2 yards for my tailoring shop.')
    msg.run(fabric, 'team', -1, 'buyer', 'Kofi Mensah', 'Three of us in — 7 yards committed.')
    msg.run(fabric, 'team', -2, 'buyer', 'Ama Asante', '1 more yard and we unlock the GH₵48 rate.')
    msg.run(fabric, 'supplier', null, 'supplier', 'Opera Market Suppliers rep', 'Hi team. When you reach 8 yards, I will hold the group price for 10 days.')
  }
  if (pack) {
    ins.run(pack, -3, 10, 1, 'active', 'Leading the packaging run.')
    ins.run(pack, -4, 6, 0, 'active', 'In for 6 units.')
    msg.run(pack, 'supplier', null, 'supplier', 'ChinaAgent-GH rep', 'Confirm the plain kraft style and I will start the production run at 20 units.')
    msg.run(pack, 'team', -4, 'buyer', 'Yaw Boateng', '16 of 20 locked in — almost there.')
  }
  if (soap) {
    ins.run(soap, -2, 4, 1, 'active', 'Hosting this one.')
    msg.run(soap, 'supplier', null, 'supplier', 'Akyem Soapworks rep', 'Raw shea is in stock. Happy to hold 10kg for your group.')
  }

  db.prepare(`INSERT INTO meta (key, value) VALUES ('supplier_collab_seeded', '1')`).run()
}

seedDemoCollabs()
ensureDemoHost()