import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🔑 NEW: loading state

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const department = localStorage.getItem("department");

    if (token && role) {
      setUser({ userId, token, role, department });
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false); // ✅ finished restoring
  }, []);

  const login = ({ userId, token, role, department }) => {
    localStorage.setItem("userId", userId);
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("department", department);
    setUser({ userId, token, role, department });

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
