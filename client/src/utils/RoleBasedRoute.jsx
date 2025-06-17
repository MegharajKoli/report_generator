// src/utils/RoleBasedRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { user } = useContext(AuthContext);

  if (!user || !user.token) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleBasedRoute;
