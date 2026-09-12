import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useSusuSecurity } from '../context/SusuSecurityContext'
import Icon from '../components/icons'
import DocumentUploadZone from '../components/grants/DocumentUploadZone'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  DOC_SLOTS,
  ELIGIBILITY_STEPS,
  defaultEligibilityDraft,
  evaluateEligibility,
  loadEligibilityDraft,
  saveEligibilityDraft,
  statusTone,
} from '../lib/grantEligibility'
import { DEMO_GRANTS } from '../data/grants'
import { loadGrants } from '../utils/grants'

const SECTORS = [
  'Retail / trade',
  'Fashion / apparel',
  'Food & beverages',
  'Agri-business',
  'Beauty / personal care',
  'Tech / digital',
  'Services',
  'Manufacturing / crafts',
  'Other',
]

const fieldClass =
  'w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-prospera focus:ring-2 focus:ring-prospera/20'

function FieldTip({ text }) {
  const tipId = useId()
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted transition hover:bg-canvas hover:text-prospera"
        aria-describedby={tipId}
        aria-label="More information"
      >
        <Icon name="info" size={14} />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-56 -translate-x-1/2 rounded-xl bg-ink-strong px-3 py-2 text-left text-xs font-medium leading-5 text-white opacity-0 shadow-lg transition group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}

function StepRail({ stepIndex }) {
  const pct = Math.round((stepIndex / (ELIGIBILITY_STEPS.length - 1)) * 100)
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="m-0 text-sm font-semibold text-ink">
          Step {stepIndex + 1} of {ELIGIBILITY_STEPS.length}
          <span className="ml-2 font-medium text-muted">· {ELIGIBILITY_STEPS[stepIndex].title}</span>
        </p>
        <span className="text-xs font-semibold text-muted">{pct}% complete</span>
      </div>
      <ProgressBar value={pct} label="Eligibility wizard progress" className="mb-5" />
      <ol className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
        {ELIGIBILITY_STEPS.map((step, index) => {
          const done = index < stepIndex
          const current = index === stepIndex
          return (
            <li
              key={step.id}
              className={`rounded-xl border px-3 py-2.5 transition duration-300 ${
                current
                  ? 'border-prospera bg-prospera-soft shadow-[var(--shadow-card)]'
                  : done
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-line bg-card'
              }`}
              aria-current={current ? 'step' : undefined}
            >
              <span
                className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  current
                    ? 'bg-prospera text-white'
                    : done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-canvas text-muted'
                }`}
              >
                {done ? <Icon name="check" size={12} /> : index + 1}
              </span>
              <p className="m-0 text-xs font-bold text-ink-strong sm:text-sm">{step.short}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function GrantEligibility() {
  const { user } = useAuth()
  const { open } = useChat()
  const { restrictions, settleOpenDeficit } = useSusuSecurity()
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState(() => loadEligibilityDraft(user))
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [grantsCatalog, setGrantsCatalog] = useState(DEMO_GRANTS)

  useEffect(() => {
    saveEligibilityDraft(draft)
  }, [draft])

  useEffect(() => {
    let active = true
    loadGrants()
      .then(({ grants }) => {
        if (active && grants?.length) setGrantsCatalog(grants)
      })
      .catch(() => {
        /* keep demo catalogue */
      })
    return () => {
      active = false
    }
  }, [])

  const patch = (partial) => {
    setFormError('')
    setDraft((current) => ({ ...current, ...partial }))
  }

  const setDoc = (key, value) => {
    setFormError('')
    setDraft((current) => ({
      ...current,
      docs: { ...current.docs, [key]: value },
    }))
  }

  const requiredDocsReady = Boolean(draft.docs.registration && draft.docs.tax)

  const summary = useMemo(() => {
    const matches = draft.matches || []
    return {
      eligible: matches.filter((m) => m.status === 'Eligible').length,
      pending: matches.filter((m) => m.status === 'Pending Verification').length,
      action: matches.filter((m) => m.status === 'Action Required').length,
    }
  }, [draft.matches])

  const validateStep = (index) => {
    if (index === 0) {
      if (!draft.businessName.trim() || !draft.ownerName.trim() || !draft.city.trim()) {
        return 'Add your business name, owner name, and city to continue.'
      }
      if (draft.registered === 'yes' && !draft.registrationNumber.trim()) {
        return 'Enter your registration number, or mark the business as not yet registered.'
      }
    }
    if (index === 1) {
      if (!draft.monthlyRevenue || Number(draft.monthlyRevenue) <= 0) {
        return 'Enter an average monthly revenue so we can score funder fit.'
      }
      if (!draft.fundingNeed || Number(draft.fundingNeed) <= 0) {
        return 'Tell us how much funding you are seeking.'
      }
    }
    if (index === 2 && !requiredDocsReady) {
      return 'Upload required registration and tax documents before matching.'
    }
    return ''
  }

  const goNext = async () => {
    if (!restrictions.canAccessGrants) {
      setFormError(restrictions.message)
      return
    }
    const error = validateStep(stepIndex)
    if (error) {
      setFormError(error)
      return
    }

    if (stepIndex === 2) {
      setSubmitting(true)
      setFormError('')
      await new Promise((resolve) => window.setTimeout(resolve, 900))
      const matches = evaluateEligibility(draft, grantsCatalog)
      setDraft((current) => ({
        ...current,
        matches,
        submittedAt: new Date().toISOString(),
      }))
      setSubmitting(false)
      setStepIndex(3)
      return
    }

    setStepIndex((current) => Math.min(ELIGIBILITY_STEPS.length - 1, current + 1))
  }

  const goBack = () => {
    setFormError('')
    setStepIndex((current) => Math.max(0, current - 1))
  }

  const restart = () => {
    const next = defaultEligibilityDraft(user)
    setDraft(next)
    saveEligibilityDraft(next)
    setStepIndex(0)
    setFormError('')
  }

  return (
    <PageShell wide>
      <PageHeader
        title="Grant"
        accent="Eligibility"
        subtitle="Verify your business credentials in a few steps, then see which funding programmes fit — simulated matching, stored on this device."
        actions={
          <AppButton as={Link} to="/grants" variant="outline">
            Browse all grants
          </AppButton>
        }
      />

      {!restrictions.canAccessGrants ? (
        <div className="mb-6 flex flex-wrap items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
          <Icon name="shield" size={18} />
          <div className="min-w-0 flex-1">
            <p className="m-0 font-bold">Grants locked by susu deficit</p>
            <p className="mb-0 mt-1 leading-6">{restrictions.message}</p>
          </div>
          <AppButton variant="danger" className="text-xs" onClick={settleOpenDeficit}>
            Settle deficit
          </AppButton>
          <AppButton as={Link} to="/savings" variant="outline" className="text-xs">
            Open savings
          </AppButton>
        </div>
      ) : null}

      <StepRail stepIndex={stepIndex} />

      <div
        key={ELIGIBILITY_STEPS[stepIndex].id}
        className="animate-page-in"
        aria-live="polite"
      >
        {stepIndex === 0 ? (
          <AppCard className="hover:!translate-y-0 grid gap-4 md:grid-cols-2">
            <h2 className="m-0 text-lg font-bold text-ink-strong md:col-span-2">Business profile & registration</h2>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Business name
              <input
                className={fieldClass}
                value={draft.businessName}
                onChange={(e) => patch({ businessName: e.target.value })}
                autoComplete="organization"
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Owner / founder name
              <input
                className={fieldClass}
                value={draft.ownerName}
                onChange={(e) => patch({ ownerName: e.target.value })}
                autoComplete="name"
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              <span className="inline-flex items-center">
                Registered with authorities?
                <FieldTip text="Most Ghanaian and regional grants require a registered business or cooperative." />
              </span>
              <select
                className={fieldClass}
                value={draft.registered}
                onChange={(e) => patch({ registered: e.target.value })}
              >
                <option value="yes">Yes — formally registered</option>
                <option value="in-progress">Registration in progress</option>
                <option value="no">Not yet registered</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Registration number
              <input
                className={fieldClass}
                value={draft.registrationNumber}
                onChange={(e) => patch({ registrationNumber: e.target.value })}
                placeholder="e.g. BN123456789"
                disabled={draft.registered === 'no'}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Country
              <select className={fieldClass} value={draft.country} onChange={(e) => patch({ country: e.target.value })}>
                <option>Ghana</option>
                <option>Nigeria</option>
                <option>Kenya</option>
                <option>Other (Africa)</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              City / market
              <input
                className={fieldClass}
                value={draft.city}
                onChange={(e) => patch({ city: e.target.value })}
                placeholder="Accra, Kumasi, Tema…"
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Sector
              <select className={fieldClass} value={draft.sector} onChange={(e) => patch({ sector: e.target.value })}>
                {SECTORS.map((sector) => (
                  <option key={sector}>{sector}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Years operating
              <input
                type="number"
                min="0"
                max="40"
                className={fieldClass}
                value={draft.yearsOperating}
                onChange={(e) => patch({ yearsOperating: e.target.value })}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              <span className="inline-flex items-center">
                Woman-owned (≥51%)?
                <FieldTip text="Many Prospera-matched funds prioritise women founders and majority women-owned SMEs." />
              </span>
              <select
                className={fieldClass}
                value={draft.womanOwned}
                onChange={(e) => patch({ womanOwned: e.target.value })}
              >
                <option value="yes">Yes</option>
                <option value="co">Co-founded with equal ownership</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Team size
              <select className={fieldClass} value={draft.employees} onChange={(e) => patch({ employees: e.target.value })}>
                <option value="1">Just me</option>
                <option value="1-5">1–5 people</option>
                <option value="6-15">6–15 people</option>
                <option value="16+">16+</option>
              </select>
            </label>
          </AppCard>
        ) : null}

        {stepIndex === 1 ? (
          <AppCard className="hover:!translate-y-0 grid gap-4 md:grid-cols-2">
            <h2 className="m-0 text-lg font-bold text-ink-strong md:col-span-2">Financial & revenue metrics</h2>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              <span className="inline-flex items-center">
                Avg. monthly revenue (GH₵)
                <FieldTip text="A realistic monthly average helps us filter micro vs growth-stage funds." />
              </span>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={draft.monthlyRevenue}
                onChange={(e) => {
                  const monthly = e.target.value
                  const annual = monthly ? String(Math.round(Number(monthly) * 12)) : draft.annualTurnover
                  patch({ monthlyRevenue: monthly, annualTurnover: annual })
                }}
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Estimated annual turnover (GH₵)
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={draft.annualTurnover}
                onChange={(e) => patch({ annualTurnover: e.target.value })}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Business bank / MoMo account?
              <select
                className={fieldClass}
                value={draft.hasBankAccount}
                onChange={(e) => patch({ hasBankAccount: e.target.value })}
              >
                <option value="yes">Yes — business or dedicated wallet</option>
                <option value="personal">Personal account only</option>
                <option value="no">Not yet</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Funding need (GH₵)
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={draft.fundingNeed}
                onChange={(e) => patch({ fundingNeed: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink md:col-span-2">
              Primary use of funds
              <select
                className={fieldClass}
                value={draft.useOfFunds}
                onChange={(e) => patch({ useOfFunds: e.target.value })}
              >
                <option>Working capital / stock</option>
                <option>Equipment / tools</option>
                <option>Marketing & customers</option>
                <option>Training / certification</option>
                <option>Expansion / new location</option>
              </select>
            </label>
            <p className="m-0 rounded-xl bg-canvas px-4 py-3 text-sm leading-6 text-muted md:col-span-2">
              Numbers stay on this device for demo matching. Live funder APIs are not contacted during this flow.
            </p>
          </AppCard>
        ) : null}

        {stepIndex === 2 ? (
          <div className="grid gap-4">
            <AppCard className="hover:!translate-y-0">
              <h2 className="m-0 text-lg font-bold text-ink-strong">Upload credentials</h2>
              <p className="mb-0 mt-2 text-sm leading-6 text-muted">
                Drag files into each zone or browse from your phone. We validate format and size instantly, then simulate
                verification for matching — files are not sent to a remote server in this demo.
              </p>
            </AppCard>
            {DOC_SLOTS.map((slot) => (
              <DocumentUploadZone
                key={slot.key}
                label={slot.label}
                hint={slot.hint}
                required={slot.required}
                fileMeta={draft.docs[slot.key]}
                onUploaded={(meta) => setDoc(slot.key, meta)}
                onClear={() => setDoc(slot.key, null)}
              />
            ))}
          </div>
        ) : null}

        {stepIndex === 3 ? (
          <div className="grid gap-5">
            <AppCard className="hover:!translate-y-0 overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="m-0 text-xs font-bold uppercase tracking-wide text-prospera">Qualification engine</p>
                  <h2 className="mb-1 mt-1 text-xl font-bold text-ink-strong">
                    Matches for {draft.businessName || 'your business'}
                  </h2>
                  <p className="m-0 text-sm text-muted">
                    Cross-checked against {grantsCatalog.length} programmes using your profile, finances, and documents.
                    {draft.submittedAt
                      ? ` Last run ${new Date(draft.submittedAt).toLocaleString()}.`
                      : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    {summary.eligible} Eligible
                  </span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
                    {summary.pending} Pending
                  </span>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800">
                    {summary.action} Action required
                  </span>
                </div>
              </div>
            </AppCard>

            <div className="grid gap-4">
              {(draft.matches || []).map((match) => (
                <article
                  key={match.grantId}
                  className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(match.status)}`}
                        >
                          {match.status}
                        </span>
                        <span className="text-xs font-semibold text-muted">{match.score}% fit</span>
                      </div>
                      <h3 className="m-0 text-lg font-bold text-ink-strong">{match.title}</h3>
                      <p className="mb-0 mt-1 text-sm text-muted">
                        {match.source} · {match.region} · {match.amount}
                      </p>
                    </div>
                    <div className="w-28">
                      <ProgressBar value={match.score} label={`${match.title} fit score`} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-canvas px-3 py-3">
                      <p className="m-0 text-xs font-bold uppercase tracking-wide text-muted">Why it fits</p>
                      <ul className="mb-0 mt-2 list-disc space-y-1 pl-4 text-sm text-ink">
                        {(match.reasons.length ? match.reasons : ['General SME eligibility']).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-canvas px-3 py-3">
                      <p className="m-0 text-xs font-bold uppercase tracking-wide text-muted">Recommended next step</p>
                      <p className="mb-0 mt-2 text-sm leading-6 text-ink">{match.nextStep}</p>
                      {match.gaps?.length ? (
                        <ul className="mb-0 mt-2 list-disc space-y-1 pl-4 text-sm text-amber-900">
                          {match.gaps.map((gap) => (
                            <li key={gap}>{gap}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {match.externalUrl ? (
                      <AppButton
                        as="a"
                        href={match.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        variant="outline"
                        className="text-xs"
                      >
                        Funder site
                        <Icon name="external" size={14} />
                      </AppButton>
                    ) : null}
                    <AppButton
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        open(
                          `Help me apply for ${match.title}. My business is ${draft.businessName} in ${draft.sector}, seeking GH₵ ${draft.fundingNeed} for ${draft.useOfFunds}.`,
                        )
                      }
                    >
                      Ask Sena
                      <Icon name="sparkles" size={14} />
                    </AppButton>
                  </div>
                </article>
              ))}
            </div>

            {!draft.matches?.length ? (
              <AppCard className="text-center">
                <p className="m-0 font-semibold text-ink-strong">No matches yet</p>
                <p className="mt-2 text-sm text-muted">Go back, complete documents, and run matching again.</p>
              </AppCard>
            ) : null}
          </div>
        ) : null}
      </div>

      {formError ? (
        <p className="mt-4 text-sm font-semibold text-rose-700" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="flex flex-wrap gap-2">
          {stepIndex > 0 && stepIndex < 3 ? (
            <AppButton variant="outline" onClick={goBack}>
              Back
            </AppButton>
          ) : null}
          {stepIndex === 3 ? (
            <>
              <AppButton variant="outline" onClick={() => setStepIndex(2)}>
                Update documents
              </AppButton>
              <AppButton variant="ghost" onClick={restart}>
                Start over
              </AppButton>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {stepIndex < 2 ? (
            <AppButton onClick={goNext}>
              Continue
              <Icon name="arrowRight" size={16} />
            </AppButton>
          ) : null}
          {stepIndex === 2 ? (
            <AppButton onClick={goNext} disabled={submitting}>
              {submitting ? 'Matching programmes…' : 'Submit & match grants'}
              {!submitting ? <Icon name="check" size={16} /> : null}
            </AppButton>
          ) : null}
          {stepIndex === 3 ? (
            <AppButton as={Link} to="/grants">
              Open grants board
              <Icon name="arrowRight" size={16} />
            </AppButton>
          ) : null}
        </div>
      </div>
    </PageShell>
  )
}

export default GrantEligibility
