import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "jspdf-autotable";
import "../../styles/DownloadAnnualReports.css";
import { generateAnnualPDF } from "../../utils/generateannualpdf";

const DownloadReport = () => {
  const [reports, setReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [searchYear, setSearchYear] = useState("");
  const [searchOrg, setSearchOrg] = useState("");
  const [searchDept, setSearchDept] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Only load during fetch
  const [downloading, setDownloading] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Hardcoded department list
  const departments = [
    "Mechanical and Automation",
    "Computer Science and Engineering",
    "Civil Engineering",
    "Electronics and Telecommunication Engineering",
    "Electronics and Computer Science Engineering",
    "Information Technology",
    "General Engineering",
    "central",
  ];

  // Hardcoded academic years
  const academicYears = [
    "2025-26",
    "2024-25",
    "2023-24",
    "2022-23",
    "2021-22",
  ].sort().reverse();

  // Fetch organizations when department changes
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!searchDept) {
        setOrganizations([]);
        setSearchOrg("");
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/reports/annual/unique/orgs?department=${encodeURIComponent(searchDept)}`
        );
        if (!response.ok) throw new Error("Failed to fetch organizations");
        const orgsData = await response.json();
        setOrganizations(orgsData.sort());
        setSearchOrg("");
        setError("");
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizations([]);
        setSearchOrg("");
        setError("Failed to load organizations. Please select a different department or try again.");
      }
    };

    fetchOrganizations();
  }, [searchDept]);

  // Handle search button click
  const handleSearch = async () => {
    if (!searchDept || !searchYear || !searchOrg) {
      setModalMessage("Please select Department, Academic Year, and Organization before searching.");
      setShowModal(true);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        department: searchDept,
        academicYear: searchYear,
        organizedBy: searchOrg,
      });
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/annual?${params}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch reports");
      }
      const data = await response.json();
      console.log("📦 Filtered reports from backend:", data);
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

  const handleBack = () => {
    navigate("/dashboard-office");
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
  };

  // Group by Department → Club + Year (no sorting needed, backend handles it)
  const groupedByDept = {};
  reports.forEach((report) => {
    const deptKey = report.department || "Unknown Department";
    if (!groupedByDept[deptKey]) groupedByDept[deptKey] = {};

    const clubKey = `${report.organizedBy} - ${report.academicYear}`;
    if (!groupedByDept[deptKey][clubKey]) groupedByDept[deptKey][clubKey] = [];
    groupedByDept[deptKey][clubKey].push(report);
  });

  // Handle download button click
  const handleDownload = async (club, year, reports, clubKey) => {
    setDownloading((prev) => ({ ...prev, [clubKey]: true }));
    try {
      await generateAnnualPDF(club, year, reports);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading((prev) => ({ ...prev, [clubKey]: false }));
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

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Please wait while we load reports</p>
        </div>
      )}

      <button className="back-btn" onClick={handleBack}>
        ↩
      </button>
      <h2>Office Annual Reports</h2>

      <div className="search">
        <select
          className="search-bar"
          value={searchDept}
          onChange={(e) => setSearchDept(e.target.value)}
        >
          <option value="">Select Department</option>
          {departments.map((dept, idx) => (
            <option key={idx} value={dept}>
              {dept}
            </option>
          ))}
        </select>

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
          disabled={!searchDept}
        >
          <option value="">Select Organization</option>
          {organizations.length === 0 ? (
            <option value="" disabled>
              {searchDept ? "No organizations available" : "Select a department first"}
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
          <p>
            {searchDept && searchYear && searchOrg
              ? "No reports found for the selected filters."
              : "Please select filters and click Search."}
          </p>
        </div>
      )}

      {!isLoading &&
        Object.entries(groupedByDept).map(([dept, clubs], deptIdx) => (
          <div key={deptIdx} className="department-group">
            <h2 className="department-heading">{dept}</h2>

            {Object.entries(clubs).map(([clubYear, reports], clubIdx) => {
              const [club, year] = clubYear.split(" - ");
              return (
                <div key={clubIdx} className="report-group">
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
                        <th>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r, i) => (
                        <tr key={r.reportId || i}>
                          <td>{i + 1}</td>
                          <td>{r.eventName}</td>
                          <td>{r.organizedBy || "N/A"}</td>
                          <td>{r.academicYear || "N/A"}</td>
                          <td>{r.department || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="download-container">
                    <button
                      className="download-btn"
                      onClick={() => handleDownload(club, year, reports, clubYear)}
                      disabled={downloading[clubYear]}
                    >
                      {downloading[clubYear]
                        ? "Generating..."
                        : `Download ${club} ${year} Report`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
};

export default DownloadReport;