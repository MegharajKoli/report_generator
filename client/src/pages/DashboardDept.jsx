// Modified: dashboarddept.jsx
import React from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "../styles/DashboardDept.css";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

function DashboardDept() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAtDashboarddept = location.pathname === "/dashboard-dept";

  return (
    <>
      <Header />
      <main className="container">
        <section className="left-panel">
          <h1>
            Welcome to the <span>Department Dashboard</span>
          </h1>
          <p>Your year at a Glance, all in one place</p>
          <img src="/back.webp" alt="background" />
        </section>

        <section className="right-panel">
          <div className="reports">
            {isAtDashboarddept && (
              <>
                <div className="report-card" onClick={() => navigate("create-report")}> 
                  <img src="/report.png" alt="Report Icon" />
                  <button className="report-btn">Create Report</button>
                </div>
                <div className="report-card" onClick={() => navigate("download-report")}> 
                  <img src="/report.png" alt="Report Icon" />
                  <button className="report-btn">Download Annual Report</button>
                </div>
                <div className="report-card" onClick={() => navigate("view-report")}> 
                  <img src="/report.png" alt="Report Icon" />
                  <button className="report-btn">View Previous Report</button>
                </div>
              </>
            )}
            <Outlet />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default DashboardDept;