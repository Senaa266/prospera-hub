/**
 * Susu circle protection: hit-and-run prevention, zero-loss reallocation,
 * trust scoring, payout priority, and platform blacklisting.
 */

export const STATUTORY_DEFAULT_FEE_RATE = 0.05
export const EARLY_SLOT_COLLATERAL_RATE = 0.1
export const MIN_TRUST_FOR_EARLY_PAYOUT = 70
export const MIN_TRUST_FOR_MID_PAYOUT = 45
export const SECURITY_DEPOSIT_WEEKS = 1

export function computeTrustScore({
  onTimePayments = 0,
  expectedPayments = 1,
  credentialsVerified = false,
  tenureWeeks = 0,
  priorDefaults = 0,
  mandateActive = false,
} = {}) {
  const consistency = Math.min(1, onTimePayments / Math.max(1, expectedPayments))
  let score = Math.round(consistency * 55)
  score += credentialsVerified ? 18 : 0
  score += Math.min(15, tenureWeeks * 1.5)
  score += mandateActive ? 12 : 0
  score -= priorDefaults * 22
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function requiredCollateral({ weekly, members, trustScore, payoutSlotIndex }) {
  const expectedPayout = weekly * members
  const earlyBand = payoutSlotIndex < Math.ceil(members * 0.33)
  if (!earlyBand) {
    return Math.round(weekly * SECURITY_DEPOSIT_WEEKS)
  }
  const riskMultiplier =
    trustScore >= MIN_TRUST_FOR_EARLY_PAYOUT ? 1 : trustScore >= MIN_TRUST_FOR_MID_PAYOUT ? 1.4 : 1.8
  return Math.round(expectedPayout * EARLY_SLOT_COLLATERAL_RATE * riskMultiplier)
}

export function assignPayoutPriority(members) {
  const ranked = [...members].sort((a, b) => {
    if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore
    if (Boolean(b.credentialsVerified) !== Boolean(a.credentialsVerified)) {
      return Number(b.credentialsVerified) - Number(a.credentialsVerified)
    }
    return (b.onTimePayments || 0) - (a.onTimePayments || 0)
  })

  return ranked.map((member, index) => {
    const slot = index + 1
    const trust = member.trustScore ?? 0
    let distribution = 'full'
    let note = 'Full lump-sum when your slot arrives.'

    if (trust < MIN_TRUST_FOR_MID_PAYOUT) {
      distribution = 'staggered'
      note = 'Milestone payout: 50% mid-cycle, 50% after final on-time contributions.'
    } else if (trust < MIN_TRUST_FOR_EARLY_PAYOUT && slot <= Math.ceil(ranked.length * 0.33)) {
      distribution = 'deferred'
      note = 'Early slot blocked until trust ≥ 70 or extra collateral is locked.'
    }

    const collateral = requiredCollateral({
      weekly: member.weekly,
      members: ranked.length,
      trustScore: trust,
      payoutSlotIndex: index,
    })

    return {
      ...member,
      payoutSlot: slot,
      distribution,
      note,
      collateralRequired: collateral,
      earlyEligible: distribution === 'full' && trust >= MIN_TRUST_FOR_EARLY_PAYOUT,
    }
  })
}

export function flagHitAndRun({
  memberId,
  memberName,
  circleId,
  weekly,
  cyclesRemaining,
  payoutReceived,
  missedCycles = 1,
}) {
  const outstandingPrincipal = Math.max(0, Math.round(cyclesRemaining * weekly))
  const defaultFee = Math.round(outstandingPrincipal * STATUTORY_DEFAULT_FEE_RATE)
  return {
    id: `def-${circleId}-${memberId}-${Date.now()}`,
    memberId,
    memberName,
    circleId,
    status: 'deficit',
    payoutReceived,
    missedCycles,
    cyclesRemaining,
    weekly,
    outstandingPrincipal,
    defaultFee,
    totalOwed: outstandingPrincipal + defaultFee,
    flaggedAt: new Date().toISOString(),
    settledAt: null,
  }
}

export function reallocateAfterDefault({
  outstandingPrincipal,
  defaulterCollateral = 0,
  sharedSecurityPool = 0,
  activeMemberCount,
}) {
  let remaining = Math.max(0, outstandingPrincipal)
  const fromCollateral = Math.min(remaining, Math.max(0, defaulterCollateral))
  remaining -= fromCollateral

  const fromSecurityPool = Math.min(remaining, Math.max(0, sharedSecurityPool))
  remaining -= fromSecurityPool

  const safeMembers = Math.max(1, activeMemberCount)
  const temporarySurchargePerMember = Math.ceil(remaining / safeMembers)
  const recoveredViaSurcharge = temporarySurchargePerMember * safeMembers
  const circleLoss = Math.max(0, remaining - recoveredViaSurcharge)

  return {
    fromCollateral,
    fromSecurityPool,
    temporarySurchargePerMember,
    recoveredViaSurcharge,
    residualCovered: remaining,
    circleLoss,
    zeroLossGuaranteed: circleLoss === 0,
    explanation:
      circleLoss === 0
        ? 'Shortfall fully covered by collateral, security pool, and temporary member surcharge — circle stays whole.'
        : 'Unexpected residual after reallocation; escalate to circle admins.',
  }
}

export function settleFromLinkedWallets({
  outstandingPrincipal,
  defaultFee,
  personalWallet = 0,
  circleCredit = 0,
  grantWallet = 0,
}) {
  let owed = outstandingPrincipal + defaultFee
  const deductions = {
    personalWallet: 0,
    circleCredit: 0,
    grantWallet: 0,
  }

  const take = (key, available) => {
    const amount = Math.min(owed, Math.max(0, available))
    deductions[key] = amount
    owed -= amount
  }

  take('personalWallet', personalWallet)
  take('circleCredit', circleCredit)
  take('grantWallet', grantWallet)

  return {
    deductions,
    remainingDebt: owed,
    fullySettled: owed === 0,
    walletsAfter: {
      personalWallet: Math.max(0, personalWallet - deductions.personalWallet),
      circleCredit: Math.max(0, circleCredit - deductions.circleCredit),
      grantWallet: Math.max(0, grantWallet - deductions.grantWallet),
    },
  }
}

export function platformRestrictions(hasOpenDeficit, blacklisted) {
  const blocked = Boolean(hasOpenDeficit || blacklisted)
  return {
    blocked,
    canJoinSavingsCircle: !blocked,
    canAccessGrants: !blocked,
    canAccessInvestorMatching: !blocked,
    canCashOut: !blocked,
    message: blocked
      ? 'Settle your susu deficit (principal + statutory fee) to unlock grants, investor matching, and new circles.'
      : 'All Prospera growth tools are available.',
  }
}

export function createStandingOrderMandate({
  provider,
  rail,
  reference,
  amount,
  cadence = 'weekly',
  circleId,
}) {
  const d = new Date()
  if (cadence === 'bi-weekly') d.setDate(d.getDate() + 14)
  else d.setDate(d.getDate() + 7)
  return {
    id: `mandate-${Date.now()}`,
    provider,
    rail,
    reference: String(reference || '').trim(),
    amount: Number(amount) || 0,
    cadence,
    circleId,
    status: 'active',
    createdAt: new Date().toISOString(),
    nextRunAt: d.toISOString(),
  }
}

export function trustBand(score) {
  if (score >= MIN_TRUST_FOR_EARLY_PAYOUT) return { label: 'Strong', tone: 'emerald' }
  if (score >= MIN_TRUST_FOR_MID_PAYOUT) return { label: 'Building', tone: 'amber' }
  return { label: 'At risk', tone: 'rose' }
}
