import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiDownload, FiEdit, FiTrash2 } from "react-icons/fi";
import { generateReportPDF } from "../../utils/generateReportPDF";
import { useNavigate } from "react-router-dom";
import "../../styles/viewreports.css";

const ViewReport = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadingReportId, setDownloadingReportId] = useState(null);
  const [loading, setLoading] = useState(false); // New loading state
  const navigate = useNavigate();

 const handleBack = () => {
    navigate("/dashboard-dept");
  };

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true); // Set loading to true before fetching
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/department`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setReports(res.data);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchReports();
  }, []);

  const downloadReport = async (id) => {
    setDownloadingReportId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports?reportId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reportData = res.data;
      await generateReportPDF(reportData);
    } catch (err) {
      console.error("Download failed:", err);
      setErrorMessage("Failed to download PDF. Please try again.");
      setShowFailureModal(true);
    } finally {
      setDownloadingReportId(null);
    }
  };

  const editReport = (id) => {
    navigate(`/dashboard-dept/edit-report/${id}`);
  };

  const initiateDelete = (id) => {
    setReportToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/reports/${reportToDelete}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setReports((prevReports) => prevReports.filter((r) => r._id !== reportToDelete));
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Delete failed:", err);
      setErrorMessage("Failed to delete the report.");
      setShowConfirmModal(false);
      setShowFailureModal(true);
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setReportToDelete(null);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate("/dashboard-dept/view-report");
  };

  const closeFailureModal = () => {
    setShowFailureModal(false);
  };

  const filteredReports = reports.filter(
    (report) =>
      report.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.academicYear.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.organizedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-report-container">
          <button
      onClick={handleBack}
      style={{
        padding: "10px 20px",
        marginBottom: "10px",
        backgroundColor: "#3B82F6",
        color: "black",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "16px",
      }}
      onMouseOver={(e) => (e.target.style.backgroundColor = "#2563EB")}
      onMouseOut={(e) => (e.target.style.backgroundColor = "#3B82F6")}
    >
      ↩
    </button>
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search by event name"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-spinner">
          <p>Loading reports...</p>
          {/* Basic CSS spinner */}
          <div className="spinner"></div>
        </div>
      ) : filteredReports.length === 0 ? (
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
                        disabled={downloadingReportId === report._id}
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
                        onClick={() => initiateDelete(report._id)}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal">
          <div className="modal-content" style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
            <p>Are you sure you want to delete this report?</p>
            <div className="modal-buttons">
              <button onClick={confirmDelete} style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
                Confirm
              </button>
              <button
                onClick={closeConfirmModal}
                style={{ fontFamily: "Times New Roman", fontSize: "12px", background: "green" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal">
          <div className="modal-content" style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
            <p>Report Deleted Successfully.</p>
            <button onClick={closeSuccessModal} style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Failure Modal */}
      {showFailureModal && (
        <div className="modal">
          <div className="modal-content" style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
            <p>{errorMessage}</p>
            <button onClick={closeFailureModal} style={{ fontFamily: "Times New Roman", fontSize: "12px" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewReport;