import React, { useEffect, useState } from "react";
import "jspdf-autotable";
import "../../styles/DownloadAnnualReports.css";
import { generateAnnualPDF } from "../../utils/generateannualpdf";

const DownloadReport = () => {
  const [reports, setReports] = useState([]);
  const [searchYear, setSearchYear] = useState("");
  const [searchOrg, setSearchOrg] = useState("");
  const [searchDept, setSearchDept] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
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

  // 🔍 filter by dept + org + year
  const filteredReports = reports.filter((report) => {
    const matchesDept = searchDept ? report.department === searchDept : true;
    const matchesEvent = searchYear ? report.academicYear === searchYear : true;
    const matchesOrg = report.organizedBy?.toLowerCase().includes(searchOrg.toLowerCase());
    return matchesDept && matchesEvent && matchesOrg;
  });

  // 🔢 sort by department > academic year (latest first) > event name
  const sortedReports = [...filteredReports].sort((a, b) => {
    const deptA = (a.department || "").localeCompare(b.department || "");
    const deptB = (b.department || "").localeCompare(a.department || "");
    if (deptA !== deptB) return deptA - deptB;

    const yearA = parseInt(a.academicYear?.split("-")[0], 10);
    const yearB = parseInt(b.academicYear?.split("-")[0], 10);
    if (yearA !== yearB) return yearB - yearA;

    return (a.eventName || "").localeCompare(b.eventName || "");
  });

  // 📦 group by Department → Club + Year
  const groupedByDept = {};
  sortedReports.forEach((report) => {
    const deptKey = report.department || "Unknown Department";
    if (!groupedByDept[deptKey]) groupedByDept[deptKey] = {};

    const clubKey = `${report.organizedBy} - ${report.academicYear}`;
    if (!groupedByDept[deptKey][clubKey]) groupedByDept[deptKey][clubKey] = [];
    groupedByDept[deptKey][clubKey].push(report);
  });

  // 📌 Unique academic years for dropdown
  const academicYears = [...new Set(reports.map(r => r.academicYear))].sort().reverse();

  // 📌 Fixed Department List
  const departments = [
    "Mechanical and Automation",
    "Computer Science and Engineering",
    "Civil Engineering",
    "Electronics and Telecommunication Engineering",
    "Electronics and Computer Science Engineering",
    "Information Technology"
  ];

  // Handle download button click
  const handleDownload = async (club, year, reports, clubKey) => {
    setDownloading((prev) => ({ ...prev, [clubKey]: true }));
    try {
      await generateAnnualPDF(club, year, reports);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloading((prev) => ({ ...prev, [clubKey]: false }));
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
    <div className="annual-reports-container">
      <h2>Office Annual Reports</h2>

      {/* 🔍 Search */}
      <div className="search">
        {/* Department Dropdown */}
        <select
          className="search-bar"
          value={searchDept}
          onChange={(e) => setSearchDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((dept, idx) => (
            <option key={idx} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Academic Year Dropdown */}
        <select
          className="search-bar"
          value={searchYear}
          onChange={(e) => setSearchYear(e.target.value)}
        >
          <option value="">All Academic Years</option>
          {academicYears.map((year, idx) => (
            <option key={idx} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Organization Search */}
        <input
          type="text"
          placeholder="Search by Organization"
          className="search-bar"
          value={searchOrg}
          onChange={(e) => setSearchOrg(e.target.value)}
        />
      </div>

      {/* 📋 Grouped Reports */}
      {Object.keys(groupedByDept).length === 0 ? (
        <div className="no-reports" style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ fontFamily: "Times New Roman", fontSize: "16px", color: "#666" }}>
            No reports found
          </p>
        </div>
      ) : (
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
                        <tr key={r._id || i}>
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
                      {downloading[clubYear] ? "Generating..." : `Download ${club} ${year} Report`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};

export default DownloadReport;