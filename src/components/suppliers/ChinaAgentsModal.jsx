import { useState } from 'react'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'
import { CHINA_AGENTS } from '../../data/suppliers'

export function ChinaAgentsModal({ open, onClose }) {
  const [agentId, setAgentId] = useState('')
  const agent = CHINA_AGENTS.find((item) => item.id === agentId)

  const close = () => {
    setAgentId('')
    onClose?.()
  }

  return (
    <Modal
      open={open}
      title={agent ? agent.name : 'China supplier access'}
      onClose={close}
      wide
    >
      {!agent ? (
        <div className="grid gap-3">
          <p className="m-0 text-sm text-muted">
            These liaison desks help Ghanaian sellers source and ship at group rates. Open a desk for
            contact details and lead times.
          </p>
          {CHINA_AGENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAgentId(item.id)}
              className="rounded-2xl border border-line bg-canvas px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-prospera"
            >
              <strong className="block text-ink-strong">{item.name}</strong>
              <span className="text-sm text-muted">
                {item.city} · {item.focus}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Base</dt>
              <dd className="m-0 font-semibold">{agent.city}</dd>
            </div>
            <div>
              <dt className="text-muted">Lead time</dt>
              <dd className="m-0 font-semibold">{agent.leadTime}</dd>
            </div>
            <div>
              <dt className="text-muted">Typical MOQ</dt>
              <dd className="m-0 font-semibold">{agent.moq}</dd>
            </div>
            <div>
              <dt className="text-muted">Focus</dt>
              <dd className="m-0 font-semibold">{agent.focus}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <AppButton as="a" href={`tel:${agent.phone}`}>
              Call {agent.phone}
            </AppButton>
            <AppButton as="a" variant="outline" href={`mailto:${agent.email}`}>
              Email
            </AppButton>
            <AppButton variant="ghost" onClick={() => setAgentId('')}>
              Back to desks
            </AppButton>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ChinaAgentsModal
