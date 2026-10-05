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

  // Check whether the Super Admin key has already been verified in this browser session.
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_pin_verified") === "true";
  });


  if (loading) {
    return <div>Loading...</div>;
  }


  if (!user) {
    return <Navigate to="/" replace />;
  }


  const userRole = (user.role || "").toUpperCase().trim();

  const normalizedAllowedRoles = allowedRoles.map((role) =>
    role.toUpperCase().trim()
  );


  const isSuperAdmin = userRole === "SUPER_ADMIN";


  const isAdmin =
    normalizedAllowedRoles.includes(userRole);


  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isSuperAdmin && !isPinVerified) {
    return (
      <AdminPinModal
        isOpen={true}
        onSuccess={() => {

          sessionStorage.setItem(
            "admin_pin_verified",
            "true"
          );

          setIsPinVerified(true);
        }}
        onCancel={() => {
          // If user cancels the secret key modal,
          // send them back to the homepage.
          navigate("/", {
            replace: true,
          });
        }}
      />
    );
  }

  return <Outlet />;
};

export default AdminProtectedRoute;