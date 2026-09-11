import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Icon from '../icons'
import type { ChatMessage as ChatMessageModel } from '../../types/chat.ts'

type ChatMessageProps = {
  message: ChatMessageModel
}

/**
 * Renders a single user or Sena bubble. Assistant turns support GFM markdown.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  /**
   * Copies the assistant reply. No-ops if the clipboard API is unavailable.
   */
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article
      className={`chat-row ${isUser ? 'chat-row-user' : 'chat-row-assistant'}`}
      aria-label={isUser ? 'Your message' : "Sena's message"}
    >
      {!isUser && (
        <div className="chat-avatar" aria-hidden="true">
          <Icon name="sparkles" size={16} />
        </div>
      )}

      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
        {isUser ? (
          <p className="chat-plain">{message.content}</p>
        ) : (
          <div className="chat-markdown">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </Markdown>
          </div>
        )}

        {!isUser && (
          <button
            type="button"
            className="chat-copy"
            onClick={() => {
              void handleCopy()
            }}
            aria-label={copied ? 'Message copied' : 'Copy message'}
          >
            <Icon name={copied ? 'check' : 'copy'} size={14} />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>
    </article>
  )
}
