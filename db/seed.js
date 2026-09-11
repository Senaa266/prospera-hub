import 'dotenv/config'
import sqlite3 from 'sqlite3'

const db = new sqlite3.Database(process.env.DATABASE_URL || './db/prospera.db')

const seed = async () => {
  db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS users`)
    db.run(`DROP TABLE IF EXISTS grants`)
    db.run(`DROP TABLE IF EXISTS savings_circles`)
    db.run(`DROP TABLE IF EXISTS supplier_groups`)
    db.run(`DROP TABLE IF EXISTS investments`)
    db.run(`DROP TABLE IF EXISTS transactions`)

    db.run(`CREATE TABLE grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      amount TEXT,
      description TEXT,
      deadline TEXT,
      type TEXT
    )`)

    db.run(`CREATE TABLE savings_circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      amount REAL,
      period TEXT,
      total_members INTEGER
    )`)

    db.run(`CREATE TABLE supplier_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product TEXT,
      supplier TEXT,
      solo_price REAL,
      group_price REAL,
      min_orders INTEGER
    )`)

    const stmt = db.prepare('INSERT INTO grants (title, amount, description, deadline, type) VALUES (?, ?, ?, ?, ?)')
    stmt.run('Ghana Startup Grant', 'GHS 5,000 - 25,000', 'For registered Ghanaian startups under 3 years.', '2026-09-30', 'Tech / Innovation')
    stmt.run('AfDB Youth Entrepreneurship', 'GHS 10,000 - 100,000', 'Open to 18-35 year-old entrepreneurs across Africa.', '2026-11-15', 'All sectors')
    stmt.run('Google for Startups Africa', '$10,000 - 50,000', 'For digital-first startups solving local problems.', '2026-12-31', 'Tech / Digital')
    stmt.finalize()

    const sStmt = db.prepare('INSERT INTO supplier_groups (product, supplier, solo_price, group_price, min_orders) VALUES (?, ?, ?, ?, ?)')
    sStmt.run('Beads & accessories', 'Kantamanto Wholesale', 35, 24, 5)
    sStmt.run('Fabric (Ankara / Kente)', 'Opera Market Suppliers', 65, 48, 8)
    sStmt.run('Packaging materials', 'ChinaAgent-GH', 12, 8, 20)
    sStmt.finalize()

    const cStmt = db.prepare('INSERT INTO savings_circles (name, amount, period, total_members) VALUES (?, ?, ?, ?)')
    cStmt.run('Ayah Susu Circle', 200, 'weekly', 12)
    cStmt.run('Trader Women Group', 100, 'weekly', 20)
    cStmt.finalize()

    console.log('Database seeded')
  })

  db.close()
}

seed()