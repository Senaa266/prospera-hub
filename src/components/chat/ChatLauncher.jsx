import { useLocation } from 'react-router-dom'
import { useChat } from '../../context/ChatContext'
import { AIFloatingIcon } from './AIFloatingIcon'
import { AIChatModal } from './AIChatModal'

const HIDDEN_ROUTES = ['/', '/login', '/ai-chat']

/**
 * Global FAB + modal. Hidden on marketing, login, and the dedicated AI Coach page.
 */
export function ChatLauncher() {
  const { pathname } = useLocation()
  const { isOpen } = useChat()
  const hideLauncher = HIDDEN_ROUTES.includes(pathname)

  if (hideLauncher) return null

  return (
    <>
      {!isOpen ? <AIFloatingIcon /> : null}
      <AIChatModal />
    </>
  )
}

export default ChatLauncher
