import axios from "axios";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config/config";
import { useUser } from "../../../context/UserContext";
import {
  MdSpaceDashboard,
  MdEvent,
  MdAddCircleOutline,
  MdPeople,
  MdLogout,
} from "react-icons/md";
import { FaUserSlash } from "react-icons/fa";
import "./OrganiserLayout.css";

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/v1/auth`,
  withCredentials: true,
});

export const OrganiserLayout = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogout = async () => {
    try {
      await authApi.post("/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="org-layout-wrapper">
      <aside className="org-sidebar">
        <div className="org-sidebar-brand-block">
          <span className="org-sidebar-pill-badge">ORGANISER PORTAL</span>
          <h3 className="org-sidebar-brand-title">CityPass</h3>
        </div>

        <nav className="org-sidebar-menu-list">
          <NavLink
            to="/organiser"
            end
            className={({ isActive }) =>
              isActive ? "org-sidebar-nav-item active" : "org-sidebar-nav-item"
            }
          >
            <div className="org-nav-icon-wrapper">
              <MdSpaceDashboard className="org-sidebar-icon" />
            </div>
            <span className="org-sidebar-label">Dashboard</span>
          </NavLink>

          <NavLink
            to="/organiser/events"
            className={({ isActive }) =>
              isActive ? "org-sidebar-nav-item active" : "org-sidebar-nav-item"
            }
          >
            <div className="org-nav-icon-wrapper">
              <MdEvent className="org-sidebar-icon" />
            </div>
            <span className="org-sidebar-label">My Events</span>
          </NavLink>

          <NavLink
            to="/organiser/events?create=1"
            className={({ isActive }) =>
              isActive
                ? "org-sidebar-nav-item org-create-item active"
                : "org-sidebar-nav-item org-create-item"
            }
          >
            <div className="org-nav-icon-wrapper">
              <MdAddCircleOutline className="org-sidebar-icon" />
            </div>
            <span className="org-sidebar-label">Create Event</span>
          </NavLink>

          <NavLink
            to="/organiser/attendees"
            className={({ isActive }) =>
              isActive ? "org-sidebar-nav-item active" : "org-sidebar-nav-item"
            }
          >
            <div className="org-nav-icon-wrapper">
              <MdPeople className="org-sidebar-icon" />
            </div>
            <span className="org-sidebar-label">Bookings & Attendees</span>
          </NavLink>

          <NavLink
            to="/organiser/deactivate"
            className={({ isActive }) =>
              isActive ? "org-sidebar-nav-item active" : "org-sidebar-nav-item"
            }
          >
            <div className="org-nav-icon-wrapper">
              <FaUserSlash className="org-sidebar-icon" />
            </div>
            <span className="org-sidebar-label">Deactivate Account</span>
          </NavLink>

          <button
            type="button"
            className="org-sidebar-nav-item org-logout-item"
            onClick={() => void handleLogout()}
          >
            <div className="org-nav-icon-wrapper">
              <MdLogout className="org-sidebar-icon" />
            </div>
            <span className="org-sidebar-label">Log Out</span>
          </button>
        </nav>

        <div className="org-sidebar-footer-card">
          <div className="org-sidebar-system-dot" />
          <span>Organiser Console Active</span>
        </div>
      </aside>

      <main className="org-main-viewport">
        <Outlet />
      </main>
    </div>
  );
};