import { NavLink, useNavigate } from 'react-router-dom'
import './Sidebar.css'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▣' },
  { to: '/matters',   label: 'Matters',   icon: '📄' },
  { to: '/archive',   label: 'Archive',   icon: '🗄' },
]

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sb-brand">
        <span className="sb-logo">⚖</span>
        <div>
          <div className="sb-title">Ciki</div>
          <div className="sb-sub">LEGAL COST MANAGEMENT</div>
        </div>
      </div>

      {/* Firm badge */}
      <div className="sb-firm">
        <div className="sb-firm-icon">✦</div>
        <div>
          <div className="sb-firm-name">Legal Practice</div>
          <div className="sb-firm-tier">ENTERPRISE TIER</div>
        </div>
      </div>

      {/* New bill CTA */}
      <button className="sb-new-btn" onClick={() => navigate('/matters/new')}>
        <span>＋</span> New Bill of Costs
      </button>

      {/* Nav */}
      <nav className="sb-nav">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sb-nav-item${isActive ? ' active' : ''}`
            }
          >
            <span className="sb-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <button className="sb-support">? Support</button>
        <div className="sb-user-row">
          <div className="sb-avatar">{user ? user[0].toUpperCase() : 'U'}</div>
          <span className="sb-username">{user}</span>
          <button className="sb-logout" onClick={onLogout} title="Sign out">⏻</button>
        </div>
        <div className="sb-copy">© 2025 Ciki<br />Legal Management</div>
      </div>
    </aside>
  )
}
