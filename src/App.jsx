import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AIChat from './pages/AIChat'
import Grants from './pages/Grants'
import Suppliers from './pages/Suppliers'
import Savings from './pages/Savings'
import SavingsDetail from './pages/SavingsDetail'
import SavingsInvite from './pages/SavingsInvite'
import Finance from './pages/Finance'
import TrackerDetail from './pages/TrackerDetail'
import ChatLauncher from './components/chat/ChatLauncher'
import { useAuth } from './context/AuthContext'

function RequireAuth({ children }) {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <RequireAuth>
              <AIChat />
            </RequireAuth>
          }
        />
        <Route
          path="/grants"
          element={
            <RequireAuth>
              <Grants />
            </RequireAuth>
          }
        />
        <Route
          path="/savings"
          element={
            <RequireAuth>
              <Savings />
            </RequireAuth>
          }
        />
        <Route
          path="/savings/:id"
          element={
            <RequireAuth>
              <SavingsDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/invite/:token"
          element={
            <RequireAuth>
              <SavingsInvite />
            </RequireAuth>
          }
        />
        <Route
          path="/suppliers"
          element={
            <RequireAuth>
              <Suppliers />
            </RequireAuth>
          }
        />
        <Route
          path="/finance"
          element={
            <RequireAuth>
              <Finance />
            </RequireAuth>
          }
        />
        <Route
          path="/trackers/:id"
          element={
            <RequireAuth>
              <TrackerDetail />
            </RequireAuth>
          }
        />
      </Routes>
      <ChatLauncher />
    </>
  )
}

export default App