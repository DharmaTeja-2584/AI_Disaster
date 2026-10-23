import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAlerts } from '../api/alerts';

const ROLE_COLORS = {
  civilian:  'text-info-light  bg-info-subtle  border-info/20',
  responder: 'text-warning-light bg-warning-subtle border-warning/20',
  commander: 'text-emergency-light bg-emergency-subtle border-emergency/20',
  admin:     'text-purple-400 bg-purple-900/20 border-purple-800/30',
};

const TopNav = ({ title, onRefresh }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await getAlerts({ unreadOnly: 'true', limit: 50 });
        if (isMounted) {
          const list = res.data?.data?.alerts || [];
          setUnreadAlertsCount(list.length);
        }
      } catch (e) {
        // Silent catch for topnav badge
      }
    };
    fetchUnread();
    return () => { isMounted = false; };
  }, [role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topnav" style={{ height: 'var(--topnav-height)' }}>
      {/* Left — page title */}
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-300">{title}</h2>
      </div>

      {/* Right — live indicator, refresh, alerts, profile */}
      <div className="flex items-center gap-3">

        {/* Live status */}
        <div className="flex items-center gap-1.5 text-2xs text-gray-500">
          <span className="live-dot" />
          <span className="uppercase tracking-widest">Live</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded hover:bg-eoc-hover"
            title="Refresh data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Alert notification center bell */}
        <button
          className="relative text-gray-500 hover:text-gray-300 transition-colors p-1.5 rounded hover:bg-eoc-hover"
          title={`Alerts (${unreadAlertsCount} unread)`}
          onClick={() => navigate(`/${role}/alerts`)}
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 rounded-full bg-emergency text-white text-[9px] font-bold flex items-center justify-center font-mono">
              {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Role chip */}
        <span className={`badge uppercase ${ROLE_COLORS[role]}`}>
          {role}
        </span>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-eoc-muted flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium max-w-[120px] truncate">
              {user?.name || user?.email || 'User'}
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-44 bg-eoc-card border border-eoc-border rounded shadow-panel z-50 animate-fade-in"
              onBlur={() => setProfileOpen(false)}
            >
              <div className="px-3 py-2 border-b border-eoc-border">
                <p className="text-xs font-medium text-gray-300 truncate">{user?.email}</p>
                <p className="text-2xs text-gray-600 capitalize">{role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-emergency hover:bg-emergency-subtle transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
