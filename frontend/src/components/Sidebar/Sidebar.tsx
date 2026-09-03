import React, { useState } from "react";
import type { User } from "../../types/auth";
import "./Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);

  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }

    return "U";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? "show" : ""}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`sidebar-drawer ${isOpen ? "open" : ""}`}>

        {/* Header */}
        <div className="sidebar-top">
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Profile */}
        <div className="profile-section">
          <div className="profile-avatar">
            {getInitial()}
          </div>

          <div className="profile-details">
            <h2>{user?.name || "User"}</h2>

            <p>{user?.email || ""}</p>

            <span className="role-badge">
              USER
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="sidebar-divider" />

        {/* Menu */}
        <div className="sidebar-content">

          {/* Account */}
          <button
            className="sidebar-menu-item"
            onClick={onClose}
          >
            <span className="menu-icon">👤</span>
            <span>My Account</span>
          </button>

          {/* Bookings */}
          <div className="booking-section">

            <button
              className="sidebar-menu-item booking-button"
              onClick={() =>
                setIsBookingsOpen((prev) => !prev)
              }
            >
              <div className="menu-left">
                <span className="menu-icon">🎟️</span>
                <span>My Bookings</span>
              </div>

              <span
                className={`booking-arrow ${
                  isBookingsOpen ? "rotate" : ""
                }`}
              >
                ›
              </span>
            </button>

            {/* Booking Categories */}
            <div
              className={`booking-categories ${
                isBookingsOpen ? "expanded" : ""
              }`}
            >
              <a href="/bookings/events" onClick={onClose}>
                Events
              </a>

              <a href="/bookings/activities" onClick={onClose}>
                Activities
              </a>

              <a href="/bookings/concerts" onClick={onClose}>
                Concerts
              </a>
            </div>
          </div>

          {/* Settings */}
          <button
            className="sidebar-menu-item"
            onClick={onClose}
          >
            <span className="menu-icon">⚙️</span>
            <span>Settings</span>
          </button>

        </div>

        {/* Bottom */}
        <div className="sidebar-bottom">

          <button
            className="logout-btn"
            onClick={onLogout}
          >
            <span>↪</span>
            Log Out
          </button>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
