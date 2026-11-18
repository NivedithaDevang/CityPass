import { useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AdminPinModal from "../components/Admin/AdminPinModal/AdminPinModal";

interface AdminProtectedRouteProps {
  allowedRoles?: string[];
}

const AdminProtectedRoute = ({
  allowedRoles = ["ADMIN", "SUPER_ADMIN"],
}: AdminProtectedRouteProps) => {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_pin_verified") === "true";
  });

  // 1. Loading State
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "sans-serif",
          fontSize: "16px",
          color: "#475569",
        }}
      >
        Loading admin session...
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    console.warn("[AdminProtectedRoute] Access denied: User is not logged in.");
    return <Navigate to="/?login=true" replace />;
  }

  const normalizedUserRole = String(user.role || "")
    .toUpperCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  const userRole =
    normalizedUserRole === "SUPERADMIN"
      ? "SUPER_ADMIN"
      : normalizedUserRole;
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    role.toUpperCase().trim().replace(/[\s-]+/g, "_")
  );

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const hasAdminRole = normalizedAllowedRoles.includes(userRole);

  // 3. Unauthorized Role
  if (!hasAdminRole) {
    console.warn(
      `[AdminProtectedRoute] Forbidden: User role "${userRole}" is not authorized.`
    );
    return <Navigate to="/" replace />;
  }

  // 4. Super Admin PIN Verification Gate
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

  // 5. Authorized
  return <Outlet />;
};

export default AdminProtectedRoute;