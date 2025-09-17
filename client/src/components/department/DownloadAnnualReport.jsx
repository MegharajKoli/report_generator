import React, { useEffect, useState } from "react";
import "jspdf-autotable";
import "../../styles/DownloadAnnualReports.css";
import { generateAnnualPDF } from "../../utils/generateannualpdf";

const DownloadAnnualReports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [userDept, setUserDept] = useState("");
  const [searchOrg, setSearchOrg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState({}); 

  useEffect(() => {
    const dept = localStorage.getItem("department");
    setUserDept(dept);

    const fetchReports = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/reports/annual");
        if (!response.ok) throw new Error("Failed to fetch reports");
        const data = await response.json();
        console.log("📦 Reports from backend:", data);
        setReports(data);
      } catch (error) {
        console.error("Error fetching annual reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  // 🔍 filter by dept + search
  const filteredReports = reports.filter((report) => {
    const matchesDept = report.department === userDept;
    const matchesEvent = report.academicYear?.toLowerCase().includes(search.toLowerCase());
    const matchesOrg = report.organizedBy?.toLowerCase().includes(searchOrg.toLowerCase());
    return matchesDept && matchesEvent && matchesOrg;
  });

  // 🔢 sort by academic year (latest first), then event name
  const sortedReports = [...filteredReports].sort((a, b) => {
    const yearA = parseInt(a.academicYear?.split("-")[0], 10);
    const yearB = parseInt(b.academicYear?.split("-")[0], 10);

    if (yearA !== yearB) {
      return yearB - yearA; // latest year first
    }

    return (a.eventName || "").localeCompare(b.eventName || "");
  });

  // 📦 group by Club + Year
  const groupedReports = {};
  sortedReports.forEach((report) => {
    const key = `${report.organizedBy} - ${report.academicYear}`;
    if (!groupedReports[key]) groupedReports[key] = [];
    groupedReports[key].push(report);
  });

  // Handle download button click
  const handleDownload = async (club, year, reports, key) => {
    setDownloading((prev) => ({ ...prev, [key]: true }));
    try {
      await generateAnnualPDF(club, year, reports);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloading((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="loading-spinner" style={{
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          animation: "spin 1s linear infinite",
        }}></div>
        <p style={{ fontFamily: "Times New Roman", fontSize: "14px", marginTop: "10px" }}>
          Please wait while we load your reports
        </p>
      </div>
    );
  }

  return (
    <div className="annual-reports-container">
      <h2>Annual Reports</h2>

      {/* 🔍 Search */}
      <div className="search">
        <input
          type="text"
          placeholder="Search by Academic Year"
          className="search-bar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by Organization"
          className="search-bar"
          value={searchOrg}
          onChange={(e) => setSearchOrg(e.target.value)}
        />
      </div>

      {/* 📋 Grouped Reports */}
      {Object.entries(groupedReports).map(([key, reports], idx) => {
        const [club, year] = key.split(" - ");
        return (
          <div key={idx} className="report-group">
            <h3>
              {club} ({year})
            </h3>
          
            <table className="reports-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Title</th>
                  <th>Organized By</th>
                  <th>Academic Year</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r._id || i}>
                    <td>{i + 1}</td>
                    <td>{r.eventName}</td>
                    <td>{r.organizedBy || "N/A"}</td>
                    <td>{r.academicYear || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="download-container">
              <button
                className="download-btn"
                onClick={() => handleDownload(club, year, reports, key)}
                disabled={downloading[key]}
              >
                {downloading[key] ? "Generating..." : `Download ${club} ${year} Report`}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DownloadAnnualReports;