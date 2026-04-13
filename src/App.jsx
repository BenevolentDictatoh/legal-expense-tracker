import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import LoginPage from './components/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MattersListPage from './pages/MattersListPage'
import MatterDetailPage from './pages/MatterDetailPage'
import LineItemsPage from './pages/LineItemsPage'
import ArchivePage from './pages/ArchivePage'
import './App.css'

export default function App() {
  const [user, setUser] = useState(() => sessionStorage.getItem('boc_user') || null)

  const handleLogin = (username) => {
    sessionStorage.setItem('boc_user', username)
    setUser(username)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('boc_user')
    setUser(null)
  }

  if (!user) return <LoginPage onLogin={handleLogin} />

  return (
    <BrowserRouter>
      <div className="shell">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="main-area">
          <TopBar user={user} />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/matters" element={<MattersListPage />} />
            <Route path="/matters/new" element={<MatterDetailPage />} />
            <Route path="/matters/:id" element={<MatterDetailPage />} />
            <Route path="/matters/:id/items" element={<LineItemsPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
