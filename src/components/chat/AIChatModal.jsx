import { useEffect, useId, useRef } from 'react'
import ChatCore from './ChatCore'
import { useChat } from '../../context/ChatContext'
import './AIChatOverlay.css'

/**
 * Animated overlay that hosts Sena without leaving the current page.
 */
export function AIChatModal() {
  const { isOpen, close, initialPrompt } = useChat()
  const titleId = useId()
  const closeRef = useRef(null)
  const panelRef = useRef(null)
  const lastFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = window.setTimeout(() => {
      closeRef.current?.focus()
    }, 40)

    /**
     * Closes on Escape and keeps Tab inside the dialog.
     */
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [
        ...panelRef.current.querySelectorAll(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((node) => node instanceof HTMLElement)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      lastFocusRef.current?.focus()
    }
  }, [isOpen, close])

  return (
    <div
      className={`sena-overlay${isOpen ? ' is-open' : ''}`}
      inert={!isOpen ? true : undefined}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div
        ref={panelRef}
        id="sena-chat-dialog"
        className="sena-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
      >
        <ChatCore
          variant="modal"
          titleId={titleId}
          initialPrompt={initialPrompt}
          onClose={close}
          closeRef={closeRef}
        />
      </div>
    </div>
  )
}

export default AIChatModal
