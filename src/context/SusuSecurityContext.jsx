import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { GROUPS } from '../data/savings'
import {
  assignPayoutPriority,
  computeTrustScore,
  createStandingOrderMandate,
  flagHitAndRun,
  platformRestrictions,
  reallocateAfterDefault,
  settleFromLinkedWallets,
  STATUTORY_DEFAULT_FEE_RATE,
} from '../lib/susuProtection'

const STORAGE_KEY = 'prospera-susu-security'
const SusuSecurityContext = createContext(null)

function seedMembersForCircle(group) {
  return (group.roster || []).map((row, index) => {
    const onTime = row.paid ? Math.min(8, 4 + (index % 4)) : Math.max(0, 2 - (index % 3))
    const expected = 8
    const credentialsVerified = index % 3 !== 2
    const priorDefaults = index === 4 ? 1 : 0
    const trustScore = computeTrustScore({
      onTimePayments: onTime,
      expectedPayments: expected,
      credentialsVerified,
      tenureWeeks: 6 + index,
      priorDefaults,
      mandateActive: false,
    })
    return {
      id: `${group.id}-m${index}`,
      name: row.name,
      paid: row.paid,
      onTimePayments: onTime,
      expectedPayments: expected,
      credentialsVerified,
      tenureWeeks: 6 + index,
      priorDefaults,
      trustScore,
      weekly: group.weekly,
      collateralLocked: Math.round(group.weekly * (trustScore >= 70 ? 1 : 2)),
      status: 'active',
    }
  })
}

function defaultState() {
  const circles = {}
  for (const group of GROUPS) {
    const members = seedMembersForCircle(group)
    circles[group.id] = {
      members: assignPayoutPriority(members),
      sharedSecurityPool: group.weekly * 2,
      surchargePerMember: 0,
      lastReallocation: null,
    }
  }

  return {
    mandates: [],
    deficits: [],
    blacklistedMemberIds: [],
    personalWallet: 2400,
    grantWallet: 350,
    circles,
    audit: [
      {
        id: 'audit-seed',
        at: new Date().toISOString(),
        type: 'system',
        text: 'Susu protection engine armed: collateral, mandates, and hit-and-run recovery online.',
      },
    ],
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    const base = defaultState()
    return {
      ...base,
      ...parsed,
      circles: { ...base.circles, ...(parsed.circles || {}) },
    }
  } catch {
    return defaultState()
  }
}

function pushAudit(state, text, type = 'event') {
  return {
    ...state,
    audit: [{ id: `audit-${Date.now()}`, at: new Date().toISOString(), type, text }, ...state.audit].slice(
      0,
      40,
    ),
  }
}

function withMandateTrust(members, mandates, circleId) {
  const mandateActive = mandates.some((x) => x.circleId === circleId && x.status === 'active')
  return assignPayoutPriority(
    members.map((m) => ({
      ...m,
      trustScore: computeTrustScore({
        onTimePayments: m.onTimePayments,
        expectedPayments: m.expectedPayments,
        credentialsVerified: m.credentialsVerified,
        tenureWeeks: m.tenureWeeks,
        priorDefaults: m.priorDefaults,
        mandateActive: mandateActive || m.id === 'you',
      }),
      weekly: m.weekly,
    })),
  )
}

export function SusuSecurityProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const openDeficit = useMemo(
    () => state.deficits.find((d) => d.status === 'deficit') || null,
    [state.deficits],
  )

  const userHasOpenDeficit = Boolean(
    openDeficit && (openDeficit.memberId === 'you' || openDeficit.memberName === 'You'),
  )
  const youBlacklisted = state.blacklistedMemberIds.includes('you')
  const restrictions = platformRestrictions(userHasOpenDeficit, youBlacklisted)

  const api = useMemo(() => {
    const getCircle = (circleId) => state.circles[circleId] || null

    const enableMandate = ({ circleId, provider, rail, reference, amount, cadence }) => {
      const mandate = createStandingOrderMandate({
        circleId,
        provider,
        rail,
        reference,
        amount,
        cadence,
      })
      setState((current) => {
        const circle = current.circles[circleId]
        const nextMandates = [
          mandate,
          ...current.mandates.filter((m) => !(m.circleId === circleId && m.status === 'active')),
        ]
        const next = {
          ...current,
          mandates: nextMandates,
          circles: circle
            ? {
                ...current.circles,
                [circleId]: {
                  ...circle,
                  members: withMandateTrust(circle.members, nextMandates, circleId),
                },
              }
            : current.circles,
        }
        return pushAudit(
          next,
          `Standing order active: ${provider} auto-debits GH₵ ${amount} (${cadence}).`,
          'mandate',
        )
      })
      return mandate
    }

    const lockCollateralForYou = (circleId) => {
      const group = GROUPS.find((g) => g.id === circleId)
      const circle = state.circles[circleId]
      if (!group || !circle) return 0
      const amount = Math.round(group.weekly * group.members * 0.1)
      setState((current) => {
        const c = current.circles[circleId]
        let members = [...c.members]
        const youIdx = members.findIndex((m) => m.id === 'you' || m.name === 'You')
        if (youIdx === -1) {
          members = [
            {
              id: 'you',
              name: 'You',
              paid: true,
              onTimePayments: 6,
              expectedPayments: 8,
              credentialsVerified: true,
              tenureWeeks: 10,
              priorDefaults: 0,
              trustScore: 82,
              weekly: group.weekly,
              collateralLocked: amount,
              status: 'active',
            },
            ...members,
          ]
        } else {
          members = members.map((m, i) =>
            i === youIdx ? { ...m, collateralLocked: (m.collateralLocked || 0) + amount } : m,
          )
        }
        return pushAudit(
          {
            ...current,
            personalWallet: Math.max(0, current.personalWallet - amount),
            circles: {
              ...current.circles,
              [circleId]: {
                ...c,
                members: withMandateTrust(members, current.mandates, circleId),
                sharedSecurityPool: c.sharedSecurityPool + Math.round(amount * 0.2),
              },
            },
          },
          `Locked GH₵ ${amount} safety collateral for early payout eligibility.`,
          'collateral',
        )
      })
      return amount
    }

    const applyHitAndRun = (circleId, memberId, { blacklistYou = false } = {}) => {
      setState((current) => {
        const group = GROUPS.find((g) => g.id === circleId)
        const circle = current.circles[circleId]
        if (!group || !circle) return current

        let members = [...circle.members]
        let member = members.find((m) => m.id === memberId)
        if (!member && memberId === 'you') {
          member = {
            id: 'you',
            name: 'You',
            paid: true,
            onTimePayments: 4,
            expectedPayments: 8,
            credentialsVerified: true,
            tenureWeeks: 8,
            priorDefaults: 0,
            trustScore: 78,
            weekly: group.weekly,
            collateralLocked: Math.round(group.weekly * group.members * 0.1),
            status: 'active',
          }
          members = [member, ...members]
        }
        if (!member) return current

        const cyclesRemaining = Math.max(2, Math.ceil(group.members * 0.55))
        const payoutReceived = group.weekly * group.members
        const deficit = flagHitAndRun({
          memberId: member.id,
          memberName: member.name,
          circleId,
          weekly: group.weekly,
          cyclesRemaining,
          payoutReceived,
          missedCycles: 2,
        })

        const activeCount = Math.max(
          1,
          members.filter((m) => m.id !== member.id && m.status !== 'deficit').length,
        )
        const cover = reallocateAfterDefault({
          outstandingPrincipal: deficit.outstandingPrincipal,
          defaulterCollateral: member.collateralLocked || 0,
          sharedSecurityPool: circle.sharedSecurityPool,
          activeMemberCount: activeCount,
        })

        members = members.map((m) => {
          if (m.id !== member.id) return m
          return {
            ...m,
            status: 'deficit',
            priorDefaults: (m.priorDefaults || 0) + 1,
            collateralLocked: Math.max(0, (m.collateralLocked || 0) - cover.fromCollateral),
          }
        })

        const blacklist = [...new Set([...current.blacklistedMemberIds, member.id])]
        if (blacklistYou) blacklist.push('you')

        return pushAudit(
          {
            ...current,
            blacklistedMemberIds: blacklist,
            deficits: [deficit, ...current.deficits.filter((d) => !(d.status === 'deficit' && d.memberId === member.id))],
            circles: {
              ...current.circles,
              [circleId]: {
                ...circle,
                members: withMandateTrust(members, current.mandates, circleId),
                sharedSecurityPool: Math.max(0, circle.sharedSecurityPool - cover.fromSecurityPool),
                surchargePerMember: cover.temporarySurchargePerMember,
                lastReallocation: { ...cover, at: new Date().toISOString(), deficitId: deficit.id },
              },
            },
          },
          `Hit-and-run: ${member.name} owes GH₵ ${deficit.totalOwed}. Covered via collateral GH₵ ${cover.fromCollateral}, pool GH₵ ${cover.fromSecurityPool}, surcharge GH₵ ${cover.temporarySurchargePerMember}/member. Zero-loss=${cover.zeroLossGuaranteed}.`,
          'default',
        )
      })
    }

    const simulatePeerDefault = (circleId) => {
      const circle = state.circles[circleId]
      const target =
        circle?.members.find((m) => m.status !== 'deficit' && m.id !== 'you') || circle?.members[0]
      if (!target) return
      applyHitAndRun(circleId, target.id, { blacklistYou: false })
    }

    const simulateSelfDefault = (circleId) => {
      applyHitAndRun(circleId, 'you', { blacklistYou: true })
    }

    const settleOpenDeficit = () => {
      setState((current) => {
        const deficit = current.deficits.find((d) => d.status === 'deficit')
        if (!deficit) return current

        const settlement = settleFromLinkedWallets({
          outstandingPrincipal: deficit.outstandingPrincipal,
          defaultFee: deficit.defaultFee,
          personalWallet: current.personalWallet,
          circleCredit: current.circles[deficit.circleId]?.sharedSecurityPool || 0,
          grantWallet: current.grantWallet,
        })

        const circle = current.circles[deficit.circleId]
        const members = (circle?.members || []).map((m) =>
          m.id === deficit.memberId
            ? { ...m, status: settlement.fullySettled ? 'settled' : 'deficit' }
            : m,
        )

        let next = {
          ...current,
          personalWallet: settlement.walletsAfter.personalWallet,
          grantWallet: settlement.walletsAfter.grantWallet,
          deficits: current.deficits.map((d) =>
            d.id === deficit.id
              ? {
                  ...d,
                  status: settlement.fullySettled ? 'settled' : 'deficit',
                  outstandingPrincipal: settlement.fullySettled
                    ? 0
                    : Math.max(0, deficit.outstandingPrincipal - (settlement.deductions.personalWallet + settlement.deductions.circleCredit + settlement.deductions.grantWallet - deficit.defaultFee)),
                  totalOwed: settlement.remainingDebt,
                  settledAt: settlement.fullySettled ? new Date().toISOString() : null,
                }
              : d,
          ),
          circles: circle
            ? {
                ...current.circles,
                [deficit.circleId]: {
                  ...circle,
                  members: withMandateTrust(members, current.mandates, deficit.circleId),
                  surchargePerMember: settlement.fullySettled ? 0 : circle.surchargePerMember,
                  sharedSecurityPool: settlement.walletsAfter.circleCredit,
                },
              }
            : current.circles,
        }

        if (settlement.fullySettled) {
          next = {
            ...next,
            blacklistedMemberIds: next.blacklistedMemberIds.filter(
              (id) => id !== deficit.memberId && !(deficit.memberId === 'you' && id === 'you'),
            ),
          }
          next = pushAudit(
            next,
            `Settled deficit from linked wallets (principal + ${Math.round(STATUTORY_DEFAULT_FEE_RATE * 100)}% fee). Grants & circles unlocked.`,
            'settlement',
          )
        } else {
          next = pushAudit(
            next,
            `Partial clawback applied. Remaining GH₵ ${settlement.remainingDebt}.`,
            'settlement',
          )
        }
        return next
      })
    }

    const clearDemoProtection = () => setState(defaultState())

    return {
      mandates: state.mandates,
      deficits: state.deficits,
      blacklistedMemberIds: state.blacklistedMemberIds,
      personalWallet: state.personalWallet,
      grantWallet: state.grantWallet,
      audit: state.audit,
      circles: state.circles,
      openDeficit,
      userHasOpenDeficit,
      restrictions,
      getCircle,
      enableMandate,
      lockCollateralForYou,
      simulatePeerDefault,
      simulateSelfDefault,
      settleOpenDeficit,
      clearDemoProtection,
    }
  }, [state, openDeficit, userHasOpenDeficit, restrictions])

  return <SusuSecurityContext.Provider value={api}>{children}</SusuSecurityContext.Provider>
}

export function useSusuSecurity() {
  const ctx = useContext(SusuSecurityContext)
  if (!ctx) throw new Error('useSusuSecurity must be used within SusuSecurityProvider')
  return ctx
}
