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
    const ins = db.prepare(`INSERT INTO supplier_groups (product, supplier, solo_price, group_price, min_orders, status) VALUES (?, ?, ?, ?, ?, ?)`)
    for (const s of SUPPLIERS) ins.run(s.product, s.supplier, s.solo_price, s.group_price, s.min_orders, s.status)
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
  const groups = db.prepare('SELECT id, min_orders FROM supplier_groups ORDER BY id').all()
  if (groups.length === 0) return
  const ins = db.prepare(
    'INSERT OR IGNORE INTO supplier_orders (group_id, user_id, qty) VALUES (?, ?, 1)'
  )
  for (const g of groups) {
    const base = Math.min(g.min_orders - 1, Math.floor(g.min_orders * 0.7))
    for (let i = 1; i <= base; i += 1) ins.run(g.id, -i)
  }
  db.prepare(`INSERT INTO meta (key, value) VALUES ('supplier_orders_seeded', '1')`).run()
}

seedDemoSupplierOrders()