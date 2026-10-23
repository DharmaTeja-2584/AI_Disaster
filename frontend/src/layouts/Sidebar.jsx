import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, MapPin, Bell, User,
  Activity, AlertTriangle, Users, Package, Home,
  BarChart3, Settings, ClipboardList, ShieldAlert,
  Truck, BookOpen, Radio, Layers, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation config per role
// ─────────────────────────────────────────────────────────────────────────────

const CIVILIAN_NAV = [
  { label: 'Dashboard',        to: '/civilian/dashboard',    icon: LayoutDashboard },
  { label: 'Submit Report',    to: '/civilian/submit',       icon: FileText },
  { label: 'My Reports',       to: '/civilian/my-reports',   icon: ClipboardList },
  { label: 'Nearby Shelters',  to: '/civilian/shelters',     icon: Home },
  { label: 'Alerts',           to: '/civilian/alerts',       icon: Bell },
];

const RESPONDER_NAV = [
  { label: 'Dashboard',        to: '/responder/dashboard',   icon: LayoutDashboard },
  { label: 'My Incidents',     to: '/responder/incidents',   icon: AlertTriangle },
  { label: 'Damage Reports',   to: '/responder/damage',      icon: FileText },
  { label: 'Alerts',           to: '/responder/alerts',      icon: Bell },
];

const COMMANDER_NAV = [
  { section: 'Operations' },
  { label: 'Command Center',   to: '/commander/command-center', icon: Radio },
  { label: 'Incidents',        to: '/commander/incidents',      icon: AlertTriangle },
  { section: 'Resources' },
  { label: 'Response Teams',   to: '/commander/teams',          icon: Users },
  { label: 'Resources',        to: '/commander/resources',      icon: Package },
  { label: 'Shelters',         to: '/commander/shelters',       icon: Home },
  { section: 'Intelligence' },
  { label: 'Damage Reports',   to: '/commander/damage-reports', icon: ClipboardList },
  { label: 'Alerts',           to: '/commander/alerts',         icon: Bell },
  { label: 'Analytics',        to: '/commander/analytics',      icon: BarChart3 },
];

const ADMIN_NAV = [
  { section: 'System' },
  { label: 'Dashboard',        to: '/admin/dashboard',          icon: LayoutDashboard },
  { label: 'Analytics',        to: '/admin/analytics',          icon: BarChart3 },
  { section: 'Management' },
  { label: 'Users',            to: '/admin/users',              icon: Users },
  { label: 'Response Teams',   to: '/admin/teams',              icon: Truck },
  { label: 'Resources',        to: '/admin/resources',          icon: Package },
  { label: 'Shelters',         to: '/admin/shelters',           icon: Home },
  { section: 'Administration' },
  { label: 'Alerts',           to: '/admin/alerts',             icon: Bell },
  { label: 'Audit Logs',       to: '/admin/audit',              icon: BookOpen },
  { label: 'Settings',         to: '/admin/settings',           icon: Settings },
];

const NAV_MAP = {
  civilian:  CIVILIAN_NAV,
  responder: RESPONDER_NAV,
  commander: COMMANDER_NAV,
  admin:     ADMIN_NAV,
};

const ROLE_LABELS = {
  civilian:  'Civilian Portal',
  responder: 'Responder Hub',
  commander: 'Command Center',
  admin:     'Administration',
};

const ROLE_COLORS = {
  civilian:  'text-info-light',
  responder: 'text-warning-light',
  commander: 'text-emergency-light',
  admin:     'text-purple-400',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar Component
// ─────────────────────────────────────────────────────────────────────────────

const Sidebar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_MAP[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar" style={{ width: 'var(--sidebar-width)' }}>
      {/* Brand */}
      <div className="px-4 py-4 border-b border-eoc-border flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded bg-emergency/20 border border-emergency/30 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-emergency" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-200 leading-none">DISASTER RESPONSE</p>
            <p className="text-2xs text-gray-600 mt-0.5">AI Command System</p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2 bg-eoc-bg px-2.5 py-1.5 rounded border border-eoc-border">
          <span className={`text-2xs font-semibold uppercase tracking-wide ${ROLE_COLORS[role]}`}>
            {ROLE_LABELS[role]}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <p key={`section-${idx}`} className="nav-section-label">
                {item.section}
              </p>
            );
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
      <div className="border-t border-eoc-border p-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-7 h-7 rounded-full bg-eoc-muted flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">
              {user?.name || user?.email || 'User'}
            </p>
            <p className="text-2xs text-gray-600 capitalize">{role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-gray-600 hover:text-emergency transition-colors p-1 rounded hover:bg-eoc-hover"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
