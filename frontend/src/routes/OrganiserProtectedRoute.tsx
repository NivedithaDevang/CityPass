import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";

const OrganiserProtectedRoute = () => {

    const { user, loading } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    const userRole = String(user.role || "")
        .toUpperCase()
        .trim()
        .replace(/[\s-]+/g, "_");

    if (userRole !== "ORGANIZER" && userRole !== "ORGANISER") {
        return <Navigate to="/" replace />;
    }

    return (
        
        <>
        
        <Outlet />

        </>
    
    );
};

export default OrganiserProtectedRoute;