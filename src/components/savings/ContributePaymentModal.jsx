import { useMemo, useState } from 'react'
import Icon from '../icons'
import { savings } from '../../api/client'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'

const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

const METHODS = [
  {
    id: 'momo',
    label: 'Mobile Money',
    hint: 'Pay with your phone in seconds',
    providers: [
      { id: 'mtn', name: 'MTN', blurb: 'MoMo wallet', tone: 'bg-[#ffcc00] text-ink-strong' },
      { id: 'telecel', name: 'Telecel', blurb: 'Telecel Cash', tone: 'bg-[#e11d2d] text-white' },
    ],
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    hint: 'Send from your bank app or branch',
    providers: [
      { id: 'absa', name: 'Absa', blurb: 'Instant transfer', tone: 'bg-[#c8102e] text-white' },
      { id: 'fidelity', name: 'Fidelity', blurb: 'Mobile / internet banking', tone: 'bg-[#0b7a3b] text-white' },
      { id: 'gcb', name: 'GCB', blurb: 'GCB Mobile', tone: 'bg-[#0033a0] text-white' },
    ],
  },
]

function findProvider(id) {
  for (const method of METHODS) {
    const provider = method.providers.find((item) => item.id === id)
    if (provider) return { method, provider }
  }
  return null
}

/**
 * Contribution checkout. When VITE_PAYSTACK_PUBLIC_KEY is set, a Paystack inline
 * popup is used; otherwise the same flow runs in demo mode and every payment is
 * still recorded on the server so it shows up in savings.
 */
export function ContributePaymentModal({
  open,
  onClose,
  circle,
  goal,
  token,
  email,
  defaultAmount = 200,
  onSuccess,
}) {
  const [step, setStep] = useState('method')
  const [methodId, setMethodId] = useState('')
  const [providerId, setProviderId] = useState('')
  const [amount, setAmount] = useState(String(defaultAmount))
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState({ ref: '', account: null })

  const method = METHODS.find((item) => item.id === methodId)
  const selected = findProvider(providerId)
  const parsedAmount = Number(amount)
  const amountOk = Number.isFinite(parsedAmount) && parsedAmount > 0
  const referenceOk = reference.trim().length >= 6
  const targetLabel = circle?.name || goal?.name || 'your savings'
  const liveMode = Boolean(PAYSTACK_KEY)

  const reset = () => {
    setStep('method')
    setMethodId('')
    setProviderId('')
    setAmount(String(defaultAmount))
    setReference('')
    setBusy(false)
    setError('')
    setReceipt({ ref: '', account: null })
  }

  const close = () => {
    reset()
    onClose?.()
  }

  const title = useMemo(() => {
    if (step === 'success') return 'Payment confirmed'
    if (step === 'details') return `Pay with ${selected?.provider.name || 'provider'}`
    if (step === 'provider') return method?.label || 'Choose a provider'
    return `Contribute to ${targetLabel}`
  }, [step, selected, method, targetLabel])

  const recordOnServer = async (ref) => {
    const result = await savings.payNow(
      {
        circleId: circle?.id,
        goalId: goal?.id,
        amount: parsedAmount,
        method: selected?.method.id === 'momo' ? 'paystack' : selected?.provider.id || 'bank',
        reference: ref,
      },
      token
    )
    return result
  }

  const confirm = async () => {
    if (!amountOk || !referenceOk || busy) return
    setBusy(true)
    setError('')

    const attempt = async (ref) => {
      const result = await recordOnServer(ref)
      setReceipt({ ref: result.payment?.reference || ref, account: result.account })
      setBusy(false)
      setStep('success')
      onSuccess?.({ amount: parsedAmount, reference: result.payment?.reference || ref, account: result.account })
    }

    try {
      if (liveMode && typeof window.PaystackPop !== 'undefined') {
        const baseRef = `PS-${Date.now().toString().slice(-8)}`
        const popup = window.PaystackPop.newSetup({
          key: PAYSTACK_KEY,
          email: email || 'customer@prospera.demo',
          amount: parsedAmount * 100,
          currency: 'GHS',
          ref: baseRef,
          metadata: {
            circle_id: circle?.id || null,
            goal_id: goal?.id || null,
            custom_fields: [{ display_name: 'Saved to', variable_name: 'saved_to', value: targetLabel }],
          },
          callback: (response) => {
            void attempt(response.reference)
          },
          onClose: () => {
            setBusy(false)
          },
        })
        popup.openIframe()
        return
      }

      await new Promise((resolve) => window.setTimeout(resolve, 900))
      const code = `PH-${Date.now().toString().slice(-6)}`
      await attempt(code)
    } catch (err) {
      setBusy(false)
      setError(err.message || 'Payment could not be completed')
    }
  }

  return (
    <Modal open={open} title={title} onClose={close}>
      {step === 'method' && (
        <div className="grid gap-3">
          <p className="m-0 text-sm text-muted">
            Choose how you want to send this payment to {targetLabel}. You will confirm the amount
            before anything is recorded.
          </p>
          {METHODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMethodId(item.id)
                setStep('provider')
              }}
              className="flex items-center justify-between rounded-2xl border border-line bg-canvas px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-prospera hover:bg-prospera-soft"
            >
              <span>
                <strong className="block text-ink-strong">{item.label}</strong>
                <span className="text-sm text-muted">{item.hint}</span>
              </span>
              <Icon name="arrowRight" size={18} />
            </button>
          ))}
        </div>
      )}

      {step === 'provider' && method && (
        <div className="grid gap-3">
          <p className="m-0 text-sm text-muted">Select a {method.label.toLowerCase()} provider.</p>
          {method.providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => {
                setProviderId(provider.id)
                setStep('details')
              }}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-ink-strong"
            >
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-extrabold ${provider.tone}`}
              >
                {provider.name.slice(0, 3).toUpperCase()}
              </span>
              <span className="min-w-0">
                <strong className="block text-ink-strong">{provider.name}</strong>
                <span className="text-sm text-muted">{provider.blurb}</span>
              </span>
            </button>
          ))}
          <AppButton variant="ghost" onClick={() => setStep('method')}>
            Back to payment methods
          </AppButton>
        </div>
      )}

      {step === 'details' && selected && (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void confirm()
          }}
        >
          <p className="m-0 rounded-2xl bg-canvas px-4 py-3 text-sm leading-6 text-muted">
            You are paying <strong className="text-ink">{targetLabel}</strong> via{' '}
            <strong className="text-ink">{selected.provider.name}</strong>.
            {liveMode ? (
              <> Paystack will open a secure checkout, and your savings update the moment it confirms.</>
            ) : (
              <> This demo checks out instantly and records the payment in your savings.</>
            )}
          </p>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Amount (GH₵)
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            {selected.method.id === 'momo' ? 'Mobile number' : 'Account or wallet number'}
            <input
              type="tel"
              inputMode="numeric"
              placeholder={selected.method.id === 'momo' ? '024 XXX XXXX' : 'Account number'}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
              required
            />
          </label>
          {error && <p className="m-0 text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit" disabled={!amountOk || !referenceOk || busy}>
              {busy ? 'Processing…' : `Pay GH₵ ${amountOk ? parsedAmount.toLocaleString() : '—'}`}
            </AppButton>
            <AppButton variant="outline" onClick={() => setStep('provider')}>
              Change provider
            </AppButton>
          </div>
        </form>
      )}

      {step === 'success' && (
        <div className="grid gap-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Icon name="check" size={22} />
          </div>
          <p className="m-0 text-sm leading-6 text-muted">
            {`GH₵ ${parsedAmount.toLocaleString()}`} to {targetLabel} is recorded via{' '}
            {selected?.provider.name}. Reference <strong className="text-ink">{receipt.ref}</strong>.
          </p>
          <AppButton onClick={close}>Done</AppButton>
        </div>
      )}
    </Modal>
  )
}

export default ContributePaymentModal