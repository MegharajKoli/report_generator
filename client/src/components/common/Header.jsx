import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { LogOut } from "lucide-react"; // <-- added import
import "../../styles/Header.css";

function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);

  useEffect(() => {
    if (!user && !showLogoutMessage) {
      navigate("/");
    }
  }, [user, navigate, showLogoutMessage]);

  const handleLogout = () => {
    setShowLogoutMessage(true);
    setTimeout(() => {
      logout();
      navigate("/");
    }, 2000);
  };

  return (
    <>
      {showLogoutMessage && (
        <div className="logout-popup">
          <p>You have successfully logged out.</p>
        </div>
      )}

      <header className="header">
        <img src="/wit_logo.png" alt="Logo" className="logo" />
        <h1>
          {user?.role === "department" ? `${user.department} Department` : "Office User"}
        </h1>

        <button
          className="login-btn"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </header>
    </>
  );
}

export default Header;
