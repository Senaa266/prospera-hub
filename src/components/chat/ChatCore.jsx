import Icon from '../icons'
import ChatBox from './ChatBox'
import '../../pages/AIChat.css'

/**
 * Shared Sena UI used by the dedicated /ai-chat page and the global pop-up.
 */
export function ChatCore({
  initialPrompt = '',
  promptNonce = 0,
  onClose,
  titleId = 'sena-title',
  closeRef,
  variant = 'page',
}) {
  const isModal = variant === 'modal'

  return (
    <div className={`ai-container${isModal ? ' ai-container-modal' : ''}`}>
      <header className="ai-header">
        <div className="ai-header-icon" aria-hidden="true">
          <Icon name="sparkles" size={22} />
        </div>
        <div className="ai-header-text">
          <h1 id={titleId}>Sena · AI Business Coach</h1>
          <p className="ai-header-status">
            <span className="status-dot" />
            Online · text and voice
          </p>
        </div>
        {isModal && onClose ? (
          <button
            ref={closeRef}
            type="button"
            className="ai-header-close"
            onClick={onClose}
            aria-label="Close chat"
          >
            <Icon name="x" size={18} />
          </button>
        ) : null}
      </header>
      <ChatBox initialPrompt={initialPrompt} promptNonce={promptNonce} />
    </div>
  )
}

export default ChatCore
