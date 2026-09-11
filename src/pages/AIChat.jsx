import { useState, useRef, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import './AIChat.css'

function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hi! I'm your Prospera AI Coach. I can help you with:\n\n• Business ideas and planning\n• Grant applications\n• Financial advice\n• Supplier negotiations\n• Starting your first business\n\nWhat would you like to talk about?",
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
          text: "I understand you're asking about that. This is where the AI integration will respond. For now, we're connecting the chatbot to our AI engine. Your backend team can wire this to OpenAI or Gemini via the /api/ai/chat endpoint.",
        },
      ])
    }, 1000)
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
      <Navbar />
      <main className="ai-main">
        <div className="ai-container">
          <div className="ai-header">
            <span className="ai-icon">🤖</span>
            <div>
              <h1>AI Business Coach</h1>
              <p className="ai-status">Online · text and voice</p>
            </div>
          </div>

          <div className="ai-messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`ai-bubble ${m.role === 'user' ? 'user' : 'ai'}`}
              >
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
              title="Voice input"
            >
              🎤
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
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AIChat