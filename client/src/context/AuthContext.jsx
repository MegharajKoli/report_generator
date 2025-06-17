import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user = { role, department, token }

  useEffect(() => {
    // Load from localStorage on refresh
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const department = localStorage.getItem("department");

    if (token && role) {
      setUser({ userId ,token, role, department });
    }
  }, []);

  const login = ({userId, token, role, department }) => {
    localStorage.setItem("userId", userId);
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("department", department);
    setUser({ userId,token, role, department });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
