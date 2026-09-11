import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Icon from '../components/icons'
import './AIChat.css'

function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Hi, I am your Prospera AI Coach. I can help you with:\n\n\u2022 Business ideas and planning\n\u2022 Grant applications\n\u2022 Financial advice\n\u2022 Supplier negotiations\n\u2022 Starting your first business\n\nWhat would you like to talk about?',
    },
  ])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'That is a great question. The AI engine will respond here — your API member can wire this to OpenAI or Gemini through the /api/ai/chat endpoint.',
        },
      ])
    }, 900)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser. Use Chrome.')
      return
    }
    const recognition = new window.webkitSpeechRecognition()
    recognition.lang = 'en-US'
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript)
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    setIsListening(true)
    recognition.start()
  }

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
              <h1>AI Business Coach</h1>
              <p className="ai-header-status">
                <span className="status-dot" />
                Online · text and voice
              </p>
            </div>
          </div>

          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
                {m.text.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < m.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-input-bar">
            <button
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={startVoice}
              type="button"
              aria-label="Voice input"
            >
              <Icon name="mic" size={19} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your business, a new idea, grants..."
              rows={1}
            />
            <button className="send-btn" onClick={sendMessage} type="button">
              Send
              <Icon name="send" size={15} />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AIChat