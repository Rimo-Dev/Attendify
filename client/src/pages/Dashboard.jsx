import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";
import HRDashboard from "./HRDashboard";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  if (user.role === "Admin") {
    return <AdminDashboard />;
  }

  if (user.role === "HR") {
    return <HRDashboard />;
  }

  return <EmployeeDashboard />;
};

export default Dashboard;
