import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import DashboardDept from "./pages/DashboardDept";
import DashboardOffice from "./pages/DashboardOffice";
import Unauthorized from "./pages/Unauthorized";

import PrivateRoute from "./utils/PrivateRoute";
import RoleBasedRoute from "./utils/RoleBasedRoute";

import CreateReport from "./components/department/CreateReport";
import DownloadAnnualReport from "./components/department/DownloadAnnualReport";
import ViewReport from "./components/department/ViewReport";

import DownloadReport from "./components/office/DownloadReport";
import ViewReports from "./components/office/ViewReports";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Unauthorized Message */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Department Dashboard (Parent) */}
        <Route
          path="/dashboard-dept"
          element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={["department"]}>
                <DashboardDept />
              </RoleBasedRoute>
            </PrivateRoute>
          }
        >
          {/* Nested Routes inside DashboardDept */}
          <Route path="create-report" element={<CreateReport />} />
          <Route path="view-report" element={<ViewReport />} />
          <Route path="download-report" element={<DownloadAnnualReport />} />
        </Route>

        {/* Office Dashboard (Parent) */}
        <Route
          path="/dashboard-office"
          element={
            <PrivateRoute>
              <RoleBasedRoute allowedRoles={["office"]}>
                <DashboardOffice />
              </RoleBasedRoute>
            </PrivateRoute>
          }
        >
          
          <Route path="view-reports" element={<ViewReports />} />
          <Route path="download-reports" element={<DownloadReport />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
