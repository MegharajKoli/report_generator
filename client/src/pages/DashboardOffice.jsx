import React, { useContext } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/DashboardOffice.css";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

function DashboardOffice() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;

  let mainClass = "container";

  if (path === "/dashboard-office") {
    mainClass += " dashboard-mode";
  } else if (path.includes("download-reports")) {
    mainClass += " download-bg";
  } else if (path.includes("view-reports")) {
    mainClass += " view-bg";
  }


  return (
    <>
      <Header />
      <main className={mainClass}>
        {path ==="/dashboard-office" && (
          <section className="left-panel">
            <h1>
              Welcome to the <span>Office Dashboard</span>
            </h1>
            <p>Your year at a Glance, all in one place</p>
            <img src="/back.webp" alt="background" />
          </section>
        )}

        {path ==="/dashboard-office"  && (
          <section className="right-panel">
            <img id="cal" src="/cal.png" alt="Calendar" />
            <h1>GET STARTED!</h1>
            <div className="reports">
              <div
                className="report-card"
                onClick={() => navigate("download-reports")}
              >
                <img src="/AnnualReport.png" alt="Report Icon" />
                <button className="report-btn">Download Annual Report</button>
              </div>
              <div
                className="report-card"
                onClick={() => navigate("view-reports")}
              >
                <img src="/PrevNew.png" alt="Report Icon" />
                <button className="report-btn">View Previous Report</button>
              </div>
            </div>
          </section>
        )}

        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default DashboardOffice;
