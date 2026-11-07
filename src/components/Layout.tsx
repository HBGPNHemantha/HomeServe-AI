import React from 'react';
import {
  LayoutDashboard, Phone, Users, Calendar,
  MessageSquare, Settings, Zap, LogOut, Bell, Search
} from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';

export type PageId = 'dashboard' | 'calls' | 'leads' | 'calendar' | 'sms' | 'settings';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string; badgeType?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'calls',     label: 'Call Logs',  icon: <Phone size={16} />,         badge: '2', badgeType: '' },
  { id: 'leads',     label: 'Leads',      icon: <Users size={16} />,         badge: '6', badgeType: 'info' },
  { id: 'calendar',  label: 'Calendar',   icon: <Calendar size={16} />,      badge: '4', badgeType: 'warn' },
  { id: 'sms',       label: 'SMS Workflows', icon: <MessageSquare size={16} /> },
  { id: 'settings',  label: 'Settings',   icon: <Settings size={16} /> },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { user, logout } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'JR';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Zap size={18} color="white" />
        </div>
        <div className="brand-text">
          <span className="brand-name">HomeServe AI</span>
          <span className="brand-badge">Receptionist</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Main</span>
        {navItems.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span className={`nav-badge ${item.badgeType || ''}`}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom User */}
      <div className="sidebar-bottom">
        <div className="sidebar-user" title="Click to Sign Out" onClick={logout} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.fullName || 'Jake Russo'}</div>
            <div className="user-role">{user?.role === 'owner' ? 'Business Owner' : user?.role || 'Staff'}</div>
          </div>
          <LogOut size={14} color="var(--text-muted)" />
        </div>
      </div>
    </aside>
  );
};

interface TopBarProps {
  title: string;
  subtitle: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  const { isConnected } = useWebSocket();
  const { logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-actions">
        {isConnected ? (
          <div className="live-chip" title="Connected to Real-time Voice AI Server">
            <span className="live-dot" />
            AI Live
          </div>
        ) : (
          <div
            className="live-chip"
            style={{
              color: 'var(--accent-amber)',
              background: 'rgba(245,158,11,0.1)',
              borderColor: 'rgba(245,158,11,0.3)'
            }}
            title="Connecting to Real-time Server..."
          >
            <span
              className="live-dot"
              style={{
                background: 'var(--accent-amber)',
                boxShadow: '0 0 6px var(--accent-amber)'
              }}
            />
            Connecting...
          </div>
        )}
        <div className="icon-btn" id="btn-search" title="Search">
          <Search size={16} />
        </div>
        <div className="icon-btn" id="btn-notifications" title="Notifications">
          <Bell size={16} />
          <span className="notif-dot" />
        </div>
        <div className="icon-btn" id="btn-logout" title="Sign Out" onClick={logout} style={{ cursor: 'pointer' }}>
          <LogOut size={16} />
        </div>
      </div>
    </header>
  );
};

export default Sidebar;
