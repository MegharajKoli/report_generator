import React from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "../styles/DashboardDept.css";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

function DashboardDept() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  let mainClass = "container";

  if (path === "/dashboard-dept") {
    mainClass += " dashboard-mode";
  } else if (path.includes("create-report")) {
    mainClass += " create-bg";
  } else if (path.includes("download-report")) {
    mainClass += " download-bg";
  } else if (path.includes("view-report")) {
    mainClass += " view-bg";
  }


  return (
    <>
    <div className="container view-bg-white">

      <Header />
      <main className={mainClass}>
        {path === "/dashboard-dept" && (
          <section className="left-panel">
            <h1>
              Welcome to the <span>Department Dashboard</span>
            </h1>
            <p>Your year at a Glance, all in one place</p>
            <img src="/back.webp" alt="background" />
          </section>
        )}

        {path === "/dashboard-dept" && (
          <section className="right-panel">
            <div className="reports">
              <div className="report-card" onClick={() => navigate("create-report")}>
                <img style={{ width: "150px" }} src="/Rorg.png" alt="Report Icon" />
                <button className="report-btn">Create Report</button>
              </div>
              <div className="report-card" onClick={() => navigate("download-report")}>
                <img className="img" src="/AnnualReport.png" alt="Report Icon" />
                <button className="report-btn">Download Annual Report</button>
              </div>
              <div className="report-card" onClick={() => navigate("view-report")}>
                <img src="/PrevNew.png" alt="Report Icon" />
                <button className="report-btn">View Previous Report</button>
              </div>
            </div>
          </section>
        )}

        <Outlet />
      </main>
      <Footer />
      </div>
    </>
  );
}

export default DashboardDept;
