import { GROUPS, PERSONAL_GOALS } from './savings'

/**
 * Offline / demo savings overview shaped like GET /api/savings.
 */
export function buildDemoSavingsOverview() {
  const circles = GROUPS.map((g, index) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    amount: g.amount,
    weekly: g.weekly,
    cycle: String(g.cycle || 'weekly').toLowerCase(),
    displayCycle: g.cycle || 'Weekly',
    members: g.members,
    filled: g.filled,
    visibility: g.visibility,
    nextPayout: g.nextPayout,
    balance: g.balance,
    pot: Number(String(g.balance).replace(/[^\d]/g, '')) || g.weekly * g.members,
    joined: index === 0 || g.youSaved > 0,
    isCreator: false,
    role: 'member',
    myPosition: g.payoutPosition,
    youSaved: g.youSaved || 0,
    streak: g.streak,
    roster: (g.roster || []).map((m, i) => ({
      id: `${g.id}-r${i}`,
      name: m.name,
      paid: Boolean(m.paid),
      isYou: false,
      role: 'member',
    })),
    upcoming: g.upcoming || [],
    history: (g.history || []).map((h, i) => ({
      id: `${g.id}-h${i}`,
      date: h.date,
      amount: h.amount,
      desc: h.desc,
      kind: h.kind === 'out' ? 'withdrawal' : 'contribution',
      actor: 'Member',
      method: 'MoMo',
    })),
    plan: {
      pot: g.weekly * g.members,
      nextRecipient: g.upcoming?.[0]?.who,
      nextAmount: g.weekly * g.members,
    },
    discoverable: g.visibility !== 'Private',
  }))

  const goals = PERSONAL_GOALS.map((g) => ({
    ...g,
    pct: Math.min(Math.round((g.saved / g.target) * 100), 100),
  }))

  const contributions = circles.reduce((sum, c) => sum + (c.joined ? Number(c.youSaved || 0) : 0), 0)
  const personal = goals.reduce((sum, g) => sum + Number(g.saved || 0), 0)
  const total = contributions + personal

  return {
    circles,
    goals,
    investments: [],
    account: {
      total,
      balance: total,
      invested: 0,
      unlocked: total >= 2000,
      investmentThreshold: 2000,
    },
    vault: [
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
    ],
    demo: true,
  }
}

export function buildDemoSavingsDetail(id) {
  const overview = buildDemoSavingsOverview()
  const circle = overview.circles.find((c) => String(c.id) === String(id)) || overview.circles[0]
  return { circle: { ...circle, joined: true, invites: [] } }
}
