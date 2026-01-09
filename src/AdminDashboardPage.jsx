// Admin Dashboard Page Wrapper
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "./components/AdminDashboard";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = sessionStorage.getItem("adminLoggedIn");
    if (!isLoggedIn) {
      // Redirect to admin login
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminLoggedIn");
    sessionStorage.removeItem("adminUsername");
    navigate("/");
  };

  return <AdminDashboard onLogout={handleLogout} />;
}
