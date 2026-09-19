import { useEffect, useState, useCallback } from 'react'
import { getUsers } from '../api/auth'
import { Spinner, Badge, Alert, EmptyState, Pagination } from '../components/ui'
import { formatDate, getErrorMessage } from '../utils/helpers'
import { Search, Users } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUsers({ page, search, role: roleFilter || undefined })
      setUsers(res.data.results || res.data)
      setCount(res.data.count || 0)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => { load() }, [load])

  const ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'CLIENT']

  return (
    <div>
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input className="form-control" placeholder="Search users by email, name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="form-control" style={{ width: 160 }} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="page-toolbar-right">
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{count} user{count !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && <Alert message={error} />}

      {/* Role Distribution */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {ROLES.map(r => (
          <button key={r} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setRoleFilter(roleFilter === r ? '' : r); setPage(1) }}>
            <Badge value={r} label={r} />
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="No users match your current filters." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>User</th><th>Email</th><th>Role</th><th>Company</th><th>Phone</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
                          {u.first_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="td-primary">{u.first_name ? `${u.first_name} ${u.last_name}` : '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</td>
                    <td><Badge value={u.role} label={u.role} /></td>
                    <td style={{ fontSize: 13 }}>{u.company_name || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.phone_number || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} count={count} onPageChange={setPage} />
    </div>
  )
}
