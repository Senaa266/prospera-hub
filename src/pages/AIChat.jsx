import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import ChatCore from '../components/chat/ChatCore'
import './AIChat.css'

/**
 * Dedicated full-screen AI Coach page for longer coaching sessions.
 */
function AIChat() {
  const [params] = useSearchParams()
  const initialPrompt = params.get('prompt') || ''

  return (
    <div className="ai-page">
      <Sidebar />
      <main className="ai-main">
        <ChatCore variant="page" initialPrompt={initialPrompt} />
      </main>
    </div>
  )
}

export default AIChat
