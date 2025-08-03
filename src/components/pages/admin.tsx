import { useState, useEffect } from "react";
import { useAuth } from "../../../supabase/auth";
import AdminLogin from "../admin/AdminLogin";
import AdminDashboard from "../admin/AdminDashboard";
import { LoadingScreen } from "../ui/loading-spinner";
import ConnectionDebug from "../debug/ConnectionDebug";

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check local storage for admin authentication first
    const adminAuth = localStorage.getItem("adminAuthenticated");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    } else if (user && user.email === "admin@portfolio.dev") {
      // Also check if user is authenticated via Supabase with admin email
      setIsAuthenticated(true);
      localStorage.setItem("adminAuthenticated", "true");
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    // Clear both Supabase session and local storage
    localStorage.removeItem("adminAuthenticated");
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setIsAuthenticated(false);
  };

  if (loading) {
    return <LoadingScreen text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <ConnectionDebug />
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
