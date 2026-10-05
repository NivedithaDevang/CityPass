import { NavLink, Outlet, useNavigate } from "react-router-dom";
import organiserApi from "../../../services/organiserService";
import "./OrganiserLayout.css";

export const OrganiserLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Ask backend to clear the HttpOnly cookie
      await organiserApi.post("/logout");

      // Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="org-container">
      <aside className="org-sidebar">
        <div className="org-brand">
          <h2>Organiser Hub</h2>
        </div>

        <nav className="org-nav">
          <NavLink
            to="/organiser/home"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/organiser/events"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            My Events
          </NavLink>

          <NavLink
            to="/organiser/attendees"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Booked Users
          </NavLink>
        </nav>

        <button className="org-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="org-main-content">
        <header className="org-header">
          <h3>Welcome Back</h3>
        </header>

        <div className="org-content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};