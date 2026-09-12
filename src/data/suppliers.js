const STATE_KEY = 'prospera-supplier-state'

export const SUPPLIERS = [
  {
    id: 'kantamanto-wholesale',
    name: 'Kantamanto Wholesale',
    category: 'Beads & accessories',
    region: 'Accra Central, Greater Accra',
    address: 'Stall B14, Kantamanto Market',
    phone: '+233 24 118 4420',
    email: 'orders@kantamanto-wholesale.gh',
    whatsapp: '233241184420',
    contactName: 'Ama Serwaa',
    hours: 'Mon–Sat, 7:00–17:00',
    delivery: 'Same-day Accra · 2–3 days other regions',
    leadTime: '1–2 business days after payment',
    moqNote: 'Group buy unlocks at 5 bags',
    rating: 4.8,
    fulfilled: 126,
    soloPrice: 'GH₵ 35 / bag',
    groupPrice: 'GH₵ 24 / bag',
    minOrders: 5,
    currentOrders: 3,
    discount: '31%',
    catalog: [
      { sku: 'BD-MIX-01', name: 'Assorted glass bead bag (500g)', unit: 'bag', price: 35, groupPrice: 24, moq: 2 },
      { sku: 'BD-GOLD-02', name: 'Gold-tone spacer pack', unit: 'pack', price: 18, groupPrice: 12, moq: 5 },
      { sku: 'WR-NYL-03', name: 'Beading wire (10m)', unit: 'roll', price: 14, groupPrice: 10, moq: 4 },
    ],
    history: [
      { id: 'kx-441', date: '2026-09-04', item: 'Assorted glass bead bag × 6', amount: 144, status: 'Delivered' },
      { id: 'kx-418', date: '2026-08-22', item: 'Gold-tone spacer pack × 8', amount: 96, status: 'Delivered' },
      { id: 'kx-390', date: '2026-08-09', item: 'Beading wire × 4', amount: 40, status: 'Fulfilled' },
    ],
  },
  {
    id: 'opera-market',
    name: 'Opera Market Suppliers',
    category: 'Fabric (Ankara / Kente)',
    region: 'Adum, Kumasi',
    address: 'Opera Square, Shop 8',
    phone: '+233 20 556 7712',
    email: 'sales@operafabrics.gh',
    whatsapp: '233205567712',
    contactName: 'Yaw Boateng',
    hours: 'Mon–Sat, 8:00–18:00',
    delivery: 'Next-day Kumasi · 3–4 days nationwide',
    leadTime: '2 business days for cut yardage',
    moqNote: 'Group buy unlocks at 8 yards',
    rating: 4.6,
    fulfilled: 84,
    soloPrice: 'GH₵ 65 / yard',
    groupPrice: 'GH₵ 48 / yard',
    minOrders: 8,
    currentOrders: 5,
    discount: '26%',
    catalog: [
      { sku: 'AK-PRM-11', name: 'Premium Ankara print', unit: 'yard', price: 65, groupPrice: 48, moq: 3 },
      { sku: 'KT-HND-12', name: 'Handwoven Kente strip', unit: 'yard', price: 120, groupPrice: 95, moq: 2 },
      { sku: 'LN-COT-13', name: 'Cotton lining', unit: 'yard', price: 22, groupPrice: 16, moq: 5 },
    ],
    history: [
      { id: 'op-210', date: '2026-09-01', item: 'Premium Ankara × 10 yards', amount: 480, status: 'In transit' },
      { id: 'op-188', date: '2026-08-14', item: 'Cotton lining × 12 yards', amount: 192, status: 'Delivered' },
    ],
  },
  {
    id: 'china-agent-gh',
    name: 'ChinaAgent-GH',
    category: 'Packaging materials',
    region: 'Tema, Greater Accra',
    address: 'Community 1, Warehouse 3',
    phone: '+233 55 902 3318',
    email: 'desk@chinaagentgh.com',
    whatsapp: '233559023318',
    contactName: 'Li Wei / Efua Mensah',
    hours: 'Mon–Fri, 9:00–16:30',
    delivery: 'Tema pickup · 4–7 days inland',
    leadTime: '10–18 days from Guangzhou if restocking',
    moqNote: 'Group buy unlocks at 20 units',
    rating: 4.5,
    fulfilled: 61,
    soloPrice: 'GH₵ 12 / unit',
    groupPrice: 'GH₵ 8 / unit',
    minOrders: 20,
    currentOrders: 14,
    discount: '33%',
    catalog: [
      { sku: 'PK-BOX-21', name: 'Branded jewelry box', unit: 'unit', price: 12, groupPrice: 8, moq: 20 },
      { sku: 'PK-BAG-22', name: 'Kraft mailer bag', unit: 'pack of 50', price: 45, groupPrice: 32, moq: 2 },
      { sku: 'PK-TAG-23', name: 'Hang tags (custom)', unit: 'pack of 100', price: 38, groupPrice: 28, moq: 2 },
    ],
    history: [
      { id: 'cg-077', date: '2026-08-28', item: 'Jewelry box × 40', amount: 320, status: 'Delivered' },
      { id: 'cg-061', date: '2026-08-02', item: 'Hang tags × 200', amount: 56, status: 'Fulfilled' },
    ],
  },
  {
    id: 'makola-essentials',
    name: 'Makola Essentials',
    category: 'Findings & tools',
    region: 'Makola, Accra',
    address: 'Makola Lane 2, Shop 21',
    phone: '+233 27 441 9088',
    email: 'hello@makolaessentials.gh',
    whatsapp: '233274419088',
    contactName: 'Adjoa Nkrumah',
    hours: 'Tue–Sat, 8:30–17:00',
    delivery: 'Same-day Accra CBD · next day suburbs',
    leadTime: 'Ready stock ships same day',
    moqNote: 'Group buy unlocks at 6 kits',
    rating: 4.7,
    fulfilled: 53,
    soloPrice: 'GH₵ 40 / kit',
    groupPrice: 'GH₵ 29 / kit',
    minOrders: 6,
    currentOrders: 2,
    discount: '28%',
    catalog: [
      { sku: 'TL-PLR-31', name: 'Jewelry pliers kit', unit: 'kit', price: 40, groupPrice: 29, moq: 2 },
      { sku: 'CL-LBS-32', name: 'Lobster clasps (50)', unit: 'pack', price: 16, groupPrice: 11, moq: 4 },
      { sku: 'CH-SLV-33', name: 'Silver-tone chain (5m)', unit: 'roll', price: 28, groupPrice: 20, moq: 3 },
    ],
    history: [
      { id: 'mk-119', date: '2026-09-06', item: 'Pliers kit × 2', amount: 58, status: 'Delivered' },
    ],
  },
]

export const CHINA_AGENTS = [
  {
    id: 'gz-bridge',
    name: 'Guangzhou Bridge Agency',
    city: 'Guangzhou / Tema liaison',
    focus: 'Packaging, findings, small electronics',
    leadTime: '12–20 days sea · 5–7 days air',
    moq: 'USD 180 per SKU',
    phone: '+233 50 221 7740',
    email: 'bridge@gz-liaison.com',
  },
  {
    id: 'yiwu-desk',
    name: 'Yiwu Desk GH',
    city: 'Yiwu / Accra office',
    focus: 'Beads, notions, seasonal décor',
    leadTime: '14–22 days sea',
    moq: 'USD 120 mixed carton',
    phone: '+233 24 880 1155',
    email: 'desk@yiwugh.com',
  },
  {
    id: 'shenzhen-lane',
    name: 'Shenzhen Lane Sourcing',
    city: 'Shenzhen / Kumasi pickup',
    focus: 'Tools, lighting, branded boxes',
    leadTime: '7–10 days air',
    moq: 'USD 250',
    phone: '+233 26 334 0901',
    email: 'lane@sz-sourcing.gh',
  },
]

function emptyState() {
  return { extraOrders: {}, requests: [], messages: [], needs: [], extraHistory: {} }
}

export function loadSupplierState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATE_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? { ...emptyState(), ...parsed } : emptyState()
  } catch {
    return emptyState()
  }
}

export function saveSupplierState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

export function statusTone(status) {
  if (status === 'Delivered' || status === 'Fulfilled') return 'bg-emerald-50 text-emerald-800'
  if (status === 'In transit' || status === 'Processing') return 'bg-indigo-50 text-indigo-800'
  return 'bg-amber-50 text-amber-800'
}
