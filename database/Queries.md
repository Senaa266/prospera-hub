# Backend Query Reference

These are the SQL queries the backend needs. Run against database `prospera_db`.

Demo business: `business_id = 1` (Karis Group of Companies).

---

## 1. Dashboard Financial Overview (last 30 days)

Used by: `GET /api/dashboard/:businessId`

\`\`\`sql
SELECT
  COALESCE(SUM(CASE WHEN type='INCOME'  THEN amount END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN type='EXPENSE' THEN amount END), 0) AS total_expenses,
  COALESCE(SUM(CASE WHEN type='INCOME' THEN amount ELSE -amount END), 0) AS net_profit,
  COUNT(*) AS transaction_count
FROM transactions
WHERE business_id = ?
  AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
\`\`\`

Returns one row. Use these values directly for the three dashboard cards.

---

## 2. Grant Matchmaker (by sector + eligibility)

Used by: `GET /api/grants/match/:businessId`

\`\`\`sql
SELECT
  g.grant_id,
  g.provider_name,
  g.grant_title,
  g.description,
  g.target_sector,
  g.max_amount,
  g.requires_registration,
  g.deadline,
  g.application_url,
  CASE
    WHEN g.target_sector = b.industry_sector THEN 90
    WHEN g.target_sector = 'Any' THEN 70
    ELSE 40
  END +
  CASE WHEN b.is_registered THEN 10 ELSE 0 END
  AS match_score
FROM grants g, businesses b
WHERE b.business_id = ?
  AND (g.requires_registration = FALSE OR b.is_registered = TRUE)
  AND (g.deadline IS NULL OR g.deadline >= CURDATE())
ORDER BY match_score DESC;
\`\`\`

Returns N rows sorted by best match. `match_score` is 0–100.

---

## 3. Readiness Score Calculation

Used by: `GET /api/business/:businessId/readiness`

\`\`\`sql
SELECT
  (CASE WHEN is_registered    THEN 25 ELSE 0 END) +
  (CASE WHEN has_bank_account THEN 25 ELSE 0 END) +
  LEAST(25, (
    SELECT COUNT(*) FROM transactions
    WHERE business_id = businesses.business_id
      AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  )) +
  (CASE WHEN monthly_avg_revenue > 2000 THEN 25 ELSE 10 END)
  AS readiness_score
FROM businesses
WHERE business_id = ?;
\`\`\`

Returns a single 0–100 integer. Score breakdown:
- 25 pts: registered business
- 25 pts: has bank account
- up to 25 pts: 1 pt per transaction in last 30 days (capped)
- 25 pts: monthly revenue > GHS 2,000 (else 10 pts)

---

## 4. Recent Transactions (ledger view)

Used by: `GET /api/transactions/:businessId`

\`\`\`sql
SELECT
  transaction_id, type, amount, category, description,
  transaction_date, source
FROM transactions
WHERE business_id = ?
ORDER BY transaction_date DESC, transaction_id DESC
LIMIT 50;
\`\`\`

---

## 5. Add a Transaction (voice or manual)

Used by: `POST /api/transactions`

\`\`\`sql
INSERT INTO transactions
  (business_id, type, amount, category, description, transaction_date, source)
VALUES (?, ?, ?, ?, ?, ?, ?);
\`\`\`

Params in order: `business_id, type ('INCOME'|'EXPENSE'), amount, category, description, transaction_date, source ('VOICE'|'MANUAL')`

---

## 6. AI Coach Chat History

Used by: `GET /api/coach/:businessId/history`

\`\`\`sql
SELECT message_id, role, content, created_at
FROM coach_messages
WHERE business_id = ?
ORDER BY created_at ASC
LIMIT 100;
\`\`\`

---

## 7. Save a Coach Message

Used by: `POST /api/coach`

\`\`\`sql
INSERT INTO coach_messages (business_id, role, content)
VALUES (?, ?, ?);
\`\`\`

Params: `business_id, role ('USER'|'ASSISTANT'), content`

---

## Connection Notes for Backend

- Package: use **`mysql2`** (not `mysql`) — MariaDB compatibility
- Host: `localhost` (or `127.0.0.1`)
- Port: `3306`
- User: `root`
- Password: (blank, unless you set one in phpMyAdmin)
- Database: `prospera_db`
- Charset: `utf8mb4`

Sample Node.js setup:

\`\`\`js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'prospera_db',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
\`\`\`