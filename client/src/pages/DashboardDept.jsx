
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
        {isAtDashboarddept &&(
        <section className="left-panel">
          <h1>
            Welcome to the <span>Department Dashboard</span>
          </h1>
          <p>Your year at a Glance, all in one place</p>
          <img src="/back.webp" alt="background" />
        </section>
)}
        <section className="right-panel">
          <div className="reports">
            {isAtDashboarddept && (
              <>
                <div className="report-card" onClick={() => navigate("create-report")}> 
                  <img  style={{ width : "150px" }} src="/Rorg.png" alt="Report Icon" />
                  <button className="report-btn">Create Report</button>
                </div>
                <div className="report-card" onClick={() => navigate("download-report")}> 
                  <img  className="img" src="/AnnualReport.png" alt="Report Icon" />
                  <button className="report-btn"> Annual Reports</button>
                </div>
                <div className="report-card" onClick={() => navigate("view-report")}> 
                  <img  src="/PrevNew.png" alt="Report Icon" />
                  <button className="report-btn">Previous Reports</button>
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