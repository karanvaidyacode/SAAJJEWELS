import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../lib/api";

const AdminProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");

    // If no admin token, redirect to admin login immediately
    if (!adminToken) {
      setChecking(false);
      navigate("/admin/login");
      return;
    }

    // Verify the token against the backend
    fetchApi("/api/admin/verify-token", {
      method: "POST",
      headers: { "x-admin-token": adminToken },
    })
      .then((response) => {
        if (response && response.valid) {
          setVerified(true);
        } else {
          // Token invalid — clear it and redirect
          localStorage.removeItem("adminToken");
          navigate("/admin/login");
        }
      })
      .catch(() => {
        // Verification failed — clear stale token and redirect
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  // Show nothing while verifying
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  // Only render children after verification succeeds
  if (!verified) {
    return null;
  }

  return children;
};

export default AdminProtectedRoute;