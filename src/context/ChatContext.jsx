import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ChatContext = createContext(null)

/**
 * Holds Sena's open/closed state above the router so page changes keep the modal open.
 */
export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [initialPrompt, setInitialPrompt] = useState('')
  const [activeGrant, setActiveGrant] = useState(null)

  const open = useCallback((prompt = '', grant = null) => {
    if (typeof prompt === 'string' && prompt.trim()) {
      setInitialPrompt(prompt.trim())
    }
    if (grant) {
      setActiveGrant(grant)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((current) => !current)
  }, [])

  const clearGrant = useCallback(() => {
    setActiveGrant(null)
  }, [])

  const value = useMemo(
    () => ({ isOpen, initialPrompt, activeGrant, open, close, toggle, clearGrant }),
    [isOpen, initialPrompt, activeGrant, open, close, toggle, clearGrant],
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
