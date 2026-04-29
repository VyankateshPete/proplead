import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/leads', label: 'Leads' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/reports', label: 'Reports' },
  { to: '/smart-lab', label: 'Smart Lab' },
  { to: '/settings', label: 'Settings' },
]

export const Layout = () => (
  <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-title">PropLead</div>
        <p className="brand-subtitle">Smarter Leads, Smarter Insurance</p>
      </div>
      <p className="sidebar-section-label">Navigation</p>
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
      <div className="sidebar-user-card">
        <p className="sidebar-user-name">Alyson Team</p>
        <p className="sidebar-user-meta">Revenue Ops Workspace</p>
      </div>
    </aside>
    <main className="layout-main">
      <Outlet />
    </main>
  </div>
)
