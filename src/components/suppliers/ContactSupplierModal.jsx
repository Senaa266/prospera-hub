import { useState } from 'react'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'

export function ContactSupplierModal({ open, supplier, onClose, onSend }) {
  const [subject, setSubject] = useState('Stock availability')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  const close = () => {
    setSubject('Stock availability')
    setBody('')
    setSent(false)
    onClose?.()
  }

  if (!supplier) return null

  return (
    <Modal open={open} title={sent ? 'Message sent' : `Contact ${supplier.name}`} onClose={close} wide>
      {sent ? (
        <div className="grid gap-4">
          <p className="m-0 text-sm text-muted">
            {supplier.contactName} usually replies during {supplier.hours}. You can also call or WhatsApp them
            directly.
          </p>
          <AppButton onClick={close}>Done</AppButton>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSend?.(supplier.id, { subject, body, to: supplier.email })
            setSent(true)
          }}
        >
          <dl className="grid gap-2 rounded-2xl bg-canvas px-4 py-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Contact</dt>
              <dd className="m-0 font-semibold text-ink">{supplier.contactName}</dd>
            </div>
            <div>
              <dt className="text-muted">Hours</dt>
              <dd className="m-0 font-semibold text-ink">{supplier.hours}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="m-0">
                <a className="font-semibold text-prospera" href={`tel:${supplier.phone}`}>
                  {supplier.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="m-0">
                <a className="font-semibold text-prospera" href={`mailto:${supplier.email}`}>
                  {supplier.email}
                </a>
              </dd>
            </div>
          </dl>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="rounded-xl border border-line px-3 py-2.5"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Message
            <textarea
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={`Hi ${supplier.contactName}, I need…`}
              className="rounded-xl border border-line px-3 py-2.5 font-medium"
              required
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit">Send in Prospera</AppButton>
            <AppButton
              as="a"
              variant="outline"
              href={`https://wa.me/${supplier.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </AppButton>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default ContactSupplierModal
