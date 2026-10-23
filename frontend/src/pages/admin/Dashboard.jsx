import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../layouts/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader, CardTitle, CardSubtitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusPill from '../../components/ui/StatusPill';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { SkeletonCard, SkeletonTable } from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { getUsers, createUser, updateUserRole } from '../../api/users';
import { getDemoStatus, loadDemoScenario, resetDemoBaseline } from '../../api/demo';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Radio,
  Package,
  Home,
  BookOpen,
  BarChart3,
  Server,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Settings,
  Layers,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';

const ROLE_COLORS = {
  civilian: 'badge-info',
  responder: 'badge-warning',
  commander: 'badge-emergency',
  admin: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'overview' | 'users' | 'demo' | 'settings'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Add User Modal State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'civilian',
    password: '',
  });
  const [addUserLoading, setAddUserLoading] = useState(false);

  // Edit Role Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('civilian');
  const [roleLoading, setRoleLoading] = useState(false);

  // Demo Status State
  const [demoStatus, setDemoStatus] = useState(null);
  const [demoLoading, setDemoLoading] = useState(true);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Keep URL in sync with tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch Users
  const fetchUsersList = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error('Failed to retrieve user accounts.');
    } finally {
      setUsersLoading(false);
    }
  }, [toast]);

  // Fetch Demo Status
  const fetchDemoState = useCallback(async () => {
    setDemoLoading(true);
    try {
      const res = await getDemoStatus();
      setDemoStatus(res.data.data || null);
    } catch (err) {
      console.error('Failed to load demo status:', err);
    } finally {
      setDemoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersList();
    fetchDemoState();
  }, [fetchUsersList, fetchDemoState]);

  // Handle Add User
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.warning('Name, email, and password are required.');
      return;
    }
    setAddUserLoading(true);
    try {
      await createUser(newUserData);
      toast.success(`User "${newUserData.name}" created successfully.`);
      setAddUserModalOpen(false);
      setNewUserData({ name: '', email: '', phone: '', role: 'civilian', password: '' });
      fetchUsersList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setAddUserLoading(false);
    }
  };

  // Handle Update Role
  const handleUpdateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setRoleLoading(true);
    try {
      await updateUserRole(selectedUser.id, newRole);
      toast.success(`Updated role for ${selectedUser.name} to ${newRole}.`);
      setRoleModalOpen(false);
      setSelectedUser(null);
      fetchUsersList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setRoleLoading(false);
    }
  };

  // Handle Load Demo Scenario
  const handleLoadScenario = async () => {
    setScenarioLoading(true);
    try {
      const res = await loadDemoScenario();
      toast.success('Building Collapse scenario injected into Command Center!');
      fetchDemoState();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load scenario.');
    } finally {
      setScenarioLoading(false);
    }
  };

  // Handle Reset Demo Baseline
  const handleConfirmReset = async () => {
    setResetLoading(true);
    try {
      await resetDemoBaseline();
      toast.success('Operational baselines (Teams, Resources, Shelters) reset to pristine state.');
      setResetModalOpen(false);
      fetchDemoState();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset demo baseline.');
    } finally {
      setResetLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      String(u.id).includes(userSearch);
    const matchesRole = roleFilter === 'All' || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <AppShell title="Administration & System Operations">
      <PageHeader
        title="Administrative Command Center"
        subtitle={`System Oversight & User Management — Authenticated as ${user?.name || 'Administrator'} (ADMIN)`}
        breadcrumb="Admin / Operations & Governance"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => {
                fetchUsersList();
                fetchDemoState();
              }}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => setAddUserModalOpen(true)}
            >
              New User
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-eoc-border pb-2">
          <button
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t transition-colors ${
              activeTab === 'overview'
                ? 'bg-eoc-surface text-emergency-light border-b-2 border-emergency'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            System Overview
          </button>
          <button
            onClick={() => handleTabChange('users')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t transition-colors ${
              activeTab === 'users'
                ? 'bg-eoc-surface text-emergency-light border-b-2 border-emergency'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            User Management ({users.length})
          </button>
          <button
            onClick={() => handleTabChange('demo')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t transition-colors ${
              activeTab === 'demo'
                ? 'bg-eoc-surface text-emergency-light border-b-2 border-emergency'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Demo Environment & Scenarios
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-t transition-colors ${
              activeTab === 'settings'
                ? 'bg-eoc-surface text-emergency-light border-b-2 border-emergency'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Infrastructure & Diagnostics
          </button>
        </div>

        {/* ── TAB 1: SYSTEM OVERVIEW ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Operational Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
              <div className="metric-card p-4 bg-eoc-card border border-eoc-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-semibold uppercase text-gray-400">Total Users</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold font-mono text-gray-100 mt-2">{users.length}</p>
                <span className="text-2xs text-gray-500">Across 4 primary RBAC roles</span>
              </div>

              <div className="metric-card p-4 bg-eoc-card border border-eoc-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-semibold uppercase text-gray-400">Active Incidents</span>
                  <Radio className="w-4 h-4 text-warning-light" />
                </div>
                <p className="text-2xl font-bold font-mono text-warning-light mt-2">
                  {demoStatus?.metrics?.activeIncidents ?? '—'}
                </p>
                <span className="text-2xs text-gray-500">Total reported: {demoStatus?.metrics?.totalIncidents ?? '—'}</span>
              </div>

              <div className="metric-card p-4 bg-eoc-card border border-eoc-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-semibold uppercase text-gray-400">Response Fleet</span>
                  <ShieldCheck className="w-4 h-4 text-info-light" />
                </div>
                <p className="text-2xl font-bold font-mono text-info-light mt-2">
                  {demoStatus?.metrics?.availableTeams ?? '—'} / {demoStatus?.metrics?.totalTeams ?? '—'}
                </p>
                <span className="text-2xs text-gray-500">Available / Registered Teams</span>
              </div>

              <div className="metric-card p-4 bg-eoc-card border border-eoc-border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-semibold uppercase text-gray-400">Audit Ledger</span>
                  <BookOpen className="w-4 h-4 text-success-light" />
                </div>
                <p className="text-2xl font-bold font-mono text-success-light mt-2">
                  {demoStatus?.metrics?.totalAuditLogs ?? '—'}
                </p>
                <span className="text-2xs text-gray-500">Immutable governance events</span>
              </div>
            </div>

            {/* Quick Operations Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-eoc-card border border-eoc-border rounded-lg p-5 flex flex-col justify-between hover:border-gray-600 transition-colors">
                <div>
                  <div className="flex items-center gap-2 text-info-light font-semibold text-sm mb-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>Disaster Intelligence</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Review cross-domain SQL aggregation analytics, AI confidence trends, and geographic incident hotspots.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => navigate('/admin/analytics')}
                  icon={ArrowRight}
                >
                  Open Analytics
                </Button>
              </div>

              <div className="bg-eoc-card border border-eoc-border rounded-lg p-5 flex flex-col justify-between hover:border-gray-600 transition-colors">
                <div>
                  <div className="flex items-center gap-2 text-success-light font-semibold text-sm mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Audit Trail Ledger</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Inspect immutable operational audit logs with user traceability, action filtering, and timestamps.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => navigate('/admin/audit')}
                  icon={ArrowRight}
                >
                  View Audit Logs
                </Button>
              </div>

              <div className="bg-eoc-card border border-eoc-border rounded-lg p-5 flex flex-col justify-between hover:border-gray-600 transition-colors">
                <div>
                  <div className="flex items-center gap-2 text-warning-light font-semibold text-sm mb-1">
                    <Layers className="w-4 h-4" />
                    <span>Resources & Shelters</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage logistics stockpiles, monitor low inventory, and inspect shelter occupancy capacities.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate('/admin/resources')}
                  >
                    Resources
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate('/admin/shelters')}
                  >
                    Shelters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: USER MANAGEMENT ────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>System Accounts & Access Control</CardTitle>
                  <CardSubtitle>
                    Manage registered users and configure primary authorization roles (Civilian, Responder, Commander, Admin)
                  </CardSubtitle>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="input text-xs pl-8 pr-3 py-1.5 w-48 bg-eoc-surface border-eoc-border"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="select text-xs py-1.5 bg-eoc-surface border-eoc-border"
                  >
                    <option value="All">All Roles</option>
                    <option value="civilian">Civilian</option>
                    <option value="responder">Responder</option>
                    <option value="commander">Commander</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {usersLoading ? (
                <div className="p-6">
                  <SkeletonTable rows={5} />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={Users}
                    title="No users found"
                    message="No user accounts match the selected search or role filter."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-eoc-border bg-eoc-surface/60 text-gray-400 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-4">UID</th>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-4">Email Address</th>
                        <th className="py-2.5 px-4">Contact</th>
                        <th className="py-2.5 px-4">System Role</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-eoc-border">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-eoc-hover transition-colors">
                          <td className="py-3 px-4 font-mono text-gray-500">#{u.id}</td>
                          <td className="py-3 px-4 font-medium text-gray-200">{u.name}</td>
                          <td className="py-3 px-4 text-gray-400 font-mono">{u.email}</td>
                          <td className="py-3 px-4 text-gray-400">{u.phone || '—'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`badge uppercase font-semibold text-2xs px-2 py-0.5 border ${
                                ROLE_COLORS[u.role] || 'badge-neutral'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setNewRole(u.role);
                                setRoleModalOpen(true);
                              }}
                              className="text-xs text-info-light hover:underline font-medium"
                            >
                              Edit Role
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* ── TAB 3: DEMO ENVIRONMENT ───────────────────────────────────────── */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Demonstration Mode & Scenario Control</CardTitle>
                    <CardSubtitle>
                      Deterministic demonstration scenario runner for presentation and laboratory evaluation
                    </CardSubtitle>
                  </div>
                  <span className="badge badge-success text-xs px-2.5 py-1 uppercase tracking-wider">
                    Ready for Evaluation
                  </span>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* Canonical Scenario Card */}
                <div className="p-4 bg-eoc-surface rounded-lg border border-eoc-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emergency-light uppercase tracking-wide">
                        Scenario 1
                      </span>
                      <h4 className="text-sm font-semibold text-gray-100">
                        Building Collapse — High Priority Emergency
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400 max-w-2xl">
                      Injects a critical structural collapse report with trapped casualties and expanding fire.
                      Triggers rule-based AI triage (severity 8/10), generates an automated critical alert,
                      and tests the entire dispatch-to-resolution operational lifecycle.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Flame}
                    loading={scenarioLoading}
                    onClick={handleLoadScenario}
                  >
                    Inject Scenario
                  </Button>
                </div>

                {/* Demo Accounts Reference Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Pre-Seeded Demonstration Accounts
                  </h4>
                  <p className="text-xs text-gray-400">
                    All demo accounts share the demonstration password: <code className="text-warning-light bg-black/40 px-1.5 py-0.5 rounded font-mono">demo1234</code>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    {demoStatus?.demoAccounts?.map((acc) => (
                      <div key={acc.email} className="p-3 bg-eoc-surface border border-eoc-border rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xs font-semibold text-gray-300">{acc.label}</span>
                          <span className={`badge uppercase text-2xs ${ROLE_COLORS[acc.role]}`}>
                            {acc.role}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-gray-400 truncate">{acc.email}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reset Environment Baseline */}
                <div className="pt-4 border-t border-eoc-border flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-200">Reset Operational Baselines</h5>
                    <p className="text-xs text-gray-500">
                      Re-seeds response teams, resource stocks, and shelter spaces to pristine initial demonstration state.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-warning-light"
                    onClick={() => setResetModalOpen(true)}
                  >
                    Reset Baseline...
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* ── TAB 4: SETTINGS & INFRASTRUCTURE ──────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Architecture & Runtime</CardTitle>
                <CardSubtitle>Backend service status and environment diagnostics</CardSubtitle>
              </CardHeader>
              <CardBody className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-eoc-border">
                  <span className="text-gray-400">Runtime Environment</span>
                  <span className="font-mono text-gray-200">Node.js / Express</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-eoc-border">
                  <span className="text-gray-400">Database Engine</span>
                  <span className="font-mono text-success-light">MySQL (Localhost:3306)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-eoc-border">
                  <span className="text-gray-400">AI Triage Mechanism</span>
                  <span className="font-mono text-info-light">Rule-Based NLP & Keyword Engine</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-eoc-border">
                  <span className="text-gray-400">Dispatch Algorithm</span>
                  <span className="font-mono text-gray-200">Haversine Great-Circle Distance</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-eoc-border">
                  <span className="text-gray-400">Authentication / RBAC</span>
                  <span className="font-mono text-gray-200">JWT + bcrypt (4 Primary Roles)</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-400">Audit Trail Mechanism</span>
                  <span className="font-mono text-success-light">Immutable MySQL audit_log Ledger</span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Database Tables</CardTitle>
                <CardSubtitle>Authoritative relational schema breakdown</CardSubtitle>
              </CardHeader>
              <CardBody className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-gray-300 font-mono">
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">user</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">incident</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">response_team</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">resource</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">shelter</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">ai_prediction</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">damage_report</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">alert</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">incident_dispatch</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">resource_allocation</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">incident_shelter</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">incident_alert</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">alert_acknowledgement</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border">incident_damage_report</div>
                  <div className="p-2 bg-eoc-surface rounded border border-eoc-border col-span-2 text-success-light">
                    audit_log (Governance Ledger)
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* ── MODAL 1: ADD USER ─────────────────────────────────────────────── */}
      <Modal
        isOpen={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        title="Create New System Account"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Capt. Sarah Jenkins"
            value={newUserData.name}
            onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. s.jenkins@response.gov"
            value={newUserData.email}
            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
            required
          />
          <Input
            label="Phone Contact"
            placeholder="e.g. 555-0199"
            value={newUserData.phone}
            onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
          />
          <Select
            label="System Role (RBAC)"
            value={newUserData.role}
            onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
            options={[
              { value: 'civilian', label: 'Civilian' },
              { value: 'responder', label: 'Field Responder' },
              { value: 'commander', label: 'Incident Commander' },
              { value: 'admin', label: 'System Administrator' },
            ]}
          />
          <Input
            label="Initial Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={newUserData.password}
            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
            required
          />
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-eoc-border">
            <Button variant="ghost" size="sm" onClick={() => setAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={addUserLoading} type="submit">
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: EDIT USER ROLE ───────────────────────────────────────── */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={`Update Role: ${selectedUser?.name || 'User'}`}
      >
        <form onSubmit={handleUpdateRoleSubmit} className="space-y-4">
          <p className="text-xs text-gray-400">
            Modifying system permissions for <strong className="text-gray-200">{selectedUser?.email}</strong>.
            This action will be immediately audited in the system ledger.
          </p>
          <Select
            label="Assigned System Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={[
              { value: 'civilian', label: 'Civilian' },
              { value: 'responder', label: 'Field Responder' },
              { value: 'commander', label: 'Incident Commander' },
              { value: 'admin', label: 'System Administrator' },
            ]}
          />
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-eoc-border">
            <Button variant="ghost" size="sm" onClick={() => setRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={roleLoading} type="submit">
              Save Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 3: CONFIRM DEMO RESET ───────────────────────────────────── */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Confirm Operational Baseline Reset"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-warning-subtle border border-warning/30 rounded text-warning-light">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Warning: Operational State Reset</span>
            </div>
            <p className="mt-1 text-gray-300">
              This will reset response team availability to 'Available', restore initial resource warehouse stocks,
              and reset shelter space capacities. Incident history and audit ledgers will remain intact.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="warning" size="sm" loading={resetLoading} onClick={handleConfirmReset}>
              Confirm Reset
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
};

export default AdminDashboard;
