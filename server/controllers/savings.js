import { randomBytes } from 'node:crypto'
import { db } from '../db.js'

export const INVESTMENT_THRESHOLD = 2000

export const INVEST_VAULT = [
  {
    id: 'mini',
    provider: 'Test Micro-Impact Fund',
    desc: 'Short strings for traders',
    rate: 12,
    term: 3,
    min: 500,
  },
  {
    id: 'mawusi',
    provider: 'Mawusi Capital',
    desc: '6-month growth note',
    rate: 10,
    term: 6,
    min: 1000,
  },
  {
    id: 'golden',
    provider: 'Golden Link Co-op',
    desc: 'Year-long co-op bond',
    rate: 8.5,
    term: 12,
    min: 2000,
  },
]

const CYCLES = ['weekly', 'bi-weekly', 'monthly']
const NEXT_DAY = {
  'Ayah Susu Circle': 'Monday',
  'Trader Women Group': 'Thursday',
  'Market Queens Co-op': 'Tuesday',
  'Pearl & Gold Traders': 'Friday',
}

function myName(userId) {
  return db.prepare('SELECT name FROM users WHERE id = ?').get(userId)?.name ?? 'You'
}

function memberDispName(m) {
  if (m.demo_name) return m.demo_name
  if (m.real_name) return m.real_name
  return 'Invited member'
}

function circleMembers(circleId) {
  return db
    .prepare(
      `SELECT m.*, u.name AS real_name
       FROM savings_members m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.circle_id = ?`
    )
    .all(circleId)
}

function paidCount(members) {
  return members.filter((m) => m.status === 'active' && m.paid_current === 1).length
}

function ordinal(n) {
  const rem10 = n % 10
  const rem100 = n % 100
  if (rem10 === 1 && rem100 !== 11) return `${n}st`
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`
  return `${n}th`
}

function slotDate(day, weeksOut) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const target = days.indexOf(day)
  const now = new Date()
  const today = now.getDay()
  let delta = (target - today + 7) % 7
  if (delta === 0) delta = 7
  delta += weeksOut * 7
  const date = new Date(now.getTime() + delta * 24 * 60 * 60 * 1000)
  return `${date.toLocaleDateString('en-GB', { weekday: 'short' })}, ${date.getDate()} ${date.toLocaleDateString('en-GB', { month: 'short' })}`
}

function rosterFor(circle, members, userId) {
  const active = members.filter((m) => m.status === 'active').sort((a, b) => a.position - b.position)
  const nextDay = NEXT_DAY[circle.name] || 'Monday'
  let filledSoFar = 0
  return active
    .map((m) => {
      const label =
        filledSoFar === 0 ? 'Next payout' : filledSoFar === 1 ? '2nd slot' : `${ordinal(filledSoFar + 1)} slot`
      const weeksOut = circle.cycle_len === 'bi-weekly' ? filledSoFar * 2 : filledSoFar
      filledSoFar += 1
      return { pos: label, who: memberDispName(m), when: slotDate(nextDay, weeksOut), memberId: m.id, isYou: m.user_id === userId }
    })
    .slice(0, 3)
}

function paymentsFor(circleId, userId, limit = 40) {
  const circleRows = db
    .prepare(
      `SELECT p.*, (SELECT name FROM users WHERE id = p.user_id) AS owner_name
       FROM savings_payments p
       WHERE p.circle_id = ?
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT ?`
    )
    .all(circleId, limit)
  const goalRows = db
    .prepare(
      `SELECT p.*, (SELECT name FROM users WHERE id = p.user_id) AS owner_name
       FROM savings_payments p
       WHERE p.user_id = ? AND p.circle_id IS NULL AND p.goal_id IS NOT NULL
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT 10`
    )
    .all(userId)
  return [...circleRows, ...goalRows].map(paymentToJson)
}

function paymentToJson(p) {
  return {
    id: p.id,
    kind: p.kind,
    amount: p.amount,
    actor: p.actor_name || p.owner_name || 'You',
    desc: p.description,
    date: String(p.created_at || '').slice(0, 16).replace('T', ' '),
    reference: p.reference,
    method: p.method,
    isMine: p.user_id !== null && p.user_id > 0,
  }
}

function circlePot(circle) {
  return Number(circle.pot) || 0
}

export function circleToPublic(circle, userId, extra = {}) {
  const members = circleMembers(circle.id)
  const me = members.find((m) => m.user_id === userId)
  const total = Number(circle.total_members) || 0
  const filled = Math.min(paidCount(members), total)
  const youSaved = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM savings_payments
       WHERE circle_id = ? AND user_id = ? AND kind = 'contribution'`
    )
    .get(circle.id, userId).total

  const joined = Boolean(me)
  return {
    id: circle.id,
    name: circle.name,
    description: circle.description || '',
    amount: `GH₵ ${circle.weekly} / ${circle.cycle_len === 'bi-weekly' ? '2 weeks' : circle.cycle_len.replace('ly', '')}`,
    weekly: Number(circle.weekly) || 0,
    cycle: circle.cycle_len || circle.period || 'weekly',
    members: total,
    filled,
    visibility: circle.visibility || 'Public',
    displayCycle: circle.cycle_len || circle.period,
    nextPayout: NEXT_DAY[circle.name] || 'Monday',
    balance: `GH₵ ${circlePot(circle).toLocaleString()} in the pot`,
    pot: circlePot(circle),
    joined,
    isCreator: me?.role === 'creator',
    role: me?.role || null,
    myPosition: me ? `${ordinal(me.position)} in this cycle` : null,
    youSaved,
    streak: me ? (me.missed === 0 ? `${4 - Math.min(me.missed, 3)} weeks on time` : `${Math.max(0, 4 - me.missed)} weeks on time`) : '—',
    status: circle.status,
    ...extra,
  }
}

function accountFor(userId) {
  const personalBalance =
    db
      .prepare('SELECT COALESCE(SUM(saved), 0) AS t FROM savings_goals WHERE user_id = ?')
      .get(userId).t || 0
  const inCircles =
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS t FROM savings_payments
         WHERE user_id = ? AND circle_id IS NOT NULL AND kind = 'contribution'`
      )
      .get(userId).t || 0
  const payoutsReceived =
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS t FROM savings_payments
         WHERE user_id = ? AND kind = 'payout'`
      )
      .get(userId).t || 0
  const returnsClaimed =
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS t FROM savings_payments
         WHERE user_id = ? AND kind = 'return'`
      )
      .get(userId).t || 0
  const invested =
    db
      .prepare('SELECT COALESCE(SUM(amount), 0) AS t FROM savings_investments WHERE user_id = ?')
      .get(userId).t || 0

  const total = personalBalance + inCircles + payoutsReceived + returnsClaimed
  const balance = total - invested
  return {
    personalBalance,
    inCircles,
    payoutsReceived,
    returnsClaimed,
    invested,
    total,
    balance,
    investmentThreshold: INVESTMENT_THRESHOLD,
    unlocked: balance >= INVESTMENT_THRESHOLD,
  }
}

function activeInvestments(userId) {
  return db
    .prepare(
      `SELECT * FROM savings_investments WHERE user_id = ?
       ORDER BY
         CASE WHEN status = 'active' THEN 0 ELSE 1 END,
         created_at DESC`
    )
    .all(userId)
    .map((i) => ({
      id: i.id,
      provider: i.provider,
      name: i.name,
      amount: i.amount,
      rate: i.rate,
      term: i.term_months,
      returnAmount: i.return_amount,
      status: i.status,
      createdAt: String(i.created_at || '').slice(0, 10),
    }))
}

export function listOverview(req, res) {
  const userId = req.user.id
  const circlesRaw = db.prepare('SELECT * FROM savings_circles ORDER BY id').all()
  const circles = circlesRaw.reduce((list, row) => {
    const isMember = circleMembers(row.id).some((m) => m.user_id === userId)
    if (row.visibility !== 'Private' || isMember) list.push(row)
    return list
  }, [])

  res.json({
    circles: circles.map((c) => ({
      ...circleToPublic(c, userId),
      discoverable: c.visibility !== 'Private',
    })),
    goals: db
      .prepare('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY id').all(userId)
      .map((g) => ({
        id: g.id,
        name: g.name,
        tag: g.tag,
        saved: g.saved,
        target: g.target,
        weekly: g.weekly,
        next: g.next_due,
        pct: Math.min(Math.round((g.saved / g.target) * 100), 100),
      })),
    investments: activeInvestments(userId),
    account: accountFor(userId),
    vault: INVEST_VAULT,
  })
}

export function createCircle(req, res) {
  const { name, weekly, members, period, visibility, description } = req.body
  const weeklyN = Number(weekly)
  if (!name || !weeklyN || weeklyN <= 0) {
    return res.status(400).json({ message: 'Circle name and a valid weekly amount are required' })
  }
  const total = Math.max(Number(members) || 5, 2)
  const cycleLen = CYCLES.includes(period) ? period : 'weekly'
  const vis = String(visibility || '').toLowerCase() === 'private' ? 'Private' : 'Public'

  const info = db
    .prepare(
      `INSERT INTO savings_circles
         (name, amount, period, total_members, visibility, description, weekly, cycle_len, created_by, pot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name.trim(),
      `GH₵ ${weeklyN} / ${cycleLen === 'weekly' ? 'week' : '2 weeks'}`,
      cycleLen,
      total,
      vis,
      String(description || '').trim(),
      weeklyN,
      cycleLen,
      req.user.id,
      0
    )

  const circle = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(info.lastInsertRowid)
  db.prepare(
    `INSERT INTO savings_members (circle_id, user_id, role, position, status, missed, paid_current)
     VALUES (?, ?, 'creator', 1, 'active', 0, 0)`
  ).run(circle.id, req.user.id)

  let invite = null
  if (vis === 'Private') {
    invite = makeInvite(circle.id, req.user.id, null)
  }

  res.status(201).json({ circle: circleToPublic(circle, req.user.id), invite })
}

function makeInvite(circleId, userId, email) {
  const token = randomBytes(6).toString('hex')
  db.prepare(
    `INSERT INTO savings_invites (circle_id, created_by, email, token, status)
     VALUES (?, ?, ?, ?, 'pending')`
  ).run(circleId, userId, email || null, token)
  const base = process.env.APP_URL || 'http://localhost:5173'
  return { token, email: email || null, link: `${base}/invite/${token}` }
}

export function inviteMember(req, res) {
  const { circleId, email } = req.body
  const circle = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(Number(circleId))
  if (!circle) return res.status(404).json({ message: 'Circle not found' })
  const membership = db
    .prepare('SELECT * FROM savings_members WHERE circle_id = ? AND user_id = ?')
    .get(circle.id, req.user.id)
  if (!membership) return res.status(403).json({ message: 'Only members can invite' })

  const invite = makeInvite(circle.id, req.user.id, String(email || '').trim() || null)
  res.json({ invite })
}

export function joinCircle(req, res) {
  const id = Number(req.params.id || req.body.circleId)
  const circle = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(id)
  if (!circle) return res.status(404).json({ message: 'Circle not found' })
  const existing = db
    .prepare('SELECT * FROM savings_members WHERE circle_id = ? AND user_id = ?')
    .get(circle.id, req.user.id)
  if (existing) {
    if (existing.status === 'left') {
      db.prepare(`UPDATE savings_members SET status = 'active' WHERE id = ?`).run(existing.id)
    }
    return res.json({ circle: circleToPublic(circle, req.user.id) })
  }

  if (circle.visibility === 'Private') {
    return res.status(403).json({ message: 'This circle is by invite only' })
  }
  const members = circleMembers(circle.id)
  if (paidCount(members) >= Number(circle.total_members)) {
    return res.status(400).json({ message: 'Circle is full' })
  }

  const maxPos = members.reduce((m, x) => Math.max(m, x.position), 0)
  db.prepare(
    `INSERT INTO savings_members (circle_id, user_id, role, position, status, missed, paid_current)
     VALUES (?, ?, 'member', ?, 'active', 0, 0)`
  ).run(circle.id, req.user.id, maxPos + 1)

  res.json({ circle: circleToPublic(circle, req.user.id) })
}

export function joinByInvite(req, res) {
  const { token } = req.params
  const invite = db.prepare('SELECT * FROM savings_invites WHERE token = ?').get(token)
  if (!invite || invite.status !== 'pending') {
    return res.status(404).json({ message: 'Invite not found or already used' })
  }
  const circle = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(invite.circle_id)
  if (!circle) return res.status(404).json({ message: 'Circle not found' })

  const existing = db
    .prepare('SELECT * FROM savings_members WHERE circle_id = ? AND user_id = ?')
    .get(circle.id, req.user.id)
  if (!existing) {
    const members = circleMembers(circle.id)
    if (paidCount(members) >= Number(circle.total_members)) {
      return res.status(400).json({ message: 'Circle is full' })
    }
    db.prepare(
      `INSERT INTO savings_members (circle_id, user_id, role, position, status, missed, paid_current)
       VALUES (?, ?, 'member', ?, 'active', 0, 0)`
    ).run(circle.id, req.user.id, members.reduce((m, x) => Math.max(m, x.position), 0) + 1)
  }
  db.prepare(`UPDATE savings_invites SET status = 'accepted' WHERE id = ?`).run(invite.id)

  res.json({ circle: circleToPublic(circle, req.user.id) })
}

export function getCircle(req, res) {
  const circle = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(Number(req.params.id))
  if (!circle) return res.status(404).json({ message: 'Circle not found' })

  const members = circleMembers(circle.id)
  const me = members.find((m) => m.user_id === req.user.id)
  if (circle.visibility === 'Private' && !me) {
    return res.status(403).json({ message: 'This circle is by invite only' })
  }

  const roster = members
    .filter((m) => m.status === 'active')
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      id: m.id,
      name: memberDispName(m),
      paid: m.paid_current === 1,
      role: m.role,
      missed: m.missed,
      status: m.status,
      isYou: m.user_id === req.user.id,
    }))

  const openInvites = me
    ? db
        .prepare(
          `SELECT id, email, token, status, created_at FROM savings_invites
           WHERE circle_id = ? ORDER BY id DESC LIMIT 5`
        )
        .all(circle.id)
        .map((i) => ({
          id: i.id,
          email: i.email,
          status: i.status,
          token: i.token,
          link: `${process.env.APP_URL || 'http://localhost:5173'}/invite/${i.token}`,
        }))
    : []

  res.json({
    circle: {
      ...circleToPublic(circle, req.user.id, {
        roster,
        invites: openInvites,
        history: paymentsFor(circle.id, req.user.id),
        upcoming: rosterFor(circle, members, req.user.id),
        plan: planRotation(circle, members),
      }),
    },
  })
}

export function recordPayment(req, res) {
  const { circleId, goalId, amount, method, reference, kind } = req.body
  const n = Number(amount)
  if (!n || n <= 0) return res.status(400).json({ message: 'Amount must be greater than zero' })

  const payKind = ['contribution', 'payout', 'withdrawal', 'return', 'investment'].includes(kind)
    ? kind
    : 'contribution'
  const name = myName(req.user.id)
  const ref = reference || `PS-${Date.now().toString().slice(-8)}`

  if (circleId) {
    const circle = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(Number(circleId))
    if (!circle) return res.status(404).json({ message: 'Circle not found' })
    const membership = db
      .prepare('SELECT * FROM savings_members WHERE circle_id = ? AND user_id = ?')
      .get(circle.id, req.user.id)
    if (!membership) return res.status(403).json({ message: 'Join the circle first to contribute' })

    db.prepare(`UPDATE savings_members SET paid_current = 1 WHERE id = ?`).run(membership.id)
    db.prepare(`UPDATE savings_circles SET pot = pot + ? WHERE id = ?`).run(n, circle.id)
  }

  if (goalId) {
    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(Number(goalId))
    if (!goal || goal.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Goal not found' })
    }
    if (payKind === 'contribution') {
      const next = Math.min(goal.saved + n, goal.target)
      db.prepare(`UPDATE savings_goals SET saved = ? WHERE id = ?`).run(next, goal.id)
    }
  }

  db.prepare(
    `INSERT INTO savings_payments
       (user_id, actor_id, actor_name, circle_id, goal_id, kind, description, amount, method, reference)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.user.id,
    req.user.id,
    name,
    circleId ? Number(circleId) : null,
    goalId ? Number(goalId) : null,
    payKind,
    circleId
      ? `Weekly contribution to ${db.prepare('SELECT name FROM savings_circles WHERE id = ?').get(circleId).name}`
      : goalId
        ? `Top-up to ${db.prepare('SELECT name FROM savings_goals WHERE id = ?').get(goalId).name}`
        : 'Savings contribution',
    n,
    method || 'paystack',
    ref
  )

  res.status(201).json({ payment: { reference: ref, status: 'completed' }, account: accountFor(req.user.id) })
}

function planRotation(circle, members, scenario = {}) {
  const active = members.filter((m) => m.status === 'active')
  const weekly = Number(circle.weekly) || 0
  const ordered = [...active].sort((a, b) => a.position - b.position)

  const target = scenario.memberId
    ? active.find((m) => m.id === Number(scenario.memberId))
    : null
  const extraMissed = target && scenario.missed ? Number(scenario.missed) : 0
  const skippers = new Map()
  if (target) skippers.set(target.id, (target.missed || 0) + extraMissed)

  const queue = ordered.filter((m) => !skippers.has(m.id))
  const skipped = ordered.filter((m) => skippers.has(m.id))

  let recipient = queue.length > 0 ? queue[0] : null
  const pot = Math.max(0, weekly * active.length - weekly * skippers.size)

  let recipientAmount = pot
  if (recipient) {
    recipientAmount = Math.max(0, pot - (recipient.missed || 0) * weekly)
  }

  return {
    weekly,
    pot,
    nextRecipient: recipient ? memberDispName(recipient) : null,
    nextAmount: recipientAmount,
    paidCount: active.filter((m) => m.paid_current === 1).length,
    members: [...queue, ...skipped].map((m) => {
      const skip = skippers.has(m.id)
      const targetIndex = queue.indexOf(m)
      const backIndex = skipped.indexOf(m)
      return {
        id: m.id,
        name: memberDispName(m),
        missed: skippers.get(m.id) || m.missed || 0,
        backOfQueue: skip,
        projectedOrder:
          targetIndex >= 0 ? targetIndex + 1 : queue.length + backIndex + 1,
        payout: skip || !recipient || m.id !== recipient.id
          ? null
          : Math.max(0, pot - (m.missed || 0) * weekly),
        isYou: m.user_id,
      }
    }),
    impact: skippers.size > 0
      ? `If ${memberDispName(target)} stops paying, the pot drops from ${(weekly * active.length).toLocaleString()} to ${pot.toLocaleString()} and the slot moves to the next paying member.`
      : 'Everyone is paying on time. The pot stays whole and the payout rotation runs as planned.',
  }
}

export function simulatePayout(req, res) {
  const circle = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(Number(req.params.id))
  if (!circle) return res.status(404).json({ message: 'Circle not found' })
  const plan = planRotation(circle, circleMembers(circle.id), req.body)
  res.json({ plan })
}

export function payNextMember(req, res) {
  const circle = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(Number(req.params.id))
  if (!circle) return res.status(404).json({ message: 'Circle not found' })
  const plan = planRotation(circle, circleMembers(circle.id))
  if (!plan.nextRecipient) return res.status(400).json({ message: 'No active member to pay' })

  const members = circleMembers(circle.id)
  const recipient = members
    .filter((m) => m.status === 'active')
    .sort((a, b) => (a.missed - b.missed) || (a.position - b.position))[0]

  const amount = Math.max(0, plan.pot - (recipient.missed || 0) * circle.weekly)
  const name = memberDispName(recipient)

  db.prepare(
    `INSERT INTO savings_payments
       (user_id, actor_id, actor_name, circle_id, kind, description, amount, method, reference)
     VALUES (?, ?, ?, ?, 'payout', ?, ?, 'bank', ?)`
  ).run(
    recipient.user_id,
    recipient.user_id,
    name,
    circle.id,
    `Weekly payout (pot ${plan.pot.toLocaleString()})`,
    amount,
    `PAY-${Date.now().toString().slice(-6)}`
  )

  const reordered = members
    .filter((m) => m.status === 'active')
    .sort((a, b) => a.position - b.position)
    .filter((m) => m.id !== recipient.id)
  reordered.push(recipient)
  const posUpdate = db.prepare(`UPDATE savings_members SET position = ?, paid_current = 0 WHERE id = ?`)
  reordered.forEach((m, index) => posUpdate.run(index + 1, m.id))
  db.prepare(`UPDATE savings_members SET missed = 0 WHERE id = ?`).run(recipient.id)
  db.prepare(
    `UPDATE savings_circles SET current_cycle = current_cycle + 1, pot = ? WHERE id = ?`
  ).run(Math.max(0, circle.pot - amount), circle.id)

  const updated = db.prepare('SELECT * FROM savings_circles WHERE id = ?').get(circle.id)
  res.json({ circle: circleToPublic(updated, req.user.id) })
}

export function createGoal(req, res) {
  const { name, target, weekly } = req.body
  const targetN = Number(target)
  const weeklyN = Number(weekly)
  if (!name || !targetN || targetN <= 0) {
    return res.status(400).json({ message: 'Goal name and target are required' })
  }
  const info = db
    .prepare(
      `INSERT INTO savings_goals (user_id, name, tag, target, weekly, saved, next_due)
       VALUES (?, ?, 'Personal goal', ?, ?, 0, 'This week')`
    )
    .run(req.user.id, String(name).trim(), targetN, weeklyN || 0)
  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json({
    goal: {
      id: goal.id,
      name: goal.name,
      tag: goal.tag,
      saved: goal.saved,
      target: goal.target,
      weekly: goal.weekly,
      next: goal.next_due,
      pct: 0,
    },
  })
}

export function startInvestment(req, res) {
  const { providerId, name, amount } = req.body
  const offer = INVEST_VAULT.find((v) => v.id === providerId)
  if (!offer) return res.status(404).json({ message: 'Investment plan not found' })
  const n = Number(amount)
  if (!n || n < offer.min) {
    return res.status(400).json({ message: `Minimum for ${offer.provider} is GH₵ ${offer.min}` })
  }
  const account = accountFor(req.user.id)
  if (n > account.balance) {
    return res.status(400).json({ message: 'Not enough savings balance to invest' })
  }

  const returnAmount = Math.round(n + (n * offer.rate * offer.term) / 1200)
  const info = db
    .prepare(
      `INSERT INTO savings_investments
         (user_id, provider, name, amount, rate, term_months, return_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, offer.provider, String(name || offer.provider).trim(), n, offer.rate, offer.term, returnAmount)

  db.prepare(
    `INSERT INTO savings_payments
       (user_id, actor_id, actor_name, kind, description, amount, method, reference)
     VALUES (?, ?, ?, 'investment', ?, ?, 'paystack', ?)`
  ).run(
    req.user.id,
    req.user.id,
    myName(req.user.id),
    `Invested in ${offer.provider}`,
    n,
    `INV-${Date.now().toString().slice(-6)}`
  )

  res.status(201).json({ investment: activeInvestments(req.user.id).find((i) => i.id === Number(info.lastInsertRowid)) })
}

export function claimInvestment(req, res) {
  const inv = db
    .prepare('SELECT * FROM savings_investments WHERE id = ? AND user_id = ?')
    .get(Number(req.params.id), req.user.id)
  if (!inv) return res.status(404).json({ message: 'Investment not found' })
  if (inv.status !== 'active') return res.status(400).json({ message: 'Returns already collected' })

  const returns = Math.max(0, inv.return_amount - inv.amount)
  db.prepare(`UPDATE savings_investments SET status = 'completed' WHERE id = ?`).run(inv.id)
  db.prepare(
    `INSERT INTO savings_payments
       (user_id, actor_id, actor_name, kind, description, amount, method, reference)
     VALUES (?, ?, ?, 'return', ?, ?, 'bank', ?)`
  ).run(
    req.user.id,
    req.user.id,
    myName(req.user.id),
    `Returns from ${inv.provider} (${inv.term_months} mo @ ${inv.rate}%)`,
    returns,
    `RET-${Date.now().toString().slice(-6)}`
  )

  res.json({ returns, investments: activeInvestments(req.user.id) })
}