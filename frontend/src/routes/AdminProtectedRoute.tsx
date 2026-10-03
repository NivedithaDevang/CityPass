import React, { useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AdminPinModal from "../components/Admin/AdminPinModal/AdminPinModal";

interface AdminProtectedRouteProps {
  allowedRoles?: string[];
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  allowedRoles = [
    "ADMIN",
    "SUPER_ADMIN",
    "admin",
    "superadmin",
  ],
}) => {
  const { user } = useUser();
  const navigate = useNavigate();

  // All React Hooks must be declared at top-level before any conditional returns
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_pin_verified") === "true";
  });

  const storedUser =
    user || JSON.parse(localStorage.getItem("user") || "null");

  if (!storedUser) {
    return <Navigate to="/" replace />;
  }

  const userEmail = (storedUser.email || "").toLowerCase().trim();
  const userRole = (storedUser.role || "").toUpperCase().trim();

  const isSuperAdmin =
    userRole === "SUPER_ADMIN" ||
    userEmail === import.meta.env.VITE_ADMIN_EMAIL.toLowerCase();

  const isAdmin =
    allowedRoles.map((role) => role.toUpperCase()).includes(userRole) ||
    isSuperAdmin;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Super Admin security check
  if (isSuperAdmin && !isPinVerified) {
    return (
      <AdminPinModal
        isOpen={true}
        onSuccess={() => {
          sessionStorage.setItem("admin_pin_verified", "true");
          setIsPinVerified(true);
        }}
        onCancel={() => {
          navigate("/", { replace: true });
        }}
      />
    );
  }

  return <Outlet />;
};

export default AdminProtectedRoute;