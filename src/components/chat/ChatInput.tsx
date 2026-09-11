import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import Icon from '../icons'

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

type SpeechRecognitionLike = {
  lang: string
  onresult: ((event: { results: Array<Array<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  start: () => void
}

type ChatInputProps = {
  value: string
  loading: boolean
  onChange: (value: string) => void
  onSend: () => void
}

/**
 * Auto-resizing composer. Enter sends; Shift+Enter inserts a newline.
 */
export function ChatInput({ value, loading, onChange, onSend }: ChatInputProps) {
  const fieldId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  /**
   * Sends on Enter unless Shift is held for a multiline draft.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!loading && value.trim()) onSend()
    }
  }

  /**
   * Optional browser speech-to-text. Falls back to a polite alert if unsupported.
   */
  function startVoice() {
    const speechWindow = window as SpeechWindow
    const Ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Ctor) {
      window.alert('Voice recognition is not supported in this browser. Try Chrome.')
      return
    }

    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) onChange(transcript)
      setListening(false)
    }
    recognition.onend = () => {
      setListening(false)
    }
    setListening(true)
    recognition.start()
  }

  const canSend = Boolean(value.trim()) && !loading

  return (
    <form
      className="chat-input-bar"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSend) onSend()
      }}
    >
      <button
        type="button"
        className={`chat-voice-btn${listening ? ' listening' : ''}`}
        aria-pressed={listening}
        onClick={startVoice}
        disabled={loading}
        aria-label="Voice input"
      >
        <Icon name="mic" size={18} />
      </button>

      <label className="sr-only" htmlFor={fieldId}>
        Message Sena
      </label>
      <textarea
        ref={textareaRef}
        id={fieldId}
        value={value}
        disabled={loading}
        rows={1}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about pricing, a new idea, grants..."
      />

      <button type="submit" className="chat-send-btn" disabled={!canSend} aria-label="Send message">
        Send
        <Icon name="send" size={15} />
      </button>
    </form>
  )
}
