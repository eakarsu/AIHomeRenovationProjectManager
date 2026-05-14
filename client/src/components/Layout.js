import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/projects', label: 'Projects', icon: '🏗️' },
  { path: '/contractors', label: 'Contractors', icon: '👷' },
  { path: '/permits', label: 'Permits', icon: '📋' },
  { path: '/budget', label: 'Budget', icon: '💰' },
  { path: '/change-orders', label: 'Change Orders', icon: '📝' },
  { path: '/designs', label: 'Designs', icon: '🎨' },
  { path: '/timeline', label: 'Timeline', icon: '📅' },
  { path: '/materials', label: 'Materials', icon: '🧱' },
  { path: '/inspections', label: 'Inspections', icon: '🔍' },
  { path: '/rooms', label: 'Rooms', icon: '🏠' },
  { path: '/vendors', label: 'Vendors', icon: '🏪' },
  { path: '/documents', label: 'Documents', icon: '📁' },
  { path: '/punchlist', label: 'Punch List', icon: '✅' },
  { path: '/communications', label: 'Communications', icon: '💬' },
  { path: '/warranties', label: 'Warranties', icon: '🛡️' },
  { path: '/daily-log', label: 'Daily Log', icon: '📓' },
  { path: '/photos', label: 'Photos', icon: '📸' },
  { path: '/payments', label: 'Payments', icon: '💳' },
  { path: '/reports', label: 'Reports', icon: '📈' },
  { path: '/advanced-ai', label: 'Advanced AI', icon: '🤖' },
];

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="icon">🏠</span>
          <div>
            <h2>RenovateAI</h2>
            <span>Project Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
