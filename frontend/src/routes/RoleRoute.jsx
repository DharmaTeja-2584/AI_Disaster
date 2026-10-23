import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DEFAULT_ROUTES = {
  civilian:  '/civilian/dashboard',
  responder: '/responder/dashboard',
  commander: '/commander/command-center',
  admin:     '/admin/dashboard',
};

/**
 * RoleRoute
 * Allows access only if the user has one of the allowedRoles.
 * Redirects unauthorized users to their own dashboard.
 *
 * Usage:
 *   <RoleRoute allowedRoles={['commander', 'admin']}>
 *     <CommandCenter />
 *   </RoleRoute>
 */
const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { user, role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = (role || '').toLowerCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  if (!normalizedAllowed.includes(normalizedRole)) {
    const fallback = ROLE_DEFAULT_ROUTES[normalizedRole] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default RoleRoute;
