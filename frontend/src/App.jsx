import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Public pages
import LoginPage    from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Civilian pages
import CivilianDashboard from './pages/civilian/Dashboard';
import SubmitReport from './pages/civilian/SubmitReport';
import MyReports from './pages/civilian/MyReports';
import NearbyShelters from './pages/civilian/NearbyShelters';
import CivilianAlerts from './pages/civilian/Alerts';

// Responder pages
import ResponderDashboard from './pages/responder/Dashboard';
import MyIncidents from './pages/responder/MyIncidents';
import DamageReports from './pages/responder/DamageReports';
import ResponderAlerts from './pages/responder/Alerts';

// Commander pages
import CommandCenter from './pages/commander/CommandCenter';
import IncidentDetails from './pages/commander/IncidentDetails';
import ResponseTeams from './pages/commander/ResponseTeams';
import Resources from './pages/commander/Resources';
import Shelters from './pages/commander/Shelters';
import CommanderAlerts from './pages/commander/Alerts';
import Analytics from './pages/commander/Analytics';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AuditLogs from './pages/admin/AuditLogs';

// ─── Default role redirect ────────────────────────────────────────────────────
const ROLE_HOME = {
  civilian:  '/civilian/dashboard',
  responder: '/responder/dashboard',
  commander: '/commander/command-center',
  admin:     '/admin/dashboard',
};

const RoleIndex = () => {
  const { role } = useAuth();
  return <Navigate to={ROLE_HOME[role] || '/login'} replace />;
};

// ─────────────────────────────────────────────────────────────────────────────
const App = () => (
  <Routes>
    {/* ── Public ─────────────────────────────────────────────────────────── */}
    <Route path="/login"    element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* ── Root redirect ─────────────────────────────────────────────────── */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <RoleIndex />
        </ProtectedRoute>
      }
    />

    {/* ── Civilian ───────────────────────────────────────────────────────── */}
    <Route
      path="/civilian/*"
      element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['civilian']}>
            <Routes>
              <Route path="dashboard"  element={<CivilianDashboard />} />
              <Route path="submit"     element={<SubmitReport />} />
              <Route path="my-reports" element={<MyReports />} />
              <Route path="shelters"   element={<NearbyShelters />} />
              <Route path="alerts"     element={<CivilianAlerts />} />
              <Route index             element={<Navigate to="dashboard" replace />} />
            </Routes>
          </RoleRoute>
        </ProtectedRoute>
      }
    />

    {/* ── Responder ──────────────────────────────────────────────────────── */}
    <Route
      path="/responder/*"
      element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['responder']}>
            <Routes>
              <Route path="dashboard" element={<ResponderDashboard />} />
              <Route path="incidents" element={<MyIncidents />} />
              <Route path="damage"    element={<DamageReports />} />
              <Route path="alerts"    element={<ResponderAlerts />} />
              <Route index            element={<Navigate to="dashboard" replace />} />
            </Routes>
          </RoleRoute>
        </ProtectedRoute>
      }
    />

    {/* ── Commander ──────────────────────────────────────────────────────── */}
    <Route
      path="/commander/*"
      element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['commander', 'admin']}>
            <Routes>
              <Route path="command-center"  element={<CommandCenter />} />
              <Route path="incidents"       element={<CommandCenter />} />
              <Route path="incidents/:id"   element={<IncidentDetails />} />
              <Route path="teams"           element={<ResponseTeams />} />
              <Route path="resources"       element={<Resources />} />
              <Route path="shelters"        element={<Shelters />} />
              {/* Phases 8–9 */}
              <Route path="alerts"          element={<CommanderAlerts />} />
              <Route path="damage-reports"  element={<DamageReports />} />
              <Route path="analytics"       element={<Analytics />} />
              <Route index                  element={<Navigate to="command-center" replace />} />
            </Routes>
          </RoleRoute>
        </ProtectedRoute>
      }
    />

    {/* ── Admin ──────────────────────────────────────────────────────────── */}
    <Route
      path="/admin/*"
      element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={['admin']}>
            <Routes>
              <Route path="dashboard"      element={<AdminDashboard />} />
              <Route path="users"          element={<AdminDashboard />} />
              <Route path="teams"          element={<ResponseTeams />} />
              <Route path="resources"      element={<Resources />} />
              <Route path="shelters"       element={<Shelters />} />
              <Route path="alerts"         element={<CommanderAlerts />} />
              <Route path="incidents/:id"  element={<IncidentDetails />} />
              <Route path="audit"          element={<AuditLogs />} />
              <Route path="analytics"      element={<Analytics />} />
              <Route path="settings"       element={<AdminDashboard />} />
              <Route index                 element={<Navigate to="dashboard" replace />} />
            </Routes>
          </RoleRoute>
        </ProtectedRoute>
      }
    />

    {/* ── 404 ────────────────────────────────────────────────────────────── */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
