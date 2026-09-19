import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/helpers'
import { Boxes, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Alert } from '../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email, password) => setForm({ email, password })

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <Boxes size={32} color="white" />
          </div>
          <h1>EnterpriseHub</h1>
          <p>B2B Inventory & Order Management</p>
        </div>

        <Alert type="error" message={error} />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <Mail size={16} className="input-icon" />
              <input
                className="form-control"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div style={{ marginTop: 28, padding: 16, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Demo Credentials
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {[
              { label: 'Admin', email: 'admin@enterprisehub.com', pass: 'admin123', color: '#a78bfa' },
              { label: 'Manager', email: 'manager@enterprisehub.com', pass: 'manager123', color: '#60a5fa' },
              { label: 'Staff', email: 'staff@enterprisehub.com', pass: 'staff123', color: '#fbbf24' },
              { label: 'Client', email: 'client@acmecorp.com', pass: 'client123', color: '#9ca3af' },
            ].map(d => (
              <button
                key={d.label}
                onClick={() => fillDemo(d.email, d.pass)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: `${d.color}20`, color: d.color, border: `1px solid ${d.color}40`, textTransform: 'uppercase' }}>{d.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{d.email}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{d.pass}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
