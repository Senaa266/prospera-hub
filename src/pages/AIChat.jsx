import { useSearchParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Icon from '../components/icons'
import ChatBox from '../components/chat/ChatBox'
import './AIChat.css'

function AIChat() {
  const [params] = useSearchParams()
  const initialPrompt = params.get('prompt') || ''

  return (
    <div className="ai-page">
      <Sidebar />
      <main className="ai-main">
        <div className="ai-container">
          <div className="ai-header">
            <div className="ai-header-icon">
              <Icon name="sparkles" size={22} />
            </div>
            <div className="ai-header-text">
              <h1>Amara · AI Business Coach</h1>
              <p className="ai-header-status">
                <span className="status-dot" />
                Online · text and voice
              </p>
            </div>
          </div>
          <ChatBox initialPrompt={initialPrompt} />
        </div>
      </main>
    </div>
  )
}

export default AIChat
