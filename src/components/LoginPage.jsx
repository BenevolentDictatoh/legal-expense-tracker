import { useState } from 'react'
import './LoginPage.css'

// Hardcoded for prototype — replace with real auth before production
const USERS = [
  { username: 'userx', password: 'qwerty1234' },
]

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate a brief async check
    setTimeout(() => {
      const match = USERS.find(
        u => u.username === username && u.password === password
      )
      if (match) {
        onLogin(username)
      } else {
        setError('Invalid username or password.')
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">⚖</span>
          <div className="login-brand-text">
            <div className="login-title">Mari</div>
            <div className="login-sub">Legal Cost Management, Botswana</div>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h2 className="login-heading">Sign in</h2>

          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading || !username || !password}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-footer">
          Demo prototype - no data is sent to any server.
        </div>
      </div>
    </div>
  )
}
