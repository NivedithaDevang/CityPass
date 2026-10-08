import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/config";
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

import {
  IoIosArrowForward,
  IoMdCloseCircle,
} from "react-icons/io";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onLogout,
}: SidebarProps) {
  const { user } = useUser();
  const navigate = useNavigate();

  const [isBookingsOpen, setIsBookingsOpen] =
    useState(false);

  const [isSettingsOpen, setIsSettingsOpen] =
    useState(false);

  const normalizedRole =
    user?.role?.toUpperCase() || "";

  const isAdmin =
    normalizedRole === "ADMIN" ||
    normalizedRole === "SUPER_ADMIN" ||
    normalizedRole === "SUPERADMIN";

  const isOrganiser = normalizedRole === "ORGANISER" || normalizedRole === "ORGANIZER";

  const getInitial = () => {
    if (user?.name) {
      return user.name
        .charAt(0)
        .toUpperCase();
    }

    return "U";
  };
  const getProfileImage = () => {
    if (!user?.profile_image) {
      return "";
    }

    if (
      user.profile_image.startsWith("http://") ||
      user.profile_image.startsWith("https://")
    ) {
      return user.profile_image;
    }

    return `${API_BASE_URL.replace(
      /\/$/,
      ""
    )}/${user.profile_image.replace(
      /^\/+/,
      ""
    )}`;
  };

  const handleAccountClick = () => {
    onClose();

    if (isAdmin) {
      navigate("/admin");
    } else if (isOrganiser) {
      navigate("/organiser");
    } else {
      navigate("/settings/profile");
    }
  };

  const handleProfileImageError = (
    event: React.SyntheticEvent<HTMLImageElement>
  ) => {
    event.currentTarget.style.display = "none";
  };

  return (
    <>
      {/* Sidebar backdrop */}
      <div
        className={`sidebar-backdrop ${
          isOpen ? "show" : ""
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`sidebar-drawer ${
          isOpen ? "open" : ""
        }`}
      >
        {/* Top */}
        <div className="sidebar-top">
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <IoMdCloseCircle />
          </button>
        </div>

        {/* Profile */}
        <div className="profile-section">
          <div className="profile-avatar">
            {getProfileImage() ? (
              <img
                src={getProfileImage()}
                alt="Profile"
                onError={
                  handleProfileImageError
                }
              />
            ) : (
              getInitial()
            )}
          </div>

          <div className="profile-details">
            <h2>
              {user?.name || "User"}
            </h2>

            <span
              className={`status ${
                user?.status === "INACTIVE"
                  ? "status-inactive"
                  : ""
              }`}
            >
              {user?.status || "ACTIVE"}
            </span>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Sidebar Content */}
        <div className="sidebar-content">

          {/* Admin Dashboard */}
          {isAdmin && (
            <button
              type="button"
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

          {isOrganiser && (
            <button
              type="button"
              className="sidebar-menu-item admin-item"
              onClick={() => {
                onClose();
                navigate("/organiser");
              }}
            >
              <span className="profile-icon">
                <MdSpaceDashboard />
              </span>
              <span>Organiser Dashboard</span>
            </button>
          )}

          <button
            type="button"
            className="sidebar-menu-item"
            onClick={handleAccountClick}
          >
            <span className="profile-icon">
              <IoPersonCircle />
            </span>
            <span>My Account</span>
          </button>
          {/* My Bookings */}
          <div className="booking-section">
            <button
              type="button"
              className="sidebar-menu-item booking-button"
              onClick={() =>
                setIsBookingsOpen(
                  (prev) => !prev
                )
              }
            >
              <div className="menu-left">
                <span className="ticket-icon">
                  <IoTicket />
                </span>

                <span>
                  My Bookings
                </span>
              </div>

              <span
                className={`booking-arrow ${
                  isBookingsOpen
                    ? "rotate"
                    : ""
                }`}
              >
                <IoIosArrowForward
                  size={20}
                />
              </span>
            </button>

            <div
              className={`booking-categories ${
                isBookingsOpen
                  ? "expanded"
                  : ""
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/bookings");
                }}
              >
                Events
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/bookings");
                }}
              >
                Activities
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/bookings");
                }}
              >
                Concerts
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="settings-section">
            <button
              type="button"
              className="sidebar-menu-item settings-button"
              onClick={() =>
                setIsSettingsOpen(
                  (prev) => !prev
                )
              }
            >
              <div className="menu-left">
                <span className="setting-icon">
                  <IoSettings />
                </span>

                <span>
                  Settings
                </span>
              </div>

              <span
                className={`settings-arrow ${
                  isSettingsOpen
                    ? "rotate"
                    : ""
                }`}
              >
                <IoIosArrowForward
                  size={20}
                />
              </span>
            </button>

            <div
              className={`booking-categories ${
                isSettingsOpen
                  ? "expanded"
                  : ""
              }`}
            >
              {/* Change Password */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(
                    "/settings/password"
                  );
                }}
              >
                Change Password
              </button>

              {/* Host an Event */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(
                    "/settings/host-an-event"
                  );
                }}
              >
                Host an Event
              </button>

              {/* Deactivate */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(
                    "/settings/deactivate"
                  );
                }}
              >
                Deactivate Account
              </button>
            </div>
          </div>

          {/* Terms */}
          <button
            type="button"
            className="sidebar-menu-item"
            onClick={() => {
              onClose();
              navigate("/terms");
            }}
          >
            <span className="terms-icon">
              <IoDocumentText />
            </span>

            <span>
              Terms & Conditions
            </span>
          </button>

          {/* Privacy */}
          <button
            type="button"
            className="sidebar-menu-item"
            onClick={() => {
              onClose();
              navigate("/privacy");
            }}
          >
            <span className="privacy-icon">
              <IoShieldCheckmark />
            </span>

            <span>
              Privacy Policy
            </span>
          </button>
        </div>

        {/* Logout */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
          >
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