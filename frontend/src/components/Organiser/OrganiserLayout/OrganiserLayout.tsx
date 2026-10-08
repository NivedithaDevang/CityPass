import axios from "axios";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config/config";
import {CalendarDays, LayoutDashboard, LogOut, Plus, Settings, Users } from "lucide-react";
import "./OrganiserLayout.css";

const authApi = axios.create({ 
  baseURL: `${API_BASE_URL}/v1/auth`, 
  withCredentials: true 
});

export const OrganiserLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!window.confirm("Log out of your organiser account?")) return;
    try {
      await authApi.post("/logout");
      navigate("/", { replace: true });
    } catch {
      window.alert("Could not log out. Please try again.");
    }
  };

  return (
    <div className="org-container">
      <aside className="org-sidebar">
        <NavLink to="/organiser" end className="org-brand">
        <span>
            
            <small>ORGANISER PANEL</small>
            <h3>CityPass</h3>
            </span>
            </NavLink>
        <div className="org-nav-label">WORKSPACE</div>
        <nav className="org-nav">
          <NavLink to="/organiser" end>
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
          </NavLink>

          <NavLink to="/organiser/events">
          <CalendarDays size={17} />
          <span>My events</span>
          </NavLink>

          <NavLink to="/organiser/events?create=1" className={({ isActive }) => 
            `org-create-nav ${isActive ? "active" : ""}`}>
              <Plus size={17} />
              <span>Create event</span>
              </NavLink>

          <NavLink to="/organiser/attendees">
          <Users size={17} />
          <span>Bookings & attendees</span>
          </NavLink>

        </nav>

        <div className="org-sidebar-bottom">
          <NavLink to="/settings/profile">
          <Settings size={17} />
          <span>Profile & settings</span>
          </NavLink>

          <button className="org-logout-btn" onClick={() => 
            void handleLogout()}>
              <LogOut size={17} />
              <span>Log out</span>
              </button>

          <span className="org-sidebar-caption">CITYPASS ORGANISER</span>
        </div>
      </aside>
      <main className="org-main-content">
        <div className="org-content-body">
          <Outlet />
          </div>
          </main>
    </div>
  );
};