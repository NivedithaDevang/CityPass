import Navbar from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { useUser } from "../../context/UserContext";
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEye, 
  FaBan,
  FaTimes,
  FaTicketAlt,
  FaUser,
} from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import "./BookingPage.css";
import { Ticket } from "lucide-react";
import { createEventSlug } from "../../config/slug";

interface BookingItem {
  id: number;
  user_id?: number;
  pass_id?: number;
  event_id?: number;
  slug?: string;
  user_name?: string;
  user_email?: string;
  event_title?: string;
  name?: string;
  venue?: string;
  location?: string;
  event_date?: string;
  category_name?: string;
  image_url?: string;
  number_of_tickets?: number;
  total_amount?: string | number;
  booking_date?: string;
  status?: "CONFIRMED" | "CANCELLED";
}

// Map city names to images in public/cities/
const CITY_IMAGE_MAP: Record<string, string> = {
  Bengaluru: "/cities/Bangalore.jpeg",
  Mumbai: "/cities/Mumbai.jpeg",
  Delhi: "/cities/Delhi.jpeg",
  Lucknow: "/cities/Lucknow.jpeg",
  Panaji: "/cities/Goa.jpeg",
  Hyderabad: "/cities/Hyderabad.jpeg",
  Chennai: "/cities/Chennai.jpeg",
  Trivandrum: "/cities/Trivandrum.jpeg",
};

const DEFAULT_POSTER = "/categories/image.png";

// ==========================================
// DIGITAL TICKET MODAL COMPONENT
// ==========================================
interface DigitalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingItem | null;
}

function DigitalTicketModal({ isOpen, onClose, booking }: DigitalTicketModalProps) {
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
        <button type="button" className="ticket-close-btn" onClick={onClose} aria-label="Close ticket">
          <FaTimes />
        </button>

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

          {/* Event Core Info */}
          <div className="ticket-body">
            <div className="ticket-title-row">
              <div>
                <span className="ticket-event-label">ADMIT ONE PASS</span>
                <h3 className="ticket-event-name">{eventTitle}</h3>
              </div>
              <span className={`ticket-status-tag ${isCancelled ? "tag-cancelled" : "tag-active"}`}>
                {isCancelled ? "CANCELLED" : "VERIFIED"}
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

          {/* Perforated Tear Divider */}
          <div className="ticket-divider">
            <div className="notch notch-left" />
            <div className="dashed-line" />
            <div className="notch notch-right" />
          </div>

          <div className="ticket-tagline-container">
            <p className="ticket-tagline">
              Your city, unlocked. Present this digital pass at the entrance for direct scan-and-enter access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN BOOKING PAGE
// ==========================================
export function BookingPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modal states
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<BookingItem | null>(null);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<BookingItem | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/v1/bookings`, {
          withCredentials: true,
        });
        const list = res.data.bookings || res.data.booking || [];
        setBookings(Array.isArray(list) ? list : [list]);
      } catch (err: any) {
        console.error("Error loading bookings:", err);
        setError("Unable to load bookings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;

    try {
      setIsCancelling(true);
      setCancelError(null);

      await axios.patch(
        `${API_BASE_URL}/v1/bookings/${selectedBookingForCancel.id}/cancel`,
        {},
        { withCredentials: true }
      );

      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBookingForCancel.id
            ? { ...b, status: "CANCELLED" }
            : b
        )
      );

      setSelectedBookingForCancel(null);
    } catch (err: any) {
      console.error("Error cancelling booking:", err);
      setCancelError(
        err.response?.data?.message ||
          "Failed to cancel your booking. Please try again."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const getCityPoster = (item: BookingItem): string => {
    const loc = (item.location || item.venue || "").trim().toLowerCase();
    for (const [cityName, imgPath] of Object.entries(CITY_IMAGE_MAP)) {
      if (loc.includes(cityName.toLowerCase())) {
        return imgPath;
      }
    }

    return item.image_url || DEFAULT_POSTER;
  };

  const formatEventDateTime = (dateStr?: string) => {
    if (!dateStr) return "Date to be announced";
    try {
      const d = new Date(dateStr);
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);

      const formattedTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);

      return `${formattedDate} • ${formattedTime}`;
    } catch {
      return dateStr;
    }
  };

  const formatBookingDate = (dateStr?: string) => {
    if (!dateStr) return "Recent";
    try {
      return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Navbar />
      <section className="hero-banner">
        <div className="booking-heading">
          <div className="booking-hero">
            <Ticket className="ticket" />
            <span>Digital Passes Vault</span>
          </div>
          <h1>My Event Bookings</h1>
          <p>
            Access, view, print and manage your active and past event passes for seamless entry.
          </p>
        </div>
      </section>

      <main className="hz-bookings-container">
        {loading ? (
          <div className="hz-status-box">
            <div className="hz-spinner" />
            <p>Loading your passes...</p>
          </div>
        ) : error ? (
          <div className="hz-status-box hz-error">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="hz-status-box">
            <p>No bookings found.</p>
            <Link to="/events" className="hz-explore-link">
              Explore Events &rarr;
            </Link>
          </div>
        ) : (
          <div className="hz-card-list">
            {bookings.map((item) => {
              const isCancelled = item.status?.toUpperCase() === "CANCELLED";
              const cityRaw = item.location || item.venue || "CITY";
              const eventTitle = item.event_title || item.name || "Event Pass";
              
              // Determine slug navigation target
              const eventSlug = item.slug || (eventTitle ? createEventSlug(eventTitle) : item.pass_id ?? item.id);
              const targetUrl = `/events/${eventSlug}`;

              return (
                <article
                  key={item.id}
                  className="hz-booking-card"
                  onClick={() => navigate(targetUrl)}
                >
                  {/* Left Media Thumbnail */}
                  <div className="hz-card-media">
                    <img
                      src={getCityPoster(item)}
                      alt={eventTitle}
                      className="hz-poster-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_POSTER;
                      }}
                    />
                    <div className="hz-media-badges">
                      <span className="hz-location-tag">{cityRaw}</span>
                    </div>
                  </div>

                  {/* Right Details Section */}
                  <div className="hz-card-details">
                    <div className="hz-top-row">
                      <span className="hz-event-datetime">
                        <FaCalendarAlt className="hz-cal-icon" />
                        {formatEventDateTime(item.event_date || item.booking_date)}
                      </span>

                      <span className={`hz-status-pill ${isCancelled ? "cancelled" : "confirmed"}`}>
                        {isCancelled ? <FaTimesCircle /> : <FaCheckCircle />}
                        {isCancelled ? "Cancelled" : "Confirmed"}
                      </span>
                    </div>

                    <h3 className="hz-title">{eventTitle}</h3>
                    <p className="hz-venue">
                      <FaMapMarkerAlt className="hz-pin-icon" />
                      {item.venue || item.location || "Venue details TBA"}
                    </p>

                    <div className="hz-info-capsule">
                      <div className="hz-info-col">
                        <span className="hz-col-label">PASS HOLDER</span>
                        <span className="hz-col-val">
                          {item.user_name || user?.name || item.user_email || "User"}
                        </span>
                      </div>

                      <div className="hz-info-col">
                        <span className="hz-col-label">TICKETS</span>
                        <span className="hz-col-val">
                          {item.number_of_tickets || 1} Pass
                          {(item.number_of_tickets || 1) > 1 ? "es" : ""}
                        </span>
                      </div>

                      <div className="hz-info-col">
                        <span className="hz-col-label">TOTAL PAID</span>
                        <span className="hz-col-val hz-price">
                          ₹{Number(item.total_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="hz-footer-row">
                      <span className="hz-booking-timestamp">
                        Booked on {formatBookingDate(item.booking_date)}
                      </span>

                      {/* e.stopPropagation() prevents card redirection when clicking action buttons */}
                      <div
                        className="hz-action-buttons"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isCancelled && (
                          <button
                            type="button"
                            className="hz-cancel-btn"
                            onClick={() => {
                              setCancelError(null);
                              setSelectedBookingForCancel(item);
                            }}
                          >
                            <FaBan /> Cancel
                          </button>
                        )}
                        <button 
                          type="button" 
                          className="hz-view-pass-btn"
                          onClick={() => setSelectedBookingForPass(item)}
                        >
                          <FaEye /> View Pass
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* DIGITAL TICKET MODAL */}
      <DigitalTicketModal
        isOpen={Boolean(selectedBookingForPass)}
        onClose={() => setSelectedBookingForPass(null)}
        booking={selectedBookingForPass}
      />

      {/* CANCELLATION CONFIRMATION MODAL */}
      {selectedBookingForCancel && (
        <div
          className="cancel-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!isCancelling) setSelectedBookingForCancel(null);
          }}
        >
          <div
            className="cancel-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Cancel Booking?</h2>
            <p>
              Are you sure you want to cancel your pass for{" "}
              <strong>
                {selectedBookingForCancel.event_title ||
                  selectedBookingForCancel.name ||
                  "this event"}
              </strong>
              ?
            </p>

            <div className="cancel-summary-box">
              <div className="cancel-summary-row">
                <span>Passes:</span>
                <strong>
                  {selectedBookingForCancel.number_of_tickets || 1} Pass
                  {(selectedBookingForCancel.number_of_tickets || 1) > 1 ? "es" : ""}
                </strong>
              </div>
              <div className="cancel-summary-row">
                <span>Refundable Amount:</span>
                <strong>
                  ₹{Number(selectedBookingForCancel.total_amount || 0).toLocaleString()}
                </strong>
              </div>
            </div>

            <p className="cancel-terms-note">
              Refunds will be processed back to your original payment method in accordance with standard event cancellation policies.
            </p>

            {cancelError && <p className="cancel-inline-error">{cancelError}</p>}

            <div className="cancel-modal-actions">
              <button
                type="button"
                className="cancel-back-btn"
                onClick={() => setSelectedBookingForCancel(null)}
                disabled={isCancelling}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="cancel-confirm-btn"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default BookingPage;