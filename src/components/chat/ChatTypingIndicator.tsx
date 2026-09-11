/**
 * Three-dot pulse shown while waiting for Amara's first token.
 */
export function ChatTypingIndicator() {
  return (
    <div className="chat-typing" role="status" aria-live="polite" aria-label="Amara is typing">
      <span className="chat-typing-dot" />
      <span className="chat-typing-dot" />
      <span className="chat-typing-dot" />
    </div>
  )
}
