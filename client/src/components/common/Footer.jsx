import React, { useContext } from "react";
import "../../styles/Footer.css";
import { AuthContext } from "../../context/AuthContext";

function Footer() {
  const { user } = useContext(AuthContext);

  return (
    <footer className="footer">
      <span className="label">Logged in as</span>
      <span className="role">{user?.department || "Office"}</span>
    </footer>
  );
}

export default Footer;
