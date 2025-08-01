import { useState, useEffect } from "react";
import { useAuth } from "../../../supabase/auth";
import AdminLogin from "../admin/AdminLogin";
import AdminDashboard from "../admin/AdminDashboard";
import { LoadingScreen } from "../ui/loading-spinner";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (loading) {
    return <LoadingScreen text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
