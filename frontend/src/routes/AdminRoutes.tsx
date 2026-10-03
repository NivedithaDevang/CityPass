import { useState, useEffect } from "react";
import { Routes, Route, NavLink, Outlet, Navigate } from "react-router-dom";
import { MdSpaceDashboard } from "react-icons/md";
import { BsPersonFillCheck, BsCalendar2EventFill } from "react-icons/bs";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FaTag } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import Events from "../pages/Admin/Events/Events";
import AdminHome from "../pages/Admin/AdminHome/AdminHome";
import OrganiserRequests from "../pages/Admin/OrganiserRequests/OrganiserRequests";
import Cities from "../pages/Admin/Cities/Cities";
import Categories from "../pages/Admin/Categories/Categories";
import Users from "../pages/Admin/Users/Users";
import Organisers from "../pages/Admin/Organisers/Organisers";
import { fetchAdminOrganiserRequests } from "../services/adminService";
import Navbar from "../components/Navbar/Navbar";
import Tickets from "../pages/Admin/Tickets/Tickets";
function AdminLayout() {
  const [pendingReqCount, setPendingReqCount] = useState(0);

  useEffect(() => {
    const getBadgeCount = async () => {
      try {
        const res = await fetchAdminOrganiserRequests();
        const list = Array.isArray(res) ? res : res?.requests || res?.data || [];
        const pending = list.filter(
          (r: any) => r.status?.toUpperCase() === "PENDING"
        );
        setPendingReqCount(pending.length);
      } catch (err) {
        console.error("Failed to load badge count:", err);
      }
    };

    getBadgeCount();
  }, []);

  return (
    <div className="admin-layout-wrapper">
      <Navbar />
      {/* Persistent Left Sidebar */}
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


          <NavLink
            to="/admin/organisers"
            className={({ isActive }) =>
              isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
            }
          >
            <div className="nav-icon-wrapper">
              <IoPerson className="sidebar-icon" />
            </div>
            <span className="sidebar-label">Organisers</span>
          </NavLink>

          <NavLink
            to="/admin/tickets"
            className={({ isActive }) =>
              isActive ? "sidebar-nav-item active" : "sidebar-nav-item"
            }
          >
            <div className="nav-icon-wrapper">
              <IoPerson className="sidebar-icon" />
            </div>
            <span className="sidebar-label">Tickets</span>
          </NavLink>


        </nav>

        

        <div className="sidebar-footer-card">
          <div className="sidebar-system-dot" />
          <span>System Healthy</span>
        </div>
      </aside>

      {/* Target area where pages swap inline without refreshing */}
      <main className="admin-main-viewport">
        <Outlet />
      </main>
    </div>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="organiser-requests" element={<OrganiserRequests />} />
        <Route path="events" element={<Events />} />
        <Route path="cities" element={<Cities />} />
        <Route path="categories" element={<Categories />} />
        <Route path="users" element={<Users />} />
        <Route path="organisers" element={<Organisers />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export default AdminRoutes;