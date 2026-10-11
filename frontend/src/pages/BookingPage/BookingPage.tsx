
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
  city_name?: string;
  time?: string;
  event_time?: string;
  category_name?: string;
  image_url?: string;
  poster_url?: string;
  banner_image?: string;
  image?: string;
  event_ticket_id?: number | null;
  ticket_name?: string | null;
  ticket_description?: string | null;
  ticket_price?: string | number | null;
  number_of_tickets?: number;
  total_amount?: string | number;
  booking_date?: string;
  status?: "CONFIRMED" | "CANCELLED";
}

const CITY_IMAGE_MAP: Record<string, string> = {
  Bengaluru: "/cities/Bangalore.jpeg",
  Mumbai: "/cities/Mumbai.jpeg",
  Delhi: "/cities/Delhi.jpeg",
  Lucknow: "/cities/Lucknow.jpeg",
  Panaji: "/cities/Goa.jpeg",
  Goa: "/cities/Goa.jpeg",
  Hyderabad: "/cities/Hyderabad.jpeg",
  Chennai: "/cities/Chennai.jpeg",
  Trivandrum: "/cities/Trivandrum.jpeg",
};

const DEFAULT_POSTER = "/categories/image.png";

const formatCurrency = (
  amount: string | number | null | undefined
): string =>
  `₹${Number(amount ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const extractFormattedTime = (
  timeField?: string,
  dateField?: string
): string | null => {
  if (timeField && timeField.trim()) {
    const rawTime = timeField.trim();

    if (/[ap]m/i.test(rawTime)) {
      return rawTime;
    }

    if (rawTime.includes(":")) {
      const parts = rawTime.split(":");
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);

      if (
        !Number.isNaN(hours) &&
        !Number.isNaN(minutes) &&
        hours >= 0 &&
        hours <= 23 &&
        minutes >= 0 &&
        minutes <= 59
      ) {
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(date);
      }
    }

    return rawTime;
  }

  if (dateField && dateField.includes("T")) {
    const date = new Date(dateField);

    if (!Number.isNaN(date.getTime())) {
      if (
        date.getUTCHours() !== 0 ||
        date.getUTCMinutes() !== 0 ||
        date.getUTCSeconds() !== 0
      ) {
        return new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(date);
      }
    }
  }

  return null;
};

const formatEventOnlyDate = (dateStr?: string) => {
  if (!dateStr) return "Date to be announced";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

interface DigitalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingItem | null;
}

function DigitalTicketModal({
  isOpen,
  onClose,
  booking,
}: DigitalTicketModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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

  const eventTimeFormatted = extractFormattedTime(
    booking.time || booking.event_time,
    booking.event_date
  );

  const ticketCount = booking.number_of_tickets || 1;

  return (
    <div
      className="ticket-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Digital event ticket"
    >
      <div
        className="ticket-modal-wrapper"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="ticket-close-btn"
          onClick={onClose}
          aria-label="Close ticket"
        >
          <FaTimes />
        </button>

        <div
          className={`digital-ticket-card ${
            isCancelled ? "ticket-cancelled" : ""
          }`}
        >
          <div className="ticket-header-band">
            <div className="ticket-brand-row">
              <span className="brand-badge">
                <IoSparkles className="sparkle-icon" />
                CityPass Official
              </span>
            </div>

            <h2 className="ticket-main-heading">
              CityPass Digital Ticket
            </h2>
          </div>

          <div className="ticket-body">
            <div className="ticket-title-row">
              <div>
                <span className="ticket-event-label">
                  ADMIT ONE PASS
                </span>

                <h3 className="ticket-event-name">
                  {eventTitle}
                </h3>
              </div>

              <span
                className={`ticket-status-tag ${
                  isCancelled ? "tag-cancelled" : "tag-active"
                }`}
              >
                {isCancelled ? "CANCELLED" : "CONFIRMED"}
              </span>
            </div>

            <div className="ticket-grid">
              <div className="ticket-cell">
                <span className="cell-label">
                  <FaTicketAlt /> TICKET CATEGORY
                </span>

                <span className="cell-value">
                  {ticketType}
                </span>

                {booking.ticket_price != null && (
                  <span className="cell-subvalue">
                    {formatCurrency(booking.ticket_price)} per ticket
                  </span>
                )}
              </div>

              <div className="ticket-cell">
                <span className="cell-label">
                  <FaCalendarAlt /> DATE & TIME
                </span>

                <span className="cell-value">
                  {formatEventOnlyDate(
                    booking.event_date || booking.booking_date
                  )}
                </span>

                {eventTimeFormatted && (
                  <span className="cell-subvalue">
                    {eventTimeFormatted}
                  </span>
                )}
              </div>

              <div className="ticket-cell">
                <span className="cell-label">
                  <FaMapMarkerAlt /> VENUE & CITY
                </span>

                <span className="cell-value">
                  {venueLocation}
                </span>

                {booking.city_name && (
                  <span className="cell-subvalue">
                    {booking.city_name}
                  </span>
                )}
              </div>

              <div className="ticket-cell">
                <span className="cell-label">
                  <FaUser /> PASS HOLDER
                </span>

                <span className="cell-value">
                  {booking.user_name ||
                    booking.user_email ||
                    "Authorized Holder"}
                </span>
              </div>

              <div className="ticket-cell">
                <span className="cell-label">
                  <FaTicketAlt /> QUANTITY
                </span>

                <span className="cell-value">
                  {ticketCount} Ticket
                  {ticketCount > 1 ? "s" : ""}
                </span>
              </div>

              <div className="ticket-cell">
                <span className="cell-label">
                  <FaCheckCircle /> TOTAL PAID
                </span>

                <span className="cell-value total-price">
                  {formatCurrency(booking.total_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="ticket-divider">
            <div className="notch notch-left" />
            <div className="dashed-line" />
            <div className="notch notch-right" />
          </div>

          <div className="ticket-tagline-container">
            <p className="ticket-tagline">
              Your city, unlocked. Present this digital pass at the
              entrance for entry, subject to the event's terms and
              conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [selectedBookingForCancel, setSelectedBookingForCancel] =
    useState<BookingItem | null>(null);

  const [selectedBookingForPass, setSelectedBookingForPass] =
    useState<BookingItem | null>(null);

  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_BASE_URL}/v1/bookings`,
          { withCredentials: true }
        );

        const list =
          response.data.bookings || response.data.booking || [];

        setBookings(Array.isArray(list) ? list : [list]);
      } catch (err) {
        console.error("Error loading bookings:", err);
        setError(
          "Unable to load bookings. Please sign in and try again."
        );
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

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === selectedBookingForCancel.id
            ? { ...booking, status: "CANCELLED" }
            : booking
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

  const getBookingPoster = (item: BookingItem): string => {
    const directEventImage =
      item.image_url ||
      item.poster_url ||
      item.banner_image ||
      item.image;

    if (directEventImage?.trim()) {
      return directEventImage.trim();
    }

    const cityName = item.city_name?.trim();

    if (cityName && CITY_IMAGE_MAP[cityName]) {
      return CITY_IMAGE_MAP[cityName];
    }

    const location = (
      item.location ||
      item.venue ||
      ""
    ).trim().toLowerCase();

    for (const [name, imagePath] of Object.entries(CITY_IMAGE_MAP)) {
      if (location.includes(name.toLowerCase())) {
        return imagePath;
      }
    }

    return DEFAULT_POSTER;
  };

  const getCombinedDateTimeDisplay = (item: BookingItem) => {
    const date = formatEventOnlyDate(
      item.event_date || item.booking_date
    );

    const time = extractFormattedTime(
      item.time || item.event_time,
      item.event_date
    );

    return time ? `${date} • ${time}` : date;
  };

  const formatBookingDate = (dateStr?: string) => {
    if (!dateStr) return "Recent";

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return dateStr;
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
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
            Access, view, print and manage your active and past event
            passes for seamless entry.
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
          <div className="hz-status-box hz-error">
            {error}
          </div>
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
              const isCancelled =
                item.status?.toUpperCase() === "CANCELLED";

              const cityLabel =
                item.city_name ||
                item.location ||
                item.venue ||
                "CITY";

              const eventTitle =
                item.event_title || item.name || "Event Pass";

              const eventSlug =
                item.slug ||
                (eventTitle
                  ? createEventSlug(eventTitle)
                  : item.pass_id ?? item.id);

              const targetUrl = `/events/${eventSlug}`;

              return (
                <article
                  key={item.id}
                  className="hz-booking-card"
                  onClick={() => navigate(targetUrl)}
                >
                  <div className="hz-card-media">
                    <img
                      src={getBookingPoster(item)}
                      alt={eventTitle}
                      className="hz-poster-img"
                      onError={(event) => {
                        const image = event.currentTarget;

                        if (
                          image.dataset.fallbackApplied === "true"
                        ) {
                          return;
                        }

                        image.dataset.fallbackApplied = "true";

                        const cityName = item.city_name?.trim();
                        let fallback = cityName
                          ? CITY_IMAGE_MAP[cityName]
                          : undefined;

                        if (!fallback) {
                          const location = (
                            item.location ||
                            item.venue ||
                            ""
                          ).trim().toLowerCase();

                          fallback = Object.entries(
                            CITY_IMAGE_MAP
                          ).find(([name]) =>
                            location.includes(name.toLowerCase())
                          )?.[1];
                        }

                        image.src = fallback || DEFAULT_POSTER;
                      }}
                    />

                    <div className="hz-media-badges">
                      <span className="hz-location-tag">
                        {cityLabel}
                      </span>
                    </div>
                  </div>

                  <div className="hz-card-details">
                    <div className="hz-top-row">
                      <span className="hz-event-datetime">
                        <FaCalendarAlt className="hz-cal-icon" />
                        {getCombinedDateTimeDisplay(item)}
                      </span>

                      <span
                        className={`hz-status-pill ${
                          isCancelled ? "cancelled" : "confirmed"
                        }`}
                      >
                        {isCancelled ? (
                          <FaTimesCircle />
                        ) : (
                          <FaCheckCircle />
                        )}

                        {isCancelled ? "Cancelled" : "Confirmed"}
                      </span>
                    </div>

                    <h3 className="hz-title">{eventTitle}</h3>

                    <p className="hz-venue">
                      <FaMapMarkerAlt className="hz-pin-icon" />
                      {item.venue ||
                        item.location ||
                        "Venue details TBA"}
                    </p>

                    <div className="hz-info-capsule">
                      <div className="hz-info-col">
                        <span className="hz-col-label">
                          PASS HOLDER
                        </span>

                        <span className="hz-col-val">
                          {item.user_name ||
                            user?.name ||
                            item.user_email ||
                            "User"}
                        </span>
                      </div>

                      <div className="hz-info-col">
                        <span className="hz-col-label">
                          TICKET TYPE
                        </span>

                        <span className="hz-col-val">
                          {item.ticket_name || "Not available"}
                        </span>

                        {item.ticket_price != null && (
                          <span className="hz-col-val">
                            {formatCurrency(item.ticket_price)} each
                          </span>
                        )}
                      </div>

                      <div className="hz-info-col">
                        <span className="hz-col-label">
                          TICKETS
                        </span>

                        <span className="hz-col-val">
                          {item.number_of_tickets || 1} Ticket
                          {(item.number_of_tickets || 1) > 1
                            ? "s"
                            : ""}
                        </span>
                      </div>

                      <div className="hz-info-col">
                        <span className="hz-col-label">
                          TOTAL PAID
                        </span>

                        <span className="hz-col-val hz-price">
                          {formatCurrency(item.total_amount)}
                        </span>
                      </div>
                    </div>

                    <div className="hz-footer-row">
                      <span className="hz-booking-timestamp">
                        Booked on {formatBookingDate(item.booking_date)}
                      </span>

                      <div
                        className="hz-action-buttons"
                        onClick={(event) => event.stopPropagation()}
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
                          onClick={() =>
                            setSelectedBookingForPass(item)
                          }
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

      <DigitalTicketModal
        isOpen={Boolean(selectedBookingForPass)}
        onClose={() => setSelectedBookingForPass(null)}
        booking={selectedBookingForPass}
      />

      {selectedBookingForCancel && (
        <div
          className="cancel-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!isCancelling) {
              setSelectedBookingForCancel(null);
            }
          }}
        >
          <div
            className="cancel-modal-card"
            onClick={(event) => event.stopPropagation()}
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
                <span>Ticket category:</span>
                <strong>
                  {selectedBookingForCancel.ticket_name ||
                    "Ticket type unavailable"}
                </strong>
              </div>

              <div className="cancel-summary-row">
                <span>Passes:</span>
                <strong>
                  {selectedBookingForCancel.number_of_tickets || 1}{" "}
                  Ticket
                  {(selectedBookingForCancel.number_of_tickets || 1) >
                  1
                    ? "s"
                    : ""}
                </strong>
              </div>

              <div className="cancel-summary-row">
                <span>Booking total:</span>
                <strong>
                  {formatCurrency(
                    selectedBookingForCancel.total_amount
                  )}
                </strong>
              </div>
            </div>

            <p className="cancel-terms-note">
              Refund eligibility depends on the event's cancellation
              policy and the applicable refund terms.
            </p>

            {cancelError && (
              <p className="cancel-inline-error">{cancelError}</p>
            )}

            <div className="cancel-modal-actions">
              <button
                type="button"
                className="cancel-back-btn"
                onClick={() =>
                  setSelectedBookingForCancel(null)
                }
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
                {isCancelling
                  ? "Cancelling..."
                  : "Confirm Cancellation"}
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
