const mk = (names, paidCount) => names.map((name, i) => ({ name, paid: i < paidCount }))

const mkHistory = (weekly) =>
  [
    ['02 Sep', weekly, 'Weekly contribution'],
    ['26 Aug', weekly, 'Weekly contribution'],
    ['19 Aug', weekly, 'Weekly contribution'],
    ['12 Aug', weekly, 'Weekly contribution'],
    ['05 Aug', weekly, 'Weekly contribution'],
    ['29 Jul', weekly, 'Weekly contribution'],
  ].map(([date, amount, desc]) => ({ date, amount, desc, kind: 'in' }))

export const GROUPS = [
  {
    id: 'ayah-susu-circle',
    name: 'Ayah Susu Circle',
    visibility: 'Private',
    amount: 'GH₵ 200 / week',
    weekly: 200,
    cycle: 'Weekly',
    members: 12,
    filled: 8,
    nextPayout: 'Monday',
    youSaved: 1850,
    streak: '4 weeks on time',
    payoutPosition: '3rd in this cycle',
    balance: 'GH₵ 12,800 in the pot',
    description: 'Neighbourhood traders pooling weekly for predictable lump sums.',
    roster: mk(['Ama', 'Kofi', 'Adjoa', 'Kwame', 'Efua', 'Yaw', 'Akosua', 'Kojo', 'Abena', 'Kwesi', 'Esi', 'Kweku'], 8),
    history: mkHistory(200),
    upcoming: [
      { pos: 'Next payout', who: 'Ama Serwaa', when: 'Mon, 14 Sep' },
      { pos: '2nd slot', who: 'Kofi Boateng', when: 'Mon, 21 Sep' },
      { pos: '3rd slot', who: 'You', when: 'Mon, 28 Sep' },
    ],
  },
  {
    id: 'trader-women-group',
    name: 'Trader Women Group',
    visibility: 'Public',
    amount: 'GH₵ 100 / week',
    weekly: 100,
    cycle: 'Weekly',
    members: 20,
    filled: 14,
    nextPayout: 'Thursday',
    youSaved: 0,
    streak: '—',
    payoutPosition: '11th in this cycle',
    balance: 'GH₵ 8,400 in the pot',
    description: 'Market women saving together with rotating weekly payouts.',
    roster: mk(
      ['Abena', 'Efua', 'Adjoa', 'Akosua', 'Ama', 'Yaa', 'Kadija', 'Esi', 'Araba', 'Afia', 'Aba', 'Akua', 'Sedinam', 'Maame', 'Adwoa', 'Ashley', 'Gifty', 'Abigail', 'Rosina', 'Stella'],
      14
    ),
    history: mkHistory(100),
    upcoming: [
      { pos: 'Next payout', who: 'Abena Kwarteng', when: 'Thu, 17 Sep' },
      { pos: '2nd slot', who: 'Yaa Mensa', when: 'Thu, 24 Sep' },
      { pos: '3rd slot', who: 'Kadija Sule', when: 'Thu, 1 Oct' },
    ],
  },
  {
    id: 'market-queens-coop',
    name: 'Market Queens Co-op',
    visibility: 'Public',
    amount: 'GH₵ 250 / week',
    weekly: 250,
    cycle: 'Bi-weekly',
    members: 10,
    filled: 6,
    nextPayout: 'Tuesday',
    youSaved: 0,
    streak: '—',
    payoutPosition: '5th in this cycle',
    balance: 'GH₵ 6,250 in the pot',
    description: 'Agri-traders pooling bi-weekly for bigger capital boosts.',
    roster: mk(['Adwoa', 'Kwame', 'Esi', 'Kofi', 'Afia', 'Nana', 'Akwasi', 'Cynthia', 'Daniel', 'Gloria'], 6),
    history: mkHistory(250),
    upcoming: [
      { pos: 'Next payout', who: 'Adwoa Amoah', when: 'Tue, 22 Sep' },
      { pos: '2nd slot', who: 'Kwame Owusu', when: 'Tue, 6 Oct' },
      { pos: '3rd slot', who: 'Nana Ansong', when: 'Tue, 20 Oct' },
    ],
  },
  {
    id: 'pearl-gold-traders',
    name: 'Pearl & Gold Traders',
    visibility: 'Public',
    amount: 'GH₵ 150 / week',
    weekly: 150,
    cycle: 'Weekly',
    members: 15,
    filled: 11,
    nextPayout: 'Friday',
    youSaved: 0,
    streak: '—',
    payoutPosition: '8th in this cycle',
    balance: 'GH₵ 9,600 in the pot',
    description: 'Jewellery and accessories businesses saving for stock seasons.',
    roster: mk(['Kojo', 'Abena', 'Efua', 'Kwesi', 'Yaa', 'Kweku', 'Akosua', 'Ama', 'Kwabena', 'Esi', 'Afia', 'Kofi', 'Adwoa', 'Kwame', 'Naa'], 11),
    history: mkHistory(150),
    upcoming: [
      { pos: 'Next payout', who: 'Kojo Asante', when: 'Fri, 18 Sep' },
      { pos: '2nd slot', who: 'Kwabena Darko', when: 'Fri, 25 Sep' },
      { pos: '3rd slot', who: 'Akosua Frimpong', when: 'Fri, 2 Oct' },
    ],
  },
]

export const PERSONAL_GOALS = [
  {
    id: 'beads-equipment',
    name: 'New equipment fund',
    tag: 'Beads workshop',
    saved: 1200,
    target: 5000,
    weekly: 100,
    next: 'Sun, 13 Sep',
  },
  {
    id: 'rent-buffer',
    name: 'Shop rent buffer',
    tag: '3-month cushion',
    saved: 900,
    target: 2400,
    weekly: 150,
    next: 'Fri, 11 Sep',
  },
]

export const fmt = (n) => `GH₵ ${n.toLocaleString()}`
export const joinKey = 'joinedGroups'
export const getJoined = () => {
  try {
    return JSON.parse(localStorage.getItem(joinKey)) || ['ayah-susu-circle']
  } catch {
    return ['ayah-susu-circle']
  }
}
export const setJoined = (names) => localStorage.setItem(joinKey, JSON.stringify(names))