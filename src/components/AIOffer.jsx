import Icon from './icons'
import { useChat } from '../context/ChatContext'
import './AIOffer.css'

function AIOffer({ title, text, points = [], cta = 'Chat with AI Coach' }) {
  const { open } = useChat()

  return (
    <section className="ai-offer">
      <span className="ai-offer-glow" aria-hidden="true" />
      <div className="ai-offer-icon">
        <Icon name="sparkles" size={24} />
      </div>
      <div className="ai-offer-body">
        <span className="ai-offer-tag">
          AI Coach
        </span>
        <h3>{title}</h3>
        <p>{text}</p>
        {points.length > 0 && (
          <ul className="ai-offer-points">
            {points.map((p) => (
              <li key={p}>
                <Icon name="check" size={13} />
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" className="ai-offer-cta" onClick={() => open()}>
        {cta}
        <Icon name="chevron" size={16} />
      </button>
    </section>
  )
}

export default AIOffer