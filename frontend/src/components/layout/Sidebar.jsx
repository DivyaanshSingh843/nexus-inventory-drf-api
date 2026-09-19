import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, BarChart2,
  Users, Tag, ArrowUpDown, User, LogOut, ChevronLeft, ChevronRight, Boxes
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navSections = [
  {
    label: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', managerOnly: true },
      { to: '/products', icon: Package, label: 'Products' },
      { to: '/categories', icon: Tag, label: 'Categories' },
      { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    ]
  },
  {
    label: 'Management',
    items: [
      { to: '/stock-movements', icon: ArrowUpDown, label: 'Stock Movements', staffOnly: true },
      { to: '/users', icon: Users, label: 'Users', managerOnly: true },
      { to: '/analytics', icon: BarChart2, label: 'Analytics', managerOnly: true },
    ]
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', icon: User, label: 'My Profile' },
    ]
  }
]

export default function Sidebar({ collapsed, onToggle, mobileOpen }) {
  const { user, logout, isManager, isStaff } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const canSee = (item) => {
    if (item.managerOnly && !isManager) return false
    if (item.staffOnly && !isStaff) return false
    return true
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Boxes size={20} color="white" />
        </div>
        {!collapsed && <span className="brand-text">EnterpriseHub</span>}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navSections.map(section => {
          const visible = section.items.filter(canSee)
          if (!visible.length) return null
          return (
            <div key={section.label} style={{ marginBottom: 8 }}>
              <div className="nav-section-label">{section.label}</div>
              {visible.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={20} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  {collapsed && <span className="nav-item-tooltip">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 8, borderRadius: 8, background: 'var(--bg-tertiary)' }}>
            <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
              {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.first_name || user?.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="btn btn-icon btn-secondary btn-sm" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  )
}
