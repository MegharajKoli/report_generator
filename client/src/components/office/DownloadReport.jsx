import React, { useEffect, useState } from "react";
import "jspdf-autotable";
import "../../styles/DownloadAnnualReports.css";
import { generateAnnualPDF } from "../../utils/generateannualpdf";

const DownloadReport = () => {
  const [reports, setReports] = useState([]);
  const [searchYear, setSearchYear] = useState("");
  const [searchOrg, setSearchOrg] = useState("");
  const [searchDept, setSearchDept] = useState("");

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
      }
    };

    fetchReports();
  }, []);

  // 🔍 filter by dept + org + year
  const filteredReports = reports.filter((report) => {
    const matchesDept = report.department?.toLowerCase().includes(searchDept.toLowerCase());
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

  return (
    <div className="annual-reports-container">
      <h2>Office Annual Reports</h2>

      {/* 🔍 Search */}
      <div className="search">
        <input
          type="text"
          placeholder="Search by Department"
          className="search-bar"
          value={searchDept}
          onChange={(e) => setSearchDept(e.target.value)}
        />
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

        <input
          type="text"
          placeholder="Search by Organization"
          className="search-bar"
          value={searchOrg}
          onChange={(e) => setSearchOrg(e.target.value)}
        />
      </div>

      {/* 📋 Grouped Reports */}
      {Object.entries(groupedByDept).map(([dept, clubs], deptIdx) => (
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
                      <th>Department</th> {/* ✅ Added Department column */}
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
                    onClick={() => generateAnnualPDF(club, year, reports)}
                  >
                    Download {club} {year} Report
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
