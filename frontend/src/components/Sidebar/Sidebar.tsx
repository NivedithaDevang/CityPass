import { useState } from "react";
import { useUser } from "../../context/UserContext";
import "./Sidebar.css";


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ isOpen, onClose, onLogout} : SidebarProps)
   {
    console.log("Sidebar compoonent loaded");
    console.log("Sidebar open: ", isOpen);
    const { user } = useUser();
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
          <div className="profile-avatar">{getInitial()}</div>

          <div className="profile-details">
            <h2>{user?.name || "User"}</h2>
            <p>{user?.email || ""}</p>
            <span className="role-badge">{user?.role || "USER"}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="sidebar-divider" />

        {/* Menu */}
        <div className="sidebar-content">
          <button className="sidebar-menu-item" onClick={onClose}>
            <span className="menu-icon">👤</span>
            <span>My Account</span>
          </button>

          {/* Bookings */}
          <div className="booking-section">
            <button
              className="sidebar-menu-item booking-button"
              onClick={() => setIsBookingsOpen((prev) => !prev)}
            >
              <div className="menu-left">
                <span className="menu-icon">🎟️</span>
                <span>My Bookings</span>
              </div>

              <span className={`booking-arrow ${isBookingsOpen ? "rotate" : ""}`}>
                ›
              </span>
            </button>

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

          <button className="sidebar-menu-item" onClick={onClose}>
            <span className="menu-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </div>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={onLogout}>
            <span>↪</span>
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}