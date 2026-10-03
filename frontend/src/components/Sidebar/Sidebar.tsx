import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import {
  IoSettings,
  IoLogOut,
  IoTicket,
  IoPersonCircle,
  IoDocumentText,
  IoShieldCheckmark,
} from "react-icons/io5";
import { MdSpaceDashboard } from "react-icons/md";
import { IoIosArrowForward, IoMdCloseCircle } from "react-icons/io";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ isOpen, onClose, onLogout }: SidebarProps) {
  const { user, profileImage } = useUser();
  const navigate = useNavigate();
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check if current user is an admin or super admin
  const normalizedRole = user?.role?.toUpperCase() || "";
  const isAdmin = normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN" || normalizedRole === "SUPERADMIN";

  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleAccountClick = () => {
    onClose();
    if (isAdmin) {
      navigate("/admin");
    } else {
      navigate("/settings/profile");
    }
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
            <IoMdCloseCircle />
          </button>
        </div>

        {/* Profile */}
        <div className="profile-section">
          <div className="profile-avatar">
            {profileImage ? <img src={profileImage} alt="" /> : getInitial()}
          </div>

          <div className="profile-details">
            <h2>{user?.name || "User"}</h2>
            <span
              className={`status ${
                user?.status === "INACTIVE" ? "status-inactive" : ""
              }`}
            >
              {user?.status || "ACTIVE"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="sidebar-divider" />

        {/* Menu */}
        <div className="sidebar-content">
          {/* Admin Command Center Link (Visible for Admins) */}
          {isAdmin && (
            <button
              className="sidebar-menu-item admin-item"
              onClick={() => {
                onClose();
                navigate("/admin");
              }}
            >
              <span className="profile-icon">
                <MdSpaceDashboard />
              </span>
              <span>Admin Dashboard</span>
            </button>
          )}

          {/* My Account -> Redirects to /admin if admin, otherwise /settings/profile */}
          <button className="sidebar-menu-item" onClick={handleAccountClick}>
            <span className="profile-icon">
              <IoPersonCircle />
            </span>
            <span>My Account</span>
          </button>

          {/* Bookings */}
          <div className="booking-section">
            <button
              className="sidebar-menu-item booking-button"
              onClick={() => setIsBookingsOpen((prev) => !prev)}
            >
              <div className="menu-left">
                <span className="ticket-icon">
                  <IoTicket />
                </span>
                <span>My Bookings</span>
              </div>

              <span
                className={`booking-arrow ${isBookingsOpen ? "rotate" : ""}`}
              >
                <IoIosArrowForward size={20} />
              </span>
            </button>

            <div
              className={`booking-categories ${
                isBookingsOpen ? "expanded" : ""
              }`}
            >
              <a
                onClick={() => {
                  onClose();
                  navigate("/bookings");
                }}
              >
                Events
              </a>
              <a
                onClick={() => {
                  onClose();
                  navigate("/bookings");
                }}
              >
                Activities
              </a>
              <a
                onClick={() => {
                  onClose();
                  navigate("/bookings");
                }}
              >
                Concerts
              </a>
            </div>
          </div>

          {/* Settings Submenu */}
          <div className="settings-section">
            <button
              className="sidebar-menu-item settings-button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
            >
              <div className="menu-left">
                <span className="setting-icon">
                  <IoSettings />
                </span>
                <span>Settings</span>
              </div>
              <span
                className={`settings-arrow ${isSettingsOpen ? "rotate" : ""}`}
              >
                <IoIosArrowForward size={20} />
              </span>
            </button>

            <div
              className={`booking-categories ${
                isSettingsOpen ? "expanded" : ""
              }`}
            >
              <a
                onClick={() => {
                  onClose();
                  navigate("/settings/password");
                }}
              >
                Change Password
              </a>

              <a
                onClick={() => {
                  onClose();
                  navigate("/settings/host-an-event");
                }}
              >
                Host an event
              </a>

              <a
                onClick={() => {
                  onClose();
                  navigate("/settings/deactivate");
                }}
              >
                Deactivate account
              </a>
            </div>
          </div>

          {/* Terms & Conditions */}
          <button
            className="sidebar-menu-item"
            onClick={() => {
              onClose();
              navigate("/terms");
            }}
          >
            <span className="terms-icon">
              <IoDocumentText />
            </span>
            <span>Terms & Conditions</span>
          </button>

          {/* Privacy Policy */}
          <button
            className="sidebar-menu-item"
            onClick={() => {
              onClose();
              navigate("/privacy");
            }}
          >
            <span className="privacy-icon">
              <IoShieldCheckmark />
            </span>
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={onLogout}>
            <span>
              <IoLogOut />
            </span>
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}