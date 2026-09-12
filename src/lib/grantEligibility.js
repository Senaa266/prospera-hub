import { DEMO_GRANTS } from '../data/grants'

const STORAGE_KEY = 'prospera-grant-eligibility'

export const ELIGIBILITY_STEPS = [
  { id: 'profile', title: 'Business profile', short: 'Profile' },
  { id: 'finance', title: 'Financial metrics', short: 'Finance' },
  { id: 'docs', title: 'Document uploads', short: 'Documents' },
  { id: 'results', title: 'Qualification results', short: 'Results' },
]

export const DOC_SLOTS = [
  {
    key: 'registration',
    label: 'Business registration certificate',
    hint: 'Registrar General / GEA certificate or equivalent.',
    required: true,
  },
  {
    key: 'tax',
    label: 'Tax identification document',
    hint: 'TIN certificate or Ghana Revenue Authority letter.',
    required: true,
  },
  {
    key: 'financials',
    label: 'Financial statement or bank summary',
    hint: 'Last 6–12 months of sales, bank statement, or simple P&L.',
    required: false,
  },
]

export function defaultEligibilityDraft(user) {
  return {
    businessName: user?.businessName || '',
    ownerName: user?.name || '',
    registrationNumber: '',
    registered: 'yes',
    country: 'Ghana',
    city: '',
    sector: 'Retail / trade',
    yearsOperating: '2',
    womanOwned: 'yes',
    employees: '1-5',
    monthlyRevenue: '',
    annualTurnover: '',
    hasBankAccount: 'yes',
    fundingNeed: '',
    useOfFunds: 'Working capital / stock',
    docs: {
      registration: null,
      tax: null,
      financials: null,
    },
    submittedAt: null,
    matches: [],
  }
}

export function loadEligibilityDraft(user) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultEligibilityDraft(user)
    const parsed = JSON.parse(raw)
    return { ...defaultEligibilityDraft(user), ...parsed, docs: { ...defaultEligibilityDraft().docs, ...parsed.docs } }
  } catch {
    return defaultEligibilityDraft(user)
  }
}

export function saveEligibilityDraft(draft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    /* ignore quota */
  }
}

function scoreGrant(grant, draft) {
  const text = `${grant.title} ${grant.type} ${grant.region} ${grant.eligibility} ${grant.description}`.toLowerCase()
  let score = 40
  const reasons = []
  const gaps = []

  if (draft.womanOwned === 'yes' && /woman|women|female|she/.test(text)) {
    score += 22
    reasons.push('Women-led programmes match your ownership profile')
  }

  if (draft.registered === 'yes' && /registered|registration|msse|gea/.test(text)) {
    score += 12
    reasons.push('Registration status aligns with funder rules')
  } else if (draft.registered !== 'yes' && /registered/.test(text)) {
    score -= 18
    gaps.push('Complete business registration to unlock this fund')
  }

  if (/ghana|west africa|pan-africa|africa/.test((grant.region || '').toLowerCase())) {
    score += 10
    reasons.push(`Region fit: ${grant.region}`)
  }

  const sector = (draft.sector || '').toLowerCase()
  if (sector.includes('tech') && /tech|digital|innovation|startup/.test(text)) {
    score += 14
    reasons.push('Sector fit with tech / digital grants')
  } else if (sector.includes('agri') && /agri|farm|food/.test(text)) {
    score += 14
    reasons.push('Sector fit with agri-business grants')
  } else if (sector.includes('fashion') || sector.includes('creative')) {
    if (/creative|fashion|all sectors|women|smb/.test(text)) {
      score += 10
      reasons.push('Sector broadly accepted by this funder')
    }
  } else if (/all sectors|small business|smb|women/.test(text)) {
    score += 8
    reasons.push('Open to your business category')
  }

  const turnover = Number(draft.annualTurnover) || 0
  if (turnover > 0 && turnover < 1000000 && /under gh₵ 1m|micro|small|msse/.test(text)) {
    score += 10
    reasons.push('Turnover within micro/small enterprise band')
  }

  const years = Number(draft.yearsOperating) || 0
  if (years > 0 && years < 3 && /under 3 years|startup|nascent|early/.test(text)) {
    score += 8
    reasons.push('Business age fits early-stage criteria')
  }

  if (!draft.docs?.registration) gaps.push('Upload business registration certificate')
  if (!draft.docs?.tax) gaps.push('Upload tax identification document')
  if (!draft.docs?.financials && /revenue|customers|financial|turnover|bank/.test(text)) {
    gaps.push('Add a financial statement to strengthen verification')
  }

  score = Math.max(8, Math.min(98, Math.round(score)))

  let status = 'Eligible'
  let nextStep = 'Review eligibility notes and prepare your application packet.'

  if (gaps.some((g) => g.includes('registration') || g.includes('tax'))) {
    status = 'Action Required'
    nextStep = gaps[0]
  } else if (!draft.docs?.financials || score < 62) {
    status = 'Pending Verification'
    nextStep = gaps[0] || 'Prospera will simulate document review before you apply.'
  } else if (score >= 72) {
    status = 'Eligible'
    nextStep = 'Shortlist this grant and ask Sena to draft your application outline.'
  } else {
    status = 'Pending Verification'
    nextStep = 'Confirm sector and revenue details, then re-run matching.'
  }

  return {
    grantId: grant.id,
    title: grant.title,
    amount: grant.amount,
    deadline: grant.deadline,
    source: grant.source,
    type: grant.type,
    region: grant.region,
    score,
    status,
    reasons: reasons.slice(0, 3),
    gaps: gaps.slice(0, 3),
    nextStep,
    externalUrl: grant.externalUrl,
  }
}

/**
 * Simulated qualification engine against curated / demo grant catalogue.
 */
export function evaluateEligibility(draft, grants = DEMO_GRANTS) {
  return [...grants]
    .map((grant) => scoreGrant(grant, draft))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
}

export function statusTone(status) {
  if (status === 'Eligible') return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (status === 'Action Required') return 'bg-rose-50 text-rose-800 border-rose-200'
  return 'bg-amber-50 text-amber-900 border-amber-200'
}
