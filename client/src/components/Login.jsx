import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/Login.css'; // Assuming you have a CSS file for styling



function Login() {
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedOut = new URLSearchParams(location.search).get("loggedOut");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`,formData);


      const { token, role, department } = res.data;
      login({ token, role, department });

      if (role === "department") {
        navigate("/dashboard-dept");
      } else if (role === "office") {
        navigate("/dashboard-office");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Invalid login credentials");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/wit_logo.png" alt="WIT Logo" className="logo-img" />
          <h1 style= {{ fontfamily: "Anton sans-serif"}} className="institute-name">WALCHAND INSTITUTE OF TECHNOLOGY, SOLAPUR</h1>
        </div>

        <div className="login-content">
          <div className="login-illustration">
            <img src="/image-Photoroom.png" alt="Illustration" className="illustration-img" />
          </div>

          <div className="login-form-section">
            <h2 style={{ fontFamily: "'Lato', sans-serif"  , fontWeight : "bold"}} className="form-title">Report page</h2>

            {isLoggedOut && (
              <p className="logout-message">You have been successfully logged out.</p>
            )}

            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit} >
              <div className="form-group">
                <label style={{ fontFamily: "'Open Sans', sans-serif" }} className='txt' htmlFor="userId">UserID:</label>
                <input
                  type="text"
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontFamily: "'Open Sans', sans-serif" }} className='txt' htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button style={{ fontFamily: "'Open Sans', sans-serif" }} type="submit" className="login-btn">LOGIN</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
