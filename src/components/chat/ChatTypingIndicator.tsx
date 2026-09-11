/**
 * Three-dot pulse shown while waiting for Sena's first token.
 */
export function ChatTypingIndicator() {
  return (
    <div className="chat-typing" role="status" aria-live="polite" aria-label="Sena is typing">
      <span className="chat-typing-dot" />
      <span className="chat-typing-dot" />
      <span className="chat-typing-dot" />
    </div>
  )
}
