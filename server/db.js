import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
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
  description TEXT DEFAULT '',
  weekly REAL DEFAULT 200,
  cycle_len TEXT DEFAULT 'weekly',
  created_by INTEGER,
  current_cycle INTEGER DEFAULT 1,
  pot REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  role TEXT DEFAULT 'member',
  position INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  missed INTEGER DEFAULT 0,
  paid_current INTEGER DEFAULT 0,
  demo_name TEXT,
  UNIQUE(circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  tag TEXT DEFAULT 'Personal goal',
  target REAL NOT NULL,
  weekly REAL DEFAULT 0,
  saved REAL DEFAULT 0,
  next_due TEXT DEFAULT 'This week',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  actor_id INTEGER,
  actor_name TEXT,
  circle_id INTEGER,
  goal_id INTEGER,
  kind TEXT DEFAULT 'contribution',
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT DEFAULT 'paystack',
  reference TEXT,
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  email TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS savings_investments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  rate REAL NOT NULL,
  term_months INTEGER NOT NULL,
  return_amount REAL NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product TEXT NOT NULL,
  supplier TEXT,
  solo_price REAL,
  group_price REAL,
  min_orders INTEGER,
  max_units INTEGER,
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
  ['supplier_groups', 'max_units', 'ALTER TABLE supplier_groups ADD COLUMN max_units INTEGER'],
  ['savings_circles', 'description', "ALTER TABLE savings_circles ADD COLUMN description TEXT DEFAULT ''"],
  ['savings_circles', 'weekly', 'ALTER TABLE savings_circles ADD COLUMN weekly REAL DEFAULT 200'],
  ['savings_circles', 'cycle_len', "ALTER TABLE savings_circles ADD COLUMN cycle_len TEXT DEFAULT 'weekly'"],
  ['savings_circles', 'created_by', 'ALTER TABLE savings_circles ADD COLUMN created_by INTEGER'],
  ['savings_circles', 'current_cycle', 'ALTER TABLE savings_circles ADD COLUMN current_cycle INTEGER DEFAULT 1'],
  ['savings_circles', 'pot', 'ALTER TABLE savings_circles ADD COLUMN pot REAL DEFAULT 0'],
  ['savings_members', 'role', "ALTER TABLE savings_members ADD COLUMN role TEXT DEFAULT 'member'"],
  ['savings_members', 'position', 'ALTER TABLE savings_members ADD COLUMN position INTEGER DEFAULT 0'],
  ['savings_members', 'status', "ALTER TABLE savings_members ADD COLUMN status TEXT DEFAULT 'active'"],
  ['savings_members', 'missed', 'ALTER TABLE savings_members ADD COLUMN missed INTEGER DEFAULT 0'],
  ['savings_members', 'paid_current', 'ALTER TABLE savings_members ADD COLUMN paid_current INTEGER DEFAULT 0'],
  ['savings_members', 'demo_name', 'ALTER TABLE savings_members ADD COLUMN demo_name TEXT'],
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
      `INSERT INTO supplier_groups (product, supplier, category, unit, description, solo_price, group_price, min_orders, max_units, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    for (const s of SUPPLIERS) {
      ins.run(s.product, s.supplier, s.category, s.unit, s.description, s.solo_price, s.group_price, s.min_orders, s.max_units ?? null, s.status)
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
  const groups = db.prepare('SELECT id, product, min_orders, max_units FROM supplier_groups ORDER BY id').all()
  if (groups.length === 0) return
  const ins = db.prepare(
    'INSERT OR IGNORE INTO supplier_orders (group_id, user_id, qty) VALUES (?, ?, 1)'
  )
  let userId = -100
  for (const g of groups) {
    if (skip.includes(g.product)) continue
    const threshold = g.max_units ?? g.min_orders ?? 1
    const base = Math.min(threshold - 1, Math.floor(threshold * 0.7))
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
    `UPDATE supplier_groups SET category = ?, unit = ?, description = ?, max_units = ?
     WHERE product = ? AND supplier = ?`
  )
  const ins = db.prepare(
    `INSERT INTO supplier_groups (product, supplier, category, unit, description, solo_price, group_price, min_orders, max_units, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  for (const s of SUPPLIERS) {
    const info = upd.run(s.category, s.unit, s.description, s.max_units ?? null, s.product, s.supplier)
    if (info.changes === 0) {
      ins.run(s.product, s.supplier, s.category, s.unit, s.description, s.solo_price, s.group_price, s.min_orders, s.max_units ?? null, s.status)
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

function firstUserId() {
  const first = db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get()
  return first?.id ?? demoUserId()
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
    msg.run(beads, 'supplier', null, 'supplier', 'Kantamanto Wholesale rep', 'Your group is past the cap of 2 bags — the GH₵24 rate is live. I will hold it for 7 days.')
    msg.run(beads, 'team', -1, 'buyer', 'Kofi Mensah', 'Two of us on the beads so far.')
  }
  if (fabric) {
    ins.run(fabric, -1, 3, 1, 'active', 'Leading this order.')
    ins.run(fabric, -2, 2, 0, 'active', 'Taking 2 yards for uniforms.')
    ins.run(fabric, -3, 2, 0, 'active', '2 yards for my tailoring shop.')
    msg.run(fabric, 'team', -3, 'buyer', 'Esi Owusu', 'Seven yards total — past the 6-yard cap, so the GH₵48 rate is live.')
    msg.run(fabric, 'team', -2, 'buyer', 'Ama Asante', 'Good — combined units cleared the cap, rate locked in.')
    msg.run(fabric, 'supplier', null, 'supplier', 'Opera Market Suppliers rep', 'Hi team. You have cleared the 6-yard cap — I will hold the group price for 10 days.')
  }
  if (pack) {
    ins.run(pack, -3, 10, 1, 'active', 'Leading the packaging run.')
    ins.run(pack, -4, 6, 0, 'active', 'In for 6 units.')
    msg.run(pack, 'supplier', null, 'supplier', 'ChinaAgent-GH rep', 'Confirm the plain kraft style and I will start the production run — you are past the 15-unit cap.')
    msg.run(pack, 'team', -4, 'buyer', 'Yaw Boateng', '16 units in — past the 15-unit cap, so the group price is live.')
  }
  if (soap) {
    ins.run(soap, -2, 4, 1, 'active', 'Hosting this one.')
    msg.run(soap, 'supplier', null, 'supplier', 'Akyem Soapworks rep', 'Raw shea is in stock. Pass the 10kg cap with more buyers and I will hold the group rate.')
  }

  db.prepare(`INSERT INTO meta (key, value) VALUES ('supplier_collab_seeded', '1')`).run()
}

seedDemoCollabs()
ensureDemoHost()

function syncSupplierSeedCopy() {
  const swaps = [
    ['Stock is ready. Once your group confirms, I will hold the GH₵24 rate for 7 days.', 'Your group is past the cap of 2 bags — the GH₵24 rate is live. I will hold it for 7 days.'],
    ['Hi team. When you reach 8 yards, I will hold the group price for 10 days.', 'Hi team. You have cleared the 6-yard cap — I will hold the group price for 10 days.'],
    ['1 more yard and we unlock the GH₵48 rate.', 'Good — combined units cleared the cap, rate locked in.'],
    ['Confirm the plain kraft style and I will start the production run at 20 units.', 'Confirm the plain kraft style and I will start the production run — you are past the 15-unit cap.'],
    ['16 of 20 locked in — almost there.', '16 units in — past the 15-unit cap, so the group price is live.'],
    ['Raw shea is in stock. Happy to hold 10kg for your group.', 'Raw shea is in stock. Pass the 10kg cap with more buyers and I will hold the group rate.'],
  ]
  const upd = db.prepare('UPDATE supplier_thread SET message = ? WHERE message = ?')
  for (const [from, to] of swaps) upd.run(to, from)
}

syncSupplierSeedCopy()

const SAVING_META = {
  'Ayah Susu Circle': { weekly: 200, cycle_len: 'weekly', pot: 12800, description: 'Neighbourhood traders pooling weekly for predictable lump sums.' },
  'Trader Women Group': { weekly: 100, cycle_len: 'weekly', pot: 8400, description: 'Market women saving together with rotating weekly payouts.' },
  'Market Queens Co-op': { weekly: 250, cycle_len: 'bi-weekly', pot: 6250, description: 'Agri-traders pooling bi-weekly for bigger capital boosts.' },
  'Pearl & Gold Traders': { weekly: 150, cycle_len: 'weekly', pot: 9600, description: 'Jewellery and accessories businesses saving for stock seasons.' },
}

const SAVING_ROSTERS = {
  'Ayah Susu Circle': {
    filled: 8,
    members: ['Ama Serwaa', 'Kofi Boateng', 'Adjoa Mensah', 'Kwame Owusu', 'Efua Dede', 'Yaw Asare', 'Akosua Frimpong', 'Kojo Asante', 'Abena Kwarteng', 'Kwesi Appiah', 'Esi Nyarko', 'Kweku Danso'],
  },
  'Trader Women Group': {
    filled: 14,
    members: ['Abena Kwarteng', 'Efua Boateng', 'Adjoa Mensah', 'Akosua Frimpong', 'Ama Serwaa', 'Yaa Mensa', 'Kadija Sule', 'Esi Nyarko', 'Araba Andoh', 'Afia Owusu', 'Aba Poku', 'Akua Darko', 'Sedinam Adjei', 'Maame Acheampong', 'Adwoa Amoah', 'Ashley Mensimah', 'Gifty Badu', 'Abigail Tetteh', 'Rosina Quaye', 'Stella Afriyie'],
  },
  'Market Queens Co-op': {
    filled: 6,
    members: ['Adwoa Amoah', 'Kwame Owusu', 'Esi Nyarko', 'Kofi Boateng', 'Afia Owusu', 'Nana Ansong', 'Akwasi Frimpong', 'Cynthia Adu', 'Daniel Ofori', 'Gloria Adusei'],
  },
  'Pearl & Gold Traders': {
    filled: 11,
    members: ['Kojo Asante', 'Abena Kwarteng', 'Efua Dede', 'Kwesi Appiah', 'Yaa Mensa', 'Kweku Danso', 'Akosua Frimpong', 'Ama Serwaa', 'Kwabena Darko', 'Esi Nyarko', 'Afia Owusu', 'Kofi Boateng', 'Adwoa Amoah', 'Kwame Owusu', 'Naa Mansa'],
  },
}

function ensureDemoUser() {
  const byEmail = db.prepare("SELECT id FROM users WHERE email = 'ama@prospera.demo'").get()
  if (byEmail) return byEmail.id
  const hash = bcrypt.hashSync('demo1234', 4)
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, business_type) VALUES (?, ?, ?, ?)')
    .run('Ama Owusu', 'ama@prospera.demo', hash, 'Beads & accessories')
  return Number(info.lastInsertRowid)
}

function circleIdByName(name) {
  return db.prepare('SELECT id FROM savings_circles WHERE name = ? LIMIT 1').get(name)?.id ?? null
}

function syncSavingsCircleMeta() {
  const upd = db.prepare(
    `UPDATE savings_circles SET description = ?, weekly = ?, cycle_len = ?, pot = ?
     WHERE name = ?`
  )
  for (const [name, meta] of Object.entries(SAVING_META)) {
    upd.run(meta.description, meta.weekly, meta.cycle_len, meta.pot, name)
  }
}

function seedDemoSavings() {
  syncSavingsCircleMeta()
  ensureDemoUser()
  const demoUid = firstUserId()

  const cleaned = db
    .prepare(`SELECT COUNT(*) AS n FROM meta WHERE key = 'savings_demo_cleanup'`)
    .get().n
  if (cleaned === 0) {
    const demoCircleIds = Object.keys(SAVING_ROSTERS)
      .map((n) => circleIdByName(n))
      .filter(Boolean)
    db.prepare(
      `UPDATE users SET name = 'Ama Owusu'
       WHERE id = ? AND name = 'Real Tester'`
    ).run(demoUid || -1)
    if (demoCircleIds.length > 0) {
      db.prepare(
        `DELETE FROM savings_members
         WHERE demo_name IS NULL AND user_id != ?
           AND circle_id IN (${demoCircleIds.join(',')})`
      ).run(demoUid || -1)
      db.prepare(
        `DELETE FROM savings_payments
         WHERE kind = 'payout' AND reference = 'PAY-0709'
           AND id NOT IN (
             SELECT MIN(id) FROM savings_payments WHERE kind = 'payout' AND reference = 'PAY-0709'
           )`
      ).run()
    }
    db.prepare(`INSERT INTO meta (key, value) VALUES ('savings_demo_cleanup', '1')`).run()
  }

  const memberIns = db.prepare(
    `INSERT OR IGNORE INTO savings_members
       (circle_id, user_id, role, position, status, missed, paid_current, demo_name)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`
  )

  for (const [name, roster] of Object.entries(SAVING_ROSTERS)) {
    const circleId = circleIdByName(name)
    if (!circleId) continue
    roster.members.forEach((memberName, index) => {
      if (name === 'Ayah Susu Circle' && index + 1 === 3) return
      memberIns.run(
        circleId,
        -100 - index,
        index === 0 ? 'member' : 'member',
        index + 1,
        0,
        index < roster.filled ? 1 : 0,
        memberName
      )
    })
  }

  const ayah = circleIdByName('Ayah Susu Circle')
  if (ayah && demoUid) {
    db.prepare(
      `INSERT OR IGNORE INTO savings_members (circle_id, user_id, role, position, status, missed, paid_current, demo_name)
       VALUES (?, ?, 'member', 3, 'active', 0, 1, NULL)`
    ).run(ayah, demoUid)

    const ayahPay = db.prepare(
      `INSERT INTO savings_payments
         (user_id, actor_id, actor_name, circle_id, kind, description, amount, method, reference, created_at)
       VALUES (?, ?, ?, ?, 'contribution', ?, ?, 'paystack', ?, ?)`
    )
    db.prepare(
      `DELETE FROM savings_payments
       WHERE user_id = ? AND circle_id = ? AND kind = 'contribution' AND reference LIKE 'PH-%'`
    ).run(demoUid, ayah)

    const demoWeeks = [
      ['2026-09-02', 200],
      ['2026-08-26', 200],
      ['2026-08-19', 200],
      ['2026-08-12', 200],
      ['2026-08-05', 200],
      ['2026-07-29', 200],
      ['2026-07-22', 200],
      ['2026-07-15', 200],
      ['2026-07-08', 200],
      ['2026-07-01', 200],
    ]
    for (const [date, amount] of demoWeeks) {
      ayahPay.run(demoUid, demoUid, 'Ama Owusu', ayah, 'Weekly contribution', amount, `PH-${date.replaceAll('-', '')}`, `${date} 08:30`)
    }
  }

  const paidSeeded = db
    .prepare(`SELECT COUNT(*) AS n FROM meta WHERE key = 'savings_demo_payments'`)
    .get().n
  if (ayah && paidSeeded === 0) {
    const ayahRoster = SAVING_ROSTERS['Ayah Susu Circle'].members
    const ayahPay = db.prepare(
      `INSERT INTO savings_payments
         (user_id, actor_id, actor_name, circle_id, kind, description, amount, method, reference, created_at)
       VALUES (?, ?, ?, ?, 'contribution', ?, ?, 'paystack', ?, ?)`
    )

    const others = [
      ['2026-09-02', 'Ama Serwaa'],
      ['2026-09-02', 'Kofi Boateng'],
      ['2026-09-02', 'Adjoa Mensah'],
      ['2026-09-02', 'Kwame Owusu'],
      ['2026-08-26', 'Efua Dede'],
      ['2026-08-26', 'Yaw Asare'],
    ]
    for (const [date, name] of others) {
      const userIdx = ayahRoster.indexOf(name)
      if (userIdx === -1) continue
      ayahPay.run(-100 - userIdx, -100 - userIdx, name, ayah, 'Weekly contribution', 200, `PH-${name.replaceAll(' ', '').slice(0, 4)}${date.slice(5, 7)}`, `${date} 09:00`)
    }
    const payoutIns = db.prepare(
      `INSERT INTO savings_payments
         (user_id, actor_id, actor_name, circle_id, kind, description, amount, method, reference, created_at)
       VALUES (?, ?, ?, ?, 'payout', ?, ?, 'bank', ?, '2026-09-07 12:00')`
    )
    payoutIns.run(-100, -100, 'Ama Serwaa', ayah, 'Weekly payout (pot 12 × GH₵ 200)', 2400, 'PAY-0709')
    db.prepare(`INSERT INTO meta (key, value) VALUES ('savings_demo_payments', '1')`).run()
  }

  const demoGoalCount = db
    .prepare('SELECT COUNT(*) AS n FROM savings_goals WHERE user_id = ?')
    .get(demoUid).n
  if (demoGoalCount === 0) {
    const goalIns = db.prepare(
      'INSERT INTO savings_goals (user_id, name, tag, target, weekly, saved, next_due) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    goalIns.run(demoUid, 'New equipment fund', 'Beads workshop', 5000, 100, 1200, 'Sun, 13 Sep')
    goalIns.run(demoUid, 'Shop rent buffer', '3-month cushion', 2400, 150, 900, 'Fri, 11 Sep')
  }
}

seedDemoSavings()