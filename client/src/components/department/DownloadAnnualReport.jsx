import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "jspdf-autotable";
import "../../styles/DownloadAnnualReports.css";
import { generateAnnualPDF } from "../../utils/generateannualpdf";

const DownloadAnnualReports = () => {
  const [reports, setReports] = useState([]);
  const [searchYear, setSearchYear] = useState("");
  const [searchOrg, setSearchOrg] = useState("");
  const [userDept, setUserDept] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Hardcoded academic years
  const academicYears = [
    "2025-26",
    "2024-25",
    "2023-24",
    "2022-23",
    "2021-22",
  ].sort().reverse();

  // Fetch user's department and organizations on mount
  useEffect(() => {
    const dept = localStorage.getItem("department");
    setUserDept(dept);

    const fetchOrganizations = async () => {
      if (!dept) {
        setError("No department found in localStorage. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/reports/annual/unique/orgs?department=${encodeURIComponent(dept)}`
        );
        if (!response.ok) throw new Error("Failed to fetch organizations");
        const orgsData = await response.json();
        setOrganizations(orgsData.sort());
        setError("");
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizations([]);
        setError("Failed to load organizations. Please try again.");
      }
    };

    fetchOrganizations();
  }, []);

  // Handle search button click
  const handleSearch = async () => {
    if (!searchYear || !searchOrg) {
      setModalMessage("Please select both Academic Year and Organization before searching.");
      setShowModal(true);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        department: userDept,
        academicYear: searchYear,
        organizedBy: searchOrg,
        page,
        limit: 50,
      });
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/annual?${params}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch reports");
      }
      const data = await response.json();
      console.log("📦 Filtered reports from backend:", reports);
      setReports(data);
      if (data.length === 0) {
        setError("No reports found for the selected filters.");
      }
    } catch (error) {
      console.error("Error fetching annual reports:", error);
      setReports([]);
      setError(error.message || "Failed to load reports. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    navigate("/dashboard-dept");
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
  };

  // Group reports by Organization + Year
  const groupedReports = {};
  reports.forEach((report) => {
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
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="annual-reports-container">
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <p>{modalMessage}</p>
            <button onClick={closeModal}>OK</button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}


      <button className="back-btn"
      style={{
        padding: "10px 20px",
        backgroundColor: "#3B82F6",
        color: "black",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "16px",
      }} onClick={handleBack}>
        ↩
      </button>
      <h2>Annual Reports - {userDept}</h2>

      <div className="search">
        <select
          className="search-bar"
          value={searchYear}
          onChange={(e) => setSearchYear(e.target.value)}
        >
          <option value="">Select Academic Year</option>
          {academicYears.map((year, idx) => (
            <option key={idx} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          className="search-bar"
          value={searchOrg}
          onChange={(e) => setSearchOrg(e.target.value)}
          disabled={!userDept}
        >
          <option value="">Select Organization</option>
          {organizations.length === 0 ? (
            <option value="" disabled>
              {userDept ? "No organizations available" : "Department not loaded"}
            </option>
          ) : (
            organizations.map((org, idx) => (
              <option key={idx} value={org}>
                {org}
              </option>
            ))
          )}
        </select>

        <button className="search-btn" onClick={handleSearch}>
          Search
        </button>
      </div>

      {!isLoading && reports.length === 0 && (
        <div className="no-reports">
          <p style={{fontSize:"14px"}}>
            {searchYear && searchOrg
              ? "Click Search"
              : "Please select filters and click Search."}
          </p>
        </div>
      )}
      {isLoading && (
        <div className="loading-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div className="loading-spinner" style={{
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          animation: "spin 1s linear infinite",
        }}></div>
          <p style={{fontSize:"14px"}}>Please wait while we load reports</p>
        </div>
      )}

      {!isLoading &&
        Object.entries(groupedReports).map(([key, reports], idx) => {
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
                    <tr key={r.reportId || i}>
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