-- Prospera Hub Schema
-- Reference schema. The live DB is managed by `server/db.js` + `npm run seed`
-- (Node built-in `node:sqlite`), see server/seed.js for the full table list.

-- Users table (all roles)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  business_type TEXT,
  role TEXT DEFAULT 'entrepreneur',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  start_status TEXT DEFAULT 'idea',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Grants (seed data in server/seed.js)
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Savings circles (Susu)
CREATE TABLE IF NOT EXISTS savings_circles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount TEXT,
  period TEXT DEFAULT 'weekly',
  total_members INTEGER,
  visibility TEXT DEFAULT 'Public',
  created_by INTEGER REFERENCES users(id),
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Circle members + payment tracking (transparency)
CREATE TABLE IF NOT EXISTS circle_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id INTEGER NOT NULL REFERENCES savings_circles(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  has_paid INTEGER DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payouts per member (calculated)
CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id INTEGER NOT NULL REFERENCES savings_circles(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  payout_date DATETIME,
  status TEXT DEFAULT 'pending'
);

-- Supplier group orders (Peer Supplier)
CREATE TABLE IF NOT EXISTS supplier_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product TEXT NOT NULL,
  supplier TEXT,
  solo_price REAL,
  group_price REAL,
  min_orders INTEGER NOT NULL,
  status TEXT DEFAULT 'open',
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES supplier_groups(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transactions (income / expenses)
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI goal checklists (startup plan steps)
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  steps TEXT,
  status TEXT DEFAULT 'in_progress',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Investments from partner banks / companies
CREATE TABLE IF NOT EXISTS investments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  expected_return REAL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);