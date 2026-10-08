
import { useEffect } from "react";
import { 
  FaTimes, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaTicketAlt, 
  FaUser
} from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import "./DigitalTicketModal.css";

interface DigitalTicketProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: number;
    event_title?: string;
    name?: string;
    venue?: string;
    location?: string;
    event_date?: string;
    booking_date?: string;
    number_of_tickets?: number;
    total_amount?: string | number;
    user_name?: string;
    user_email?: string;
    status?: string;
  } | null;
}

export function DigitalTicketModal({ isOpen, onClose, booking }: DigitalTicketProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const eventTitle = booking.event_title || booking.name || "Live Event Pass";
  const venueLocation = booking.venue || booking.location || "Venue details TBA";
  const isCancelled = booking.status?.toUpperCase() === "CANCELLED";

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return "Date to be announced";
    try {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatEventTime = (dateStr?: string) => {
    if (!dateStr) return "Time TBA";
    try {
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(dateStr));
    } catch {
      return "12:00 AM";
    }
  };

  return (
    <div className="book-ticket-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="book-ticket-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className={`book-digital-ticket-card ${isCancelled ? "book-ticket-cancelled" : ""}`}>
          <div className="book-ticket-header-band">
            <div className="book-ticket-brand-row">
              <span className="book-brand-badge">
                <IoSparkles className="book-sparkle-icon" /> CityPass Official
              </span>
            </div>
            <h2 className="book-ticket-main-heading">CityPass Digital Ticket</h2>
            <button
              type="button"
              className="book-ticket-close-btn"
              onClick={onClose}
              aria-label="Close ticket"
            >
              <FaTimes />
            </button>
          </div>

          <div className="book-ticket-body">
            <div className="book-ticket-title-row">
              <div>
                <span className="book-ticket-event-label">ADMIT ONE PASS</span>
                <h3 className="book-ticket-event-name">{eventTitle}</h3>
              </div>
              <span className={`book-ticket-status-tag ${isCancelled ? "book-tag-cancelled" : "book-tag-active"}`}>
                {isCancelled ? "VOID / CANCELLED" : "VERIFIED PASS"}
              </span>
            </div>

            <div className="book-ticket-grid">
              <div className="book-ticket-cell">
                <span className="book-cell-label"><FaCalendarAlt /> DATE & TIME</span>
                <span className="book-cell-value">{formatEventDate(booking.event_date || booking.booking_date)}</span>
                <span className="book-cell-subvalue">{formatEventTime(booking.event_date || booking.booking_date)}</span>
              </div>

              <div className="book-ticket-cell">
                <span className="book-cell-label"><FaMapMarkerAlt /> VENUE & CITY</span>
                <span className="book-cell-value">{venueLocation}</span>
                <span className="book-cell-subvalue">Gate opens 1 hr prior</span>
              </div>

              <div className="book-ticket-cell">
                <span className="book-cell-label"><FaUser /> PASS HOLDER</span>
                <span className="book-cell-value">{booking.user_name || booking.user_email || "Authorized Holder"}</span>
              </div>

              <div className="book-ticket-cell">
                <span className="book-cell-label"><FaTicketAlt /> TICKETS & TOTAL</span>
                <span className="book-cell-value">
                  {booking.number_of_tickets || 1} Person{(booking.number_of_tickets || 1) > 1 ? "s" : ""}
                </span>
                <span className="book-cell-subvalue total-price">
                  ₹{Number(booking.total_amount || 0).toLocaleString()} Paid
                </span>
              </div>
            </div>
          </div>

          <div className="book-ticket-divider">
            <div className="book-dashed-line" />
          </div>

          <div className="book-ticket-tagline-container">
            <p className="book-ticket-tagline">
              Your city, unlocked. Present this digital pass at the entrance for direct scan-and-enter access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}