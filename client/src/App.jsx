import { useContext } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import Layout from "./components/Layout";
import { AuthContext } from "./contexts/AuthContext";
import Announcements from "./pages/Announcements";
import Attendance from "./pages/Attendance";
import Dashboard from "./pages/Dashboard";
import DepartmentEmployees from "./pages/DepartmentEmployees";
import Departments from "./pages/Departments";
import Employees from "./pages/Employees";
import Leaves from "./pages/Leaves";
import Login from "./pages/Login";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            path="employees"
            element={
              <ProtectedRoute roles={["Admin", "HR"]}>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments"
            element={
              <ProtectedRoute roles={["Admin", "HR"]}>
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments/:departmentName"
            element={
              <ProtectedRoute roles={["Admin", "HR"]}>
                <DepartmentEmployees />
              </ProtectedRoute>
            }
          />
          <Route path="announcements" element={<Announcements />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leaves" element={<Leaves />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
