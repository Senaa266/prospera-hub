import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AIChat from './pages/AIChat'
import Grants from './pages/Grants'
import Savings from './pages/Savings'
import SavingsDetail from './pages/SavingsDetail'
import Suppliers from './pages/Suppliers'
import Finance from './pages/Finance'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/ai-chat" element={<AIChat />} />
      <Route path="/grants" element={<Grants />} />
      <Route path="/savings" element={<Savings />} />
      <Route path="/savings/:id" element={<SavingsDetail />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/finance" element={<Finance />} />
    </Routes>
  )
}

export default App