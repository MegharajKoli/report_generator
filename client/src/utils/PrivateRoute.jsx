// src/utils/PrivateRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext); // 🔑 include loading

  if (loading) {
    return <div>Loading...</div>; // prevent redirect while restoring user
  }

  if (!user || !user.token) {
    return <Navigate to="/" replace />; // redirect to login
  }

  return children; // ✅ authenticated
};

export default PrivateRoute;
