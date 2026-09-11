import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTrackers } from '../../context/TrackersContext'
import { streamChatCompletion } from '../../api/chatStream.ts'
import { buildTrackerEvent } from '../../lib/extractTracker.js'
import {
  createChatMessage,
  type ChatMessage as ChatMessageModel,
  type ChatProvider,
  type UserContext,
} from '../../types/chat.ts'
import { ChatInput } from './ChatInput.tsx'
import { ChatMessage } from './ChatMessage.tsx'
import { ChatTypingIndicator } from './ChatTypingIndicator.tsx'
import './ChatBox.css'

const STORAGE_KEY = 'prospera-sena-messages'

const EXAMPLE_PROMPTS = [
  'Help me price my tailoring business',
  'Turn my bead jewelry idea into a 90-day plan',
  'What do my sales and expenses say about cash flow?',
] as const

type ChatBoxProps = {
  initialPrompt?: string
}

/**
 * Reads persisted session messages, ignoring malformed storage.
 */
function loadSessionMessages(): ChatMessageModel[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is ChatMessageModel => {
      if (!item || typeof item !== 'object') return false
      const row = item as Record<string, unknown>
      return (
        typeof row.id === 'string' &&
        (row.role === 'user' || row.role === 'assistant') &&
        typeof row.content === 'string' &&
        typeof row.createdAt === 'string'
      )
    })
  } catch {
    return []
  }
}

type AuthUser = {
  name?: string
  businessType?: string
  country?: string
  businessName?: string
}

/**
 * Main Sena chat container: history, streaming, empty/error states, and composer.
 */
export function ChatBox({ initialPrompt = '' }: ChatBoxProps) {
  const { user, token } = useAuth() as { user: AuthUser | null; token: string | null }
  const { addTracker } = useTrackers()
  const [messages, setMessages] = useState<ChatMessageModel[]>(loadSessionMessages)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [createdTracker, setCreatedTracker] = useState<{ id: string; title: string } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const sendTextRef = useRef<(text: string, history: ChatMessageModel[]) => Promise<void>>(
    async () => undefined,
  )

  const userContext = useMemo<UserContext>(() => {
    const context: UserContext = {}
    if (user?.name) context.name = user.name
    if (user?.country) context.country = user.country
    if (user?.businessName || user?.businessType) {
      context.businessName = user.businessName || user.businessType
    }
    return context
  }, [user])

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    const node = listRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const sendText = useCallback(
    async (text: string, history: ChatMessageModel[]) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      let timedOut = false
      const timeoutId = window.setTimeout(() => {
        timedOut = true
        controller.abort()
      }, 45_000)

      const userMessage = createChatMessage('user', trimmed)
      const assistantMessage = createChatMessage('assistant', '')
      const nextHistory = [...history, userMessage]

      setDraft('')
      setError(null)
      setNotice(null)
      setCreatedTracker(null)
      setLoading(true)
      setMessages([...nextHistory, assistantMessage])

      let streamed = ''
      let savedTracker = false
      try {
        await streamChatCompletion(
          {
            messages: nextHistory.map(({ role, content }) => ({ role, content })),
            userContext: Object.keys(userContext).length ? userContext : undefined,
          },
          {
            token: token || 'demo-token',
            signal: controller.signal,
            onProvider: (provider: ChatProvider) => {
              if (provider === 'local') {
                setNotice(
                  'Live Gemini is not connected yet. Sena is answering from your words on the server. Add GEMINI_API_KEY to server/.env for the full model.',
                )
              }
            },
            onTracker: (payload) => {
              const tracker = addTracker(payload)
              if (tracker) {
                savedTracker = true
                setCreatedTracker({ id: tracker.id, title: tracker.title })
              }
            },
            onDelta: (delta) => {
              streamed += delta
              setMessages((current) =>
                current.map((item) =>
                  item.id === assistantMessage.id
                    ? { ...item, content: item.content + delta }
                    : item,
                ),
              )
            },
          },
        )
        if (!savedTracker) {
          const fallback = buildTrackerEvent(trimmed, streamed)
          if (fallback) {
            const tracker = addTracker(fallback)
            if (tracker) setCreatedTracker({ id: tracker.id, title: tracker.title })
          }
        }
      } catch (caught) {
        if (controller.signal.aborted && !timedOut) return
        const message = timedOut
          ? 'Sena timed out. Please try again.'
          : caught instanceof Error
            ? caught.message
            : 'Sena is unavailable right now. Please try again.'
        setError(message)
        setMessages((current) => current.filter((item) => item.id !== assistantMessage.id))
      } finally {
        window.clearTimeout(timeoutId)
        if (!controller.signal.aborted || timedOut) setLoading(false)
      }
    },
    [loading, token, userContext, addTracker],
  )

  sendTextRef.current = sendText

  useEffect(() => {
    const prompt = initialPrompt.trim()
    if (!prompt) return

    const timer = window.setTimeout(() => {
      const history = loadSessionMessages()
      const alreadyDone = history.some((item, index) => {
        const next = history[index + 1]
        return (
          item.role === 'user' &&
          item.content === prompt &&
          next?.role === 'assistant' &&
          Boolean(next.content)
        )
      })
      if (alreadyDone) return

      const cleaned = history.filter((item, index, list) => {
        const next = list[index + 1]
        const prev = list[index - 1]
        if (item.role === 'assistant' && !item.content) return false
        if (
          item.role === 'user' &&
          item.content === prompt &&
          next?.role === 'assistant' &&
          !next.content
        ) {
          return false
        }
        if (
          item.role === 'user' &&
          item.content === prompt &&
          prev?.role === 'user' &&
          prev.content === prompt
        ) {
          return false
        }
        return true
      })

      void sendTextRef.current(prompt, cleaned)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [initialPrompt])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const lastAssistant = messages.at(-1)
  const showTyping = loading && lastAssistant?.role === 'assistant' && !lastAssistant.content

  /**
   * Retries the last user turn after a failed stream.
   */
  function handleRetry() {
    const lastUser = [...messages].reverse().find((item) => item.role === 'user')
    if (!lastUser) return
    const history = messages.filter((item) => item.id !== lastUser.id)
    void sendText(lastUser.content, history)
  }

  return (
    <section className="chat-box" aria-label="Chat with Sena">
      <div
        ref={listRef}
        className="chat-list"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={loading}
      >
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            <p>Ask Sena about strategy, pricing, or your next 90 days.</p>
            <ul className="chat-examples">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    className="chat-example-btn"
                    onClick={() => {
                      void sendText(prompt, messages)
                    }}
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((message) =>
          message.role === 'assistant' && !message.content && loading ? null : (
            <ChatMessage key={message.id} message={message} />
          ),
        )}

        {showTyping && (
          <div className="chat-row chat-row-assistant">
            <div className="chat-avatar" aria-hidden="true">
              <span className="chat-avatar-dot" />
            </div>
            <ChatTypingIndicator />
          </div>
        )}
      </div>

      {error && (
        <div className="chat-error" role="alert">
          <p>{error}</p>
          <button type="button" className="chat-retry-btn" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {notice && !error && (
        <div className="chat-notice" role="status">
          <p>{notice}</p>
        </div>
      )}

      {createdTracker && !error && (
        <div className="chat-tracker-banner" role="status">
          <p>
            Sena saved <strong>{createdTracker.title}</strong> as a live tracker.
          </p>
          <Link to={`/trackers/${createdTracker.id}`}>Open tracker</Link>
        </div>
      )}

      <ChatInput
        value={draft}
        loading={loading}
        onChange={setDraft}
        onSend={() => {
          void sendText(draft, messages)
        }}
      />
    </section>
  )
}

export default ChatBox
