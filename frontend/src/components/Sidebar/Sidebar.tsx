import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { IoSettings, IoLogOut, IoTicket, IoPersonCircle } from "react-icons/io5";
import { IoIosArrowForward, IoMdCloseCircle } from "react-icons/io";


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
    const navigate = useNavigate();
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
            <IoMdCloseCircle />

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

              <span className={`booking-arrow ${isBookingsOpen ? "rotate" : ""}`}>
                <IoIosArrowForward />

              </span>
            </button>

            <div
              className={`booking-categories ${
                isBookingsOpen ? "expanded" : ""
              }`} >
            
              <a onClick={onClose}>
                Events
              </a>
              <a onClick={onClose}>
                Activities
              </a>
              <a onClick={onClose}>
                Concerts
              </a>
            </div>
          </div>

          <button
  className="sidebar-menu-item"
  onClick={() => {
    onClose();
    navigate("/settings");
  }}
>
  <span className="menu-icon">
    <IoSettings />

  </span>
  <span>Settings</span>
</button>
        </div>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={onLogout}>
            <span><IoLogOut /></span>
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}