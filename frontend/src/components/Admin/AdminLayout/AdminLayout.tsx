import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { MdSpaceDashboard } from "react-icons/md";
import { BsPersonFillCheck, BsCalendar2EventFill } from "react-icons/bs";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FaTag } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import { fetchAdminOrganiserRequests } from "../../../services/adminService";
import "./AdminHome.css";

function AdminLayout() {
  const [pendingReqCount, setPendingReqCount] = useState(0);

  useEffect(() => {
    const getBadgeCount = async () => {
      try {
        const res = await fetchAdminOrganiserRequests();
        const list = Array.isArray(res)
          ? res
          : res?.requests || res?.data || [];
        const pending = list.filter(
          (r: any) => r.status?.toUpperCase() === "PENDING"
        );
        setPendingReqCount(pending.length);
      } catch (err) {
        console.error(err);
      }
    };
    void getBadgeCount();
  }, []);

  return (
    <div className="admin-layout-wrapper">
      {/* Permanent Left Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand-block">
          <span className="sidebar-pill-badge">ADMIN PORTAL</span>
          <h3 className="sidebar-brand-title">CityPass</h3>
        </div>

        <nav className="sidebar-menu-list">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
            }
          >
            <div className="nav-icon-wrapper">
              <MdSpaceDashboard className="sidebar-icon" />
            </div>
            <span className="sidebar-label">Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/organiser-requests"
            className={({ isActive }) =>
              isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
            }
          >
            <div className="nav-icon-wrapper">
              <BsPersonFillCheck className="sidebar-icon" />
            </div>
            <span className="sidebar-label">Organiser Requests</span>
            {pendingReqCount > 0 && (
              <span className="sidebar-count-tag">{pendingReqCount}</span>
            )}
          </NavLink>

          <NavLink
            to="/admin/events"
            className={({ isActive }) =>
              isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
            }
          >
            <div className="nav-icon-wrapper">
              <BsCalendar2EventFill className="sidebar-icon" />
            </div>
            <span className="sidebar-label">Manage Events</span>
          </NavLink>

          <NavLink
            to="/admin/cities"
            className={({ isActive }) =>
              isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
            }
          >
            <div className="nav-icon-wrapper">
              <FaMapMarkerAlt className="sidebar-icon" />
            </div>
            <span className="sidebar-label">Cities</span>
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
            }
          >
            <div className="nav-icon-wrapper">
              <FaTag className="sidebar-icon" />
            </div>
            <span className="sidebar-label">Categories</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
            }
          >
            <div className="nav-icon-wrapper">
              <IoPerson className="sidebar-icon" />
            </div>
            <span className="sidebar-label">Users</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer-card">
          <div className="sidebar-system-dot" />
          <span>System Healthy</span>
        </div>
      </aside>

      {/* Dynamic Viewport (Loads Dashboard, Requests, Cities, etc. here) */}
      <main className="admin-main-viewport">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;