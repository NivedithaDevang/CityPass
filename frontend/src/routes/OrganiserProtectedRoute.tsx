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

    if (user.role !== "ORGANIZER") {
        return <Navigate to="/" replace />;
    }

    return (
        
        <>
        
        <Outlet />

        </>
    
    );
};

export default OrganiserProtectedRoute;