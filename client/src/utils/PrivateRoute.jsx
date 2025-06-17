// src/utils/PrivateRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user || !user.token) {
    // Not logged in
    return <Navigate to="/" replace />;
  }

  // Authenticated
  return children;
};

export default PrivateRoute;
