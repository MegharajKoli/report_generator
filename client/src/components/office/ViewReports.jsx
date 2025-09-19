import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { generateReportPDF } from "../../utils/generateReportPDF";
import "../../styles/ViewReports.css";

function ViewReports() {
  const { user } = useContext(AuthContext) || {};
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingReportId, setDownloadingReportId] = useState(null);

  // Fixed Department List
  const departments = [
    "Mechanical and Automation",
    "Computer Science and Engineering",
    "Civil Engineering",
    "Electronics and Telecommunication Engineering",
    "Electronics and Computer Science Engineering",
    "Information Technology"
  ];

  useEffect(() => {
    async function fetchReports() {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found.");

        // Fetch reports
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!Array.isArray(res.data)) {
          throw new Error("Invalid response format: Expected an array of reports.");
        }
        setReports(res.data);
        setFilteredReports(res.data);

        console.log("Fetched reports:", res.data.length, "reports");
      } catch (err) {
        console.error("Error fetching reports:", err.message, err.response?.data);
        setError(`Failed to load reports: ${err.response?.data?.error || err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, [user?.role]);

  useEffect(() => {
    // Filter reports based on search term and selected department
    const filtered = reports.filter(report => {
      const matchesSearch = report.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           report.organizedBy?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesDepartment = selectedDepartment
        ? (report.department?.name || report.department || "N/A") === selectedDepartment
        : true;
      return matchesSearch && matchesDepartment;
    });
    setFilteredReports(filtered);
  }, [searchTerm, selectedDepartment, reports]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value || "");
  };

  const handleDownload = async (reportId) => {
    setDownloadingReportId(reportId);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");
      const res = await axios.get(`http://localhost:3001/api/reports?reportId=${reportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data || Object.keys(res.data).length === 0) {
        throw new Error("Invalid or empty report data received from server.");
      }
      console.log("Report data for PDF:", {
        reportId,
        eventName: res.data.eventName,
        department: res.data.department?.name || res.data.department,
      });
      await generateReportPDF(res.data);
      setSuccess("PDF generated successfully!");
    } catch (err) {
      console.error("Error generating PDF:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(`Failed to generate PDF: ${err.message}`);
    } finally {
      setDownloadingReportId(null);
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
          Please wait while we load reports
        </p>
      </div>
    );
  }

  return (
    <div className="view-report">
      <h2>Reports for {user?.department?.name || user?.department || "Department"}</h2>
      {error && <div className="error" style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{error}</div>}
      {success && <div className="success" style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>{success}</div>}
      
      {/* Search and Filter Controls */}
      <div className="report-controls">
        <input
          type="text"
          placeholder="Search by event name..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
          style={{ fontFamily: "Times New Roman", fontSize: "12px", padding: "8px", marginRight: "10px" }}
        />
        {user?.role === "office" && (
          <select
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            className="department-filter"
            style={{ fontFamily: "Times New Roman", fontSize: "12px", padding: "8px" }}
          >
            <option value="">All Departments</option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>{dept}</option>
            ))}
          </select>
        )}
      </div>

      {filteredReports.length === 0 ? (
        <div className="no-reports" style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ fontFamily: "Times New Roman", fontSize: "16px", color: "#666" }}>
            No reports found
          </p>
        </div>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Department</th>
              <th>Organized By</th>
              <th>Academic Year</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report._id}>
                <td>{report.eventName || "N/A"}</td>
                <td>{report.department?.name || report.department || "N/A"}</td>
                <td>{report.organizedBy || "N/A"}</td>
                <td>{report.academicYear || "N/A"}</td>
                <td>
                  <button
                    type="button"
                    className="download-btn"
                    disabled={downloadingReportId === report._id}
                    onClick={() => handleDownload(report._id)}
                    style={{ fontFamily: "Times New Roman", fontSize: "12px" }}
                  >
                    {downloadingReportId === report._id ? "Generating..." : "Download PDF"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ViewReports;