import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/auth'
import { Alert, Badge, Spinner } from '../components/ui'
import { getErrorMessage } from '../utils/helpers'
import { User, Building, Phone, MapPin, Save } from 'lucide-react'

export default function Profile() {
  const { user, fetchProfile } = useAuth()
  const [form, setForm] = useState({ first_name: '', last_name: '', company_name: '', phone_number: '', address: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name || '', last_name: user.last_name || '', company_name: user.company_name || '', phone_number: user.phone_number || '', address: user.address || '' })
  }, [user])

  if (!user) return <Spinner />

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      await updateProfile({ ...form, username: user.email, email: user.email })
      await fetchProfile()
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const initials = user.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: 24, padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white', flexShrink: 0, boxShadow: 'var(--shadow-glow)' }}>
            {initials}
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              {user.first_name ? `${user.first_name} ${user.last_name}` : user.email}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 10 }}>{user.email}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge value={user.role} label={user.role} />
              {user.company_name && (
                <span className="tag"><Building size={11} />{user.company_name}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Edit Profile</div>
            <div className="card-subtitle">Update your personal information</div>
          </div>
        </div>

        {error && <Alert message={error} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><User size={13} style={{ display: 'inline', marginRight: 4 }} />First Name</label>
              <input className="form-control" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="First name" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-control" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Last name" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" value={user.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <div className="form-hint">Email cannot be changed here.</div>
          </div>

          <div className="form-group">
            <label className="form-label"><Building size={13} style={{ display: 'inline', marginRight: 4 }} />Company Name</label>
            <input className="form-control" value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Your company name" />
          </div>

          <div className="form-group">
            <label className="form-label"><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Phone Number</label>
            <input className="form-control" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+91 98765 43210" />
          </div>

          <div className="form-group">
            <label className="form-label"><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Address</label>
            <textarea className="form-control" value={form.address} onChange={e => set('address', e.target.value)} rows={3} placeholder="Your full address..." />
          </div>

          {/* Role Info */}
          <div style={{ padding: 16, background: 'var(--bg-tertiary)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Account Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Role</div>
                <Badge value={user.role} label={user.role} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Username</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.username}</div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
