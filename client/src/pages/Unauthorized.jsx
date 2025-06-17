// src/pages/Unauthorized.jsx
import React from "react";
import "../styles/Unauthorized.css"; // Optional CSS for styling

const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <h2>🚫 Unauthorized Access</h2>
      <p>You do not have permission to view this page.</p>
    </div>
  );
};

export default Unauthorized;
