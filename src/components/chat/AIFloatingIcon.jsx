import Icon from '../icons'
import { useChat } from '../../context/ChatContext'
import './AIChatOverlay.css'

/**
 * Fixed bottom-right FAB that opens Sena on every main app page.
 */
export function AIFloatingIcon() {
  const { isOpen, toggle } = useChat()

  return (
    <button
      type="button"
      className="sena-fab"
      onClick={toggle}
      aria-label={isOpen ? 'Close chat with Sena' : 'Open chat with Sena'}
      aria-expanded={isOpen}
      aria-controls="sena-chat-dialog"
      aria-haspopup="dialog"
    >
      <span className="sena-fab-pulse" aria-hidden="true" />
      <span className="sena-fab-icon">
        <Icon name="sparkles" size={24} />
      </span>
    </button>
  )
}

export default AIFloatingIcon
