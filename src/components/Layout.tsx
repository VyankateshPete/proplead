import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/leads', label: 'Leads' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/settings', label: 'Settings' },
]

export const Layout = () => (
  <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-title">PropLead</div>
        <p className="brand-subtitle">Smarter Leads, Smarter Insurance</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link-active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
    <main className="layout-main">
      <Outlet />
    </main>
  </div>
)
