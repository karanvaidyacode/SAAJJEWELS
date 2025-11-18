import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    
    // If no admin token, redirect to admin login
    if (!adminToken) {
      navigate("/admin/login");
    }
  }, [navigate]);

  // Check if admin token exists
  const adminToken = localStorage.getItem("adminToken");
  
  // If no admin token, don't render children
  if (!adminToken) {
    return null;
  }

  return children;
};

export default AdminProtectedRoute;