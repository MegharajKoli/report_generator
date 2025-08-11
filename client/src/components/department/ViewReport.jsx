import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiDownload, FiEdit, FiTrash2 } from "react-icons/fi";
import { generateReportPDF } from "../../utils/generateReportPDF";
import { useNavigate } from "react-router-dom";
import "../../styles/viewreports.css";  

const ViewReport = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/reports/department", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setReports(res.data);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      }
    };

    fetchReports();
  }, []);

  const downloadReport = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:3001/api/reports?reportId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reportData = res.data;
      await generateReportPDF(reportData);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const editReport = (id) => {
    navigate(`/dashboard-dept/edit-report/${id}`);
  };

  const deleteReport = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this report?");
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:3001/api/reports/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setReports((prevReports) => prevReports.filter((r) => r._id !== id));
      alert("Report deleted successfully.");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete the report.");
    }
  };

  const filteredReports = reports.filter(
    (report) =>
      report.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.academicYear.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.organizedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-report-container">
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by event name"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredReports.length === 0 ? (
        <p className="no-reports">No reports found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Organized By</th>
                <th>Academic Year</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report._id}>
                  <td>{report.eventName}</td>
                  <td>{report.organizedBy}</td>
                  <td>{report.academicYear}</td>
                  <td className="action-buttons-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => downloadReport(report._id)}
                        title="Download"
                        aria-label="Download report"
                        className="action-btn download-btn"
                      >
                        <FiDownload size={16} />
                      </button>
                      <button
                        onClick={() => editReport(report._id)}
                        title="Edit"
                        aria-label="Edit report"
                        className="action-btn edit-btn"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => deleteReport(report._id)}
                        title="Delete"
                        aria-label="Delete report"
                        className="action-btn delete-btn"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewReport;
