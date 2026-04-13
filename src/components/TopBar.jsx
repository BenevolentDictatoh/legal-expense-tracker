import './TopBar.css'

export default function TopBar({ user }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo">⚖</span>
        <span className="topbar-title">Bill of Costs</span>
      </div>

      <div className="topbar-actions">
        <div className="topbar-icons">
          <button className="icon-btn" title="Notifications">🔔</button>
          <button className="icon-btn avatar-btn" title="Account">
            {user ? user[0].toUpperCase() : '👤'}
          </button>
        </div>
      </div>
    </header>
  )
}
