import { useEffect } from "react";
import {
  FaTimes,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTicketAlt,
  FaUser,
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
    ticket_name?: string | null;
    ticket_description?: string | null;
    ticket_price?: number | string | null;
    category_name?: string | null;
  } | null;
}

const formatCurrency = (
  amount: number | string | null | undefined
): string =>
  `₹${Number(amount ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export function DigitalTicketModal({
  isOpen,
  onClose,
  booking,
}: DigitalTicketProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const eventTitle =
    booking.event_title || booking.name || "Live Event Pass";

  const venueLocation =
    booking.venue || booking.location || "Venue details TBA";

  const ticketType =
    booking.ticket_name || "Ticket type unavailable";

  const isCancelled =
    booking.status?.toUpperCase() === "CANCELLED";

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return "Date to be announced";

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) return dateStr;

    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatEventTime = (dateStr?: string) => {
    if (!dateStr) return "Time TBA";

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) return "Time TBA";

    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const ticketCount = booking.number_of_tickets || 1;

  return (
    <div
      className="book-ticket-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Digital event ticket"
    >
      <div
        className="book-ticket-modal-wrapper"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`book-digital-ticket-card ${
            isCancelled ? "book-ticket-cancelled" : ""
          }`}
        >
          <div className="book-ticket-header-band">
            <div className="book-ticket-brand-row">
              <span className="book-brand-badge">
                <IoSparkles className="book-sparkle-icon" />
                CityPass Official
              </span>
            </div>

            <h2 className="book-ticket-main-heading">
              CityPass Digital Ticket
            </h2>

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
                <span className="book-ticket-event-label">
                  ADMIT ONE PASS
                </span>

                <h3 className="book-ticket-event-name">
                  {eventTitle}
                </h3>
              </div>

              <span
                className={`book-ticket-status-tag ${
                  isCancelled
                    ? "book-tag-cancelled"
                    : "book-tag-active"
                }`}
              >
                {isCancelled
                  ? "VOID / CANCELLED"
                  : "VERIFIED PASS"}
              </span>
            </div>

            <div className="book-ticket-grid">
              <div className="book-ticket-cell">
                <span className="book-cell-label">
                  <FaTicketAlt /> TICKET CATEGORY
                </span>

                <span className="book-cell-value">
                  {ticketType}
                </span>

                {booking.ticket_price != null && (
                  <span className="book-cell-subvalue">
                    {formatCurrency(booking.ticket_price)} per ticket
                  </span>
                )}
              </div>

              <div className="book-ticket-cell">
                <span className="book-cell-label">
                  <FaCalendarAlt /> DATE & TIME
                </span>

                <span className="book-cell-value">
                  {formatEventDate(booking.event_date)}
                </span>

                <span className="book-cell-subvalue">
                  {formatEventTime(booking.event_date)}
                </span>
              </div>

              <div className="book-ticket-cell">
                <span className="book-cell-label">
                  <FaMapMarkerAlt /> VENUE & CITY
                </span>

                <span className="book-cell-value">
                  {venueLocation}
                </span>

                <span className="book-cell-subvalue">
                  {booking.category_name || "Event"}
                </span>
              </div>

              <div className="book-ticket-cell">
                <span className="book-cell-label">
                  <FaUser /> PASS HOLDER
                </span>

                <span className="book-cell-value">
                  {booking.user_name ||
                    booking.user_email ||
                    "Authorized Holder"}
                </span>

                {booking.user_email && booking.user_name && (
                  <span className="book-cell-subvalue">
                    {booking.user_email}
                  </span>
                )}
              </div>

              <div className="book-ticket-cell">
                <span className="book-cell-label">
                  <FaTicketAlt /> TICKETS & TOTAL
                </span>

                <span className="book-cell-value">
                  {ticketCount} Ticket
                  {ticketCount > 1 ? "s" : ""}
                </span>

                <span className="book-cell-subvalue total-price">
                  {formatCurrency(booking.total_amount)} Total
                </span>
              </div>
            </div>
          </div>

          <div className="book-ticket-divider">
            <div className="book-dashed-line" />
          </div>

          <div className="book-ticket-tagline-container">
            <p className="book-ticket-tagline">
              Your city, unlocked. Present this digital pass at the
              entrance for direct scan-and-enter access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}