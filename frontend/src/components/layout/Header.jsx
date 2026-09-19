import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const PAGE_META = {
  '/': { title: 'Dashboard', subtitle: 'Analytics & KPI Overview' },
  '/products': { title: 'Products', subtitle: 'Manage your product catalog' },
  '/categories': { title: 'Categories', subtitle: 'Organize product categories' },
  '/orders': { title: 'Orders', subtitle: 'Track and manage customer orders' },
  '/stock-movements': { title: 'Stock Movements', subtitle: 'Inventory audit trail' },
  '/users': { title: 'Users', subtitle: 'Manage team members & roles' },
  '/analytics': { title: 'Analytics', subtitle: 'Real-time sales & inventory metrics' },
  '/profile': { title: 'My Profile', subtitle: 'View and update your account' },
}

export default function Header({ collapsed, onMenuClick }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const meta = PAGE_META[pathname] || { title: 'EnterpriseHub', subtitle: '' }

  const productMatch = pathname.startsWith('/products/') && pathname !== '/products'
  const title = productMatch ? 'Product Detail' : meta.title
  const subtitle = productMatch ? 'Detailed product information' : meta.subtitle

  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <button className="btn btn-icon btn-secondary" onClick={onMenuClick} style={{ display: 'none' }} id="mobile-menu-btn">
          <Menu size={20} />
        </button>
        <div>
          <div className="page-title">{title}</div>
          {subtitle && <div className="page-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="header-right">
        <div className="header-user">
          <div className="user-avatar">
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
