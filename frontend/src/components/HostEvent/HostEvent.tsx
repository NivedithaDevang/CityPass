import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBullhorn, FaArrowRight, FaTicketSimple, FaChartLine } from "react-icons/fa6";
import "./HostEvent.css";
import Auth from "../../components/Auth/Auth"; // Adjust the import path if needed
import { useUser } from "../../context/UserContext";

export function HostEvent() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleHostClick = () => {
    // If not logged in, trigger the registration popup
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // If already logged in, route according to role
    const normalizedRole = user.role?.trim().replace(/[\s-]+/g, "_") || "";
    if (normalizedRole === "ORGANISER") {
      navigate("/organiser");
    } else {
      navigate("/settings/host-an-event");
    }
  };

  return (
    <>
      <section className="host-banner-section">
        <div className="host-banner-card">
          {/* Background ambient accents */}
          <div className="host-banner-glow glow-left" />
          <div className="host-banner-glow glow-right" />

          <div className="host-banner-content">
            <div className="host-badge">
              <FaBullhorn className="host-badge-icon" />
              <span>For Organisers & Creators</span>
            </div>

            <h2>Host your next big event on CityPass</h2>
            <p>
              Reach thousands of enthusiastic attendees across India. List your concerts, 
              comedy specials, workshops, or sports pop-ups with instant ticketing and real-time analytics.
            </p>

            <div className="host-highlights">
              <div className="host-highlight-item">
                <FaTicketSimple />
                <span>Instant Verified Ticketing</span>
              </div>
              <div className="host-highlight-item">
                <FaChartLine />
                <span>Real-Time Sales Dashboard</span>
              </div>
            </div>

            <button
              type="button"
              className="host-banner-btn"
              onClick={handleHostClick}
            >
              <span>Become an Organiser</span>
              <FaArrowRight className="host-btn-arrow" />
            </button>
          </div>
        </div>
      </section>

      {showAuthModal && (
        <Auth
          initialLogin={false} // Opens directly to "Create your account" / Register
          onClose={() => setShowAuthModal(false)}
          onSuccess={(authenticatedUser) => {
            setShowAuthModal(false);
            const normalizedRole =
              authenticatedUser.role?.toUpperCase().trim().replace(/[\s-]+/g, "_") || "";
            if (normalizedRole === "ORGANISER" || normalizedRole === "ORGANIZER") {
              navigate("/organiser");
            } else {
              navigate("/settings/host-an-event");
            }
          }}
          redirectOnSuccess={false}
        />
      )}
    </>
  );
}

export default HostEvent;