import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import DepartmentEmployees from './pages/DepartmentEmployees';
import Announcements from './pages/Announcements';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import SalaryDetails from './pages/SalaryDetails';

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
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<ProtectedRoute roles={['Admin', 'HR']}><Employees /></ProtectedRoute>} />
          <Route path="departments" element={<ProtectedRoute roles={['Admin', 'HR']}><Departments /></ProtectedRoute>} />
          <Route path="departments/:departmentName" element={<ProtectedRoute roles={['Admin', 'HR']}><DepartmentEmployees /></ProtectedRoute>} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="salary" element={<SalaryDetails />} />
          <Route path="salary/:id" element={<ProtectedRoute roles={['Admin', 'HR']}><SalaryDetails /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
