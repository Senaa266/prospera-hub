import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ChatContext = createContext(null)

/**
 * Holds Sena's open/closed state above the router so page changes keep the modal open.
 */
export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialPrompt, setInitialPrompt] = useState('')
  const [promptNonce, setPromptNonce] = useState(0)

  const open = useCallback((prompt = '') => {
    const next = typeof prompt === 'string' ? prompt.trim() : ''
    setInitialPrompt(next)
    if (next) setPromptNonce((value) => value + 1)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setInitialPrompt('')
  }, [])

  const clearInitialPrompt = useCallback(() => {
    setInitialPrompt('')
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((current) => {
      if (current) setInitialPrompt('')
      return !current
    })
  }, [])

  const value = useMemo(
    () => ({ isOpen, initialPrompt, promptNonce, open, close, clearInitialPrompt, toggle }),
    [isOpen, initialPrompt, promptNonce, open, close, clearInitialPrompt, toggle],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

/**
 * Access Sena's modal controls.
 */
export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}
