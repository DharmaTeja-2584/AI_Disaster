import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff, AlertTriangle, Activity, Cpu, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';

// ─── Demo Credentials ─────────────────────────────────────────────────────────
const DEMO_CREDENTIALS = [
  { role: 'Civilian',  email: 'civilian@demo.com',  password: 'demo1234', color: 'text-info-light',      bg: 'bg-info-subtle      border-info/20' },
  { role: 'Responder', email: 'responder@demo.com', password: 'demo1234', color: 'text-warning-light',   bg: 'bg-warning-subtle   border-warning/20' },
  { role: 'Commander', email: 'commander@demo.com', password: 'demo1234', color: 'text-emergency-light', bg: 'bg-emergency-subtle  border-emergency/20' },
  { role: 'Admin',     email: 'admin@demo.com',     password: 'demo1234', color: 'text-purple-400',      bg: 'bg-purple-900/20    border-purple-800/30' },
];

const ROLE_DEFAULT = {
  civilian:  '/civilian/dashboard',
  responder: '/responder/dashboard',
  commander: '/commander/command-center',
  admin:     '/admin/dashboard',
};

// ─── Live Operational Subsystem Indicators ──────────────────────────────────
const STATUS_ITEMS = [
  { label: 'AI Triage Engine',     status: 'Online',    color: 'text-success-light' },
  { label: 'Incident Monitor',     status: 'Active',    color: 'text-success-light' },
  { label: 'Dispatch System',      status: 'Ready',     color: 'text-success-light' },
  { label: 'Resource Tracker',     status: 'Synced',    color: 'text-success-light' },
];

// ─────────────────────────────────────────────────────────────────────────────
// LoginPage
// ─────────────────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name || user.email}`);
      const userRole = (user?.role || '').toLowerCase();
      navigate(ROLE_DEFAULT[userRole] || '/');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (!err.response
          ? 'Cannot connect to server. Please ensure the backend is running on http://localhost:5001.'
          : 'Login failed. Please check your credentials.');
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (cred) => {
    setForm({ email: cred.email, password: cred.password });
    setErrors({});
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ── Left Panel — Branding ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 border-r"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-emergency/20 border border-emergency/30 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-emergency" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-200 uppercase tracking-wide">
                DISASTER RESPONSE
              </p>
              <p className="text-xs text-gray-600">AI Command Platform</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-100 leading-tight mb-3">
            Emergency Operations<br />
            <span className="text-emergency">Command Center</span>
          </h1>

          <p className="text-sm text-gray-500 leading-relaxed mb-8">
            Intelligent disaster coordination platform with real-time AI triage,
            geospatial dispatch, resource management, and shelter allocation.
          </p>

          {/* System Status */}
          <div className="space-y-2">
            <p className="text-2xs text-gray-600 uppercase tracking-widest mb-3">
              System Status
            </p>
            {STATUS_ITEMS.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-1.5 border-b"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <span className="text-xs text-gray-500">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-slow" />
                  <span className={`text-2xs font-semibold ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'AI Accuracy', value: '94%', Icon: Cpu },
              { label: 'Avg Response', value: '4 min', Icon: Radio },
              { label: 'Uptime', value: '99.9%', Icon: Activity },
            ].map(({ label, value, Icon }) => (
              <div
                key={label}
                className="text-center p-3 rounded"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <Icon className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                <p className="text-base font-bold text-gray-200">{value}</p>
                <p className="text-2xs text-gray-600">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-2xs text-gray-700 text-center">
            AI Disaster Response System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* ── Right Panel — Login Form ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <ShieldAlert className="w-7 h-7 text-emergency" />
            <p className="text-sm font-bold text-gray-200 uppercase tracking-wide">
              DISASTER RESPONSE
            </p>
          </div>

          {/* Form card */}
          <div
            className="rounded-lg p-6 shadow-modal"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-100 mb-1">Sign in</h2>
              <p className="text-xs text-gray-500">
                Access the Emergency Operations Platform
              </p>
            </div>

            {/* Error banner */}
            {errors.general && (
              <div className="alert-critical mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
              {/* Email */}
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className={`form-input ${errors.email ? 'border-emergency' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="login-password" className="form-label">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`form-input pr-9 ${errors.password ? 'border-emergency' : ''}`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="danger"
                loading={loading}
                className="w-full justify-center py-2"
              >
                Sign in to Command Center
              </Button>
            </form>

            {/* Register link */}
            <p className="text-xs text-gray-600 text-center mt-4">
              New citizen?{' '}
              <Link to="/register" className="text-info-light hover:underline">
                Register here
              </Link>
            </p>
          </div>

          {/* ── Demo Credentials ───────────────────────────────────────── */}
          <div className="mt-4">
            <p className="text-2xs text-gray-600 uppercase tracking-widest text-center mb-3">
              Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.role}
                  onClick={() => fillDemo(cred)}
                  className={`text-left p-2.5 rounded border text-xs transition-all hover:scale-[1.02] ${cred.bg}`}
                >
                  <p className={`font-semibold ${cred.color}`}>{cred.role}</p>
                  <p className="text-gray-600 text-2xs mt-0.5 truncate">{cred.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
