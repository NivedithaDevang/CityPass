
import { useEffect } from "react";
import { 
  FaTimes, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaTicketAlt, 
  FaUser, 
  FaQrcode, 
  FaBarcode 
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
    <div className="ticket-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ticket-modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Floating Close Button */}
        <button type="button" className="ticket-close-btn" onClick={onClose} aria-label="Close ticket">
          <FaTimes />
        </button>

        {/* Outer Pass Structure */}
        <div className={`digital-ticket-card ${isCancelled ? "ticket-cancelled" : ""}`}>
          
          {/* Header Banner */}
          <div className="ticket-header-band">
            <div className="ticket-brand-row">
              <span className="brand-badge">
                <IoSparkles className="sparkle-icon" /> CityPass Official
              </span>
              <span className="ticket-ref-id">PASS #{booking.id.toString().padStart(6, "0")}</span>
            </div>
            <h2 className="ticket-main-heading">CityPass Digital Ticket</h2>
          </div>

          {/* Upper Section: Event Core Info */}
          <div className="ticket-body">
            <div className="ticket-title-row">
              <div>
                <span className="ticket-event-label">ADMIT ONE PASS</span>
                <h3 className="ticket-event-name">{eventTitle}</h3>
              </div>
              <span className={`ticket-status-tag ${isCancelled ? "tag-cancelled" : "tag-active"}`}>
                {isCancelled ? "VOID / CANCELLED" : "VERIFIED PASS"}
              </span>
            </div>

            <div className="ticket-grid">
              <div className="ticket-cell">
                <span className="cell-label"><FaCalendarAlt /> DATE & TIME</span>
                <span className="cell-value">{formatEventDate(booking.event_date || booking.booking_date)}</span>
                <span className="cell-subvalue">{formatEventTime(booking.event_date || booking.booking_date)}</span>
              </div>

              <div className="ticket-cell">
                <span className="cell-label"><FaMapMarkerAlt /> VENUE & CITY</span>
                <span className="cell-value">{venueLocation}</span>
                <span className="cell-subvalue">Gate opens 1 hr prior</span>
              </div>

              <div className="ticket-cell">
                <span className="cell-label"><FaUser /> PASS HOLDER</span>
                <span className="cell-value">{booking.user_name || booking.user_email || "Authorized Holder"}</span>
              </div>

              <div className="ticket-cell">
                <span className="cell-label"><FaTicketAlt /> TICKETS & TOTAL</span>
                <span className="cell-value">
                  {booking.number_of_tickets || 1} Person{(booking.number_of_tickets || 1) > 1 ? "s" : ""}
                </span>
                <span className="cell-subvalue total-price">
                  ₹{Number(booking.total_amount || 0).toLocaleString()} Paid
                </span>
              </div>
            </div>
          </div>

          {/* Perforated Tear-Off Divider with Ticket Notches */}
          <div className="ticket-divider">
            <div className="notch notch-left" />
            <div className="dashed-line" />
            <div className="notch notch-right" />
          </div>

          {/* Lower Stub Section: QR Code, Barcode & Tagline */}
          <div className="ticket-stub">
            <div className="stub-content">
              <div className="qr-box">
                <FaQrcode className="qr-icon" />
                <span>SCAN AT ENTRY</span>
              </div>
              
              <div className="barcode-box">
                <FaBarcode className="barcode-svg" />
                <span className="barcode-digits">CP-{booking.id}-2026-X8</span>
              </div>
            </div>

            {/* Custom UI Tagline Footer */}
            <div className="ticket-tagline-container">
              <p className="ticket-tagline">
                Your city, unlocked. Present this digital pass at the entrance for direct scan-and-enter access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}