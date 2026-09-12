import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { TrackersProvider } from './context/TrackersContext'
import { SusuSecurityProvider } from './context/SusuSecurityContext'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PreferencesProvider>
            <TrackersProvider>
              <SusuSecurityProvider>
                <ChatProvider>
                  <App />
                </ChatProvider>
              </SusuSecurityProvider>
            </TrackersProvider>
          </PreferencesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)