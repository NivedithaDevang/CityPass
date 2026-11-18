import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events, type User } from "../../types/auth";
import { useUser } from "../../context/UserContext";
import {
  FaMapPin,
  FaCalendarAlt,
  FaArrowLeft,
  FaShieldAlt,
  FaChevronRight,
  FaExternalLinkAlt,
  FaClock,
  FaCheckCircle,
  FaInfoCircle,
  FaTimes,
  FaSearchPlus,
} from "react-icons/fa";
import { TermsModal } from "../Terms/EventTerms";
import { OrganiserDetails } from "../OrganiserCard/OrganiserCard";
import { Booking } from "../Booking/Booking";
import Auth from "../Auth/Auth";
import "./EventDetails.css";

interface EventTicket {
  id: number;
  event_id: number;
  name: string;
  description?: string | null;
  price: number | string;
  status?: string;
}

interface EventWithTickets extends Events {
  event_tickets?: EventTicket[];
  tickets?: EventTicket[];
  image?: string;
  instructions?: string;
  additional_instructions?: string;
  languages?: string | string[];
  age_group?: string;
  duration_hours?: number | string;
  // Organiser properties
  organiser_stage_name?: string | null;
  stage_name?: string | null;
  organiser_description?: string | null;
  organizer_description?: string | null;
  organiser_events_count?: number | string | null;
  total_events_hosted?: number | string | null;
}

function EventDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const [event, setEvent] = useState<EventWithTickets | null>(null);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null);
  const [remainingCapacity, setRemainingCapacity] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Lock body scroll when image lightbox is open
  useEffect(() => {
    if (showImagePreview) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setShowImagePreview(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [showImagePreview]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_BASE_URL}/v1/events/${slug}`);
        const loadedEvent: EventWithTickets = response.data.event || response.data;
        setEvent(loadedEvent);

        const totalCapacity = Number(loadedEvent.capacity ?? 0);
        const locallyBooked = Number(
          window.localStorage.getItem(`citypass:event-booked:${loadedEvent.id}`) ?? 0
        );
        setRemainingCapacity(
          Number.isSafeInteger(totalCapacity) && totalCapacity >= 0
            ? Math.max(
                0,
                totalCapacity -
                  (Number.isSafeInteger(locallyBooked) && locallyBooked > 0
                    ? Math.min(totalCapacity, locallyBooked)
                    : 0)
              )
            : 0
        );

        const eventTicketList: EventTicket[] = (
          loadedEvent.event_tickets ||
          loadedEvent.tickets ||
          []
        ).filter(
          (ticket) => ticket.status === undefined || ticket.status === "ACTIVE"
        );

        setTickets(eventTicketList);
        setSelectedTicket(eventTicketList[0] || null);

        document.title = `${loadedEvent.name || "Event"} | CityPass`;
      } catch (err) {
        console.error("EVENT DETAILS ERROR:", err);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEventDetails();
    }
  }, [slug]);

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";

    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return eventDate;
    }

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
    }).format(parsedDate);
  };

  const formatTimeString = (timeStr?: string) => {
    if (!timeStr) return "";

    const [hours, minutes] = timeStr.split(":");
    if (hours === undefined || minutes === undefined) {
      return timeStr;
    }

    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const getFormattedLanguages = (languages?: string | string[]) => {
    if (!languages) return "English";
    if (Array.isArray(languages)) return languages.join(" / ");

    try {
      const parsed = JSON.parse(languages);
      if (Array.isArray(parsed)) return parsed.join(" / ");
    } catch {
      /* Ignored: string is plain text, not JSON */
    }
    return languages.replace(/,/g, " / ");
  };

  const formatDurationDisplay = (
    durationHours?: number | string,
    durationText?: string
  ) => {
    if (durationHours !== undefined && durationHours !== null && durationHours !== "") {
      const num = Number(durationHours);
      if (!isNaN(num)) {
        return `${num} ${num === 1 ? "Hour" : "Hours"}`;
      }
      return String(durationHours);
    }
    return durationText || "2 Hours";
  };

  const handleBookTicketsClick = () => {
    if (remainingCapacity === 0) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsDrawerOpen((previous) => !previous);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setShowAuthModal(false);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="details-container details-state">
        <div className="details-loading-spinner" />
        <p className="status-text">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="details-container details-state">
        <p className="status-text">{error || "Event not found."}</p>
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Events
        </button>
      </div>
    );
  }

  const eventImage = event.image;
  const seatsLeft = remainingCapacity ?? Number(event.capacity ?? 0);
  const isSoldOut = !Number.isFinite(seatsLeft) || seatsLeft <= 0;

  const formattedTime =
    formatTimeString(event.time) || "(Time yet to be confirmed)";

  const startingPrice =
    tickets.length > 0
      ? Math.min(...tickets.map((ticket) => Number(ticket.price)))
      : Number(event.price || 0);

  const eventForBooking = {
    ...event,
    selected_ticket_id: selectedTicket?.id ?? null,
    selected_ticket_name: selectedTicket?.name ?? null,
    selected_ticket_price: selectedTicket
      ? Number(selectedTicket.price)
      : null,
  };

  const eventInstructions =
    event.additional_instructions || event.instructions;

  return (
    <>
      <div className="details-outer-container">
        <div className="details-page-bg">
          <main className="details-wrapper">
            <button className="back-button" onClick={() => navigate(-1)}>
              <FaArrowLeft />
              <span>Back to Events</span>
            </button>

            {/* Event hero */}
            <header className="details-hero">
              <img
                src={eventImage}
                alt={event.name || "Event backdrop"}
                className="hero-backdrop-img"
                onClick={() => eventImage && setShowImagePreview(true)}
                style={{ cursor: eventImage ? "pointer" : "default" }}
                onError={(e) => {
                  const image = e.currentTarget;
                  if (image.dataset.fallbackApplied !== "true") {
                    image.dataset.fallbackApplied = "true";
                  } else {
                    image.style.visibility = "hidden";
                  }
                }}
              />

              <div className="hero-overlay-shade" />

              <div className="hero-grid-content">
                <div
                  className="hero-poster-wrapper"
                  onClick={() => eventImage && setShowImagePreview(true)}
                  style={{ cursor: eventImage ? "pointer" : "default", position: "relative" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (eventImage) setShowImagePreview(true);
                    }
                  }}
                  title="Click to view full image"
                >
                  <img
                    src={eventImage}
                    alt={event.name || "Event poster"}
                    className="hero-poster-img"
                    onError={(e) => {
                      const image = e.currentTarget;
                      if (image.dataset.fallbackApplied !== "true") {
                        image.dataset.fallbackApplied = "true";
                      } else {
                        image.style.visibility = "hidden";
                      }
                    }}
                  />
                  {eventImage && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        background: "rgba(0, 0, 0, 0.65)",
                        color: "#fff",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "0.75rem",
                        backdropFilter: "blur(4px)",
                        pointerEvents: "none",
                      }}
                    >
                      <FaSearchPlus /> Click to view
                    </div>
                  )}
                </div>

                <div className="hero-info-column">
                  <div className="hero-tags-strip">
                    <span className="details-badge">
                      {event.category_name || "Event"}
                    </span>

                    <span className="details-sub-tag">
                      {getFormattedLanguages(event.languages)}
                    </span>

                    <span className="details-sub-tag">
                      {event.age_group || "All Ages"}
                    </span>

                    <span className="details-sub-tag">
                      <FaClock className="tag-icon" />{" "}
                      {formatDurationDisplay(event.duration_hours)}
                    </span>
                  </div>

                  <div className="details-title-row">
                    <h1 className="details-title">
                      {event.name || "Untitled event"}
                    </h1>
                    {(event.is_live === true || event.is_live === 1) && (
                      <span className="details-live-badge">
                        <span /> LIVE
                      </span>
                    )}
                  </div>

                  <div className="details-meta-cards">
                    <div className="meta-card">
                      <div className="meta-icon-wrapper">
                        <FaCalendarAlt />
                      </div>

                      <div>
                        <span className="meta-label">Date & Time</span>
                        <p className="meta-value">
                          {formatEventDate(event.event_date)}
                          {` • ${formattedTime}`}
                        </p>
                      </div>
                    </div>

                    <div className="meta-card">
                      <div className="meta-icon-wrapper">
                        <FaMapPin />
                      </div>

                      <div className="meta-venue-details">
                        <span className="meta-label">Location</span>
                        <p className="meta-value">
                          {event.location || "Venue TBA"}
                        </p>

                        {event.location && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              event.location
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="maps-link"
                          >
                            View on Maps{" "}
                            <FaExternalLinkAlt className="maps-icon" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Main content */}
            <div className="details-body">
              <section className="details-left">
                {/* About the Event */}
                <div className="content-card">
                  <h2 className="section-title">About the Event</h2>
                  <p className="details-description">
                    {event.description || "No description provided for this event."}
                  </p>
                </div>

                {/* Instructions & Amenities Section */}
                {eventInstructions && (
                  <div className="content-card">
                    <h2
                      className="section-title"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FaInfoCircle style={{ color: "var(--primary-color, #7c3aed)" }} />
                      Instructions & Venue Amenities
                    </h2>
                    <p
                      className="details-description"
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {eventInstructions}
                    </p>
                  </div>
                )}

                {/* Event ticket categories */}
                {tickets.length > 0 && (
                  <div className="content-card event-ticket-options">
                    <h2 className="section-title">Choose Your Ticket</h2>
                    <p className="ticket-selection-description">
                      Select your preferred ticket category.
                    </p>

                    <div className="event-ticket-list">
                      {tickets.map((ticket) => {
                        const isSelected = selectedTicket?.id === ticket.id;

                        return (
                          <button
                            key={ticket.id}
                            type="button"
                            className={`event-ticket-option ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={() => setSelectedTicket(ticket)}
                            aria-pressed={isSelected}
                          >
                            <span className="event-ticket-option-info">
                              <span className="event-ticket-name">
                                {ticket.name}
                                {isSelected && (
                                  <FaCheckCircle className="event-ticket-check" />
                                )}
                              </span>

                              {ticket.description && (
                                <span className="event-ticket-description">
                                  {ticket.description}
                                </span>
                              )}
                            </span>

                            <span className="event-ticket-price">
                              ₹{Number(ticket.price).toLocaleString("en-IN")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div
                  className="terms-action-card"
                  onClick={() => setShowTerms(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShowTerms(true);
                    }
                  }}
                >
                  <div className="terms-action-left">
                    <FaShieldAlt className="terms-shield-icon" />
                    <div>
                      <h4>Terms & Conditions</h4>
                      <p>
                        Cancellation policies, venue rules, and entry guidelines
                      </p>
                    </div>
                  </div>

                  <FaChevronRight className="terms-chevron" />
                </div>

                {/* Organised By expandable card */}
                <div className="content-card organiser-section">
                  <h2 className="section-title">Organised By</h2>
                  <OrganiserDetails
                    stageName={event.organiser_stage_name || event.stage_name}
                    description={event.organiser_description || event.organizer_description}
                    eventsCount={event.organiser_events_count || event.total_events_hosted}
                  />
                </div>
              </section>

              {/* Booking card */}
              <div className="booking-card">
                <div className="booking-card-header">
                  <div>
                    <span className="booking-card-title">Reserve Spot</span>
                    <span className="booking-card-sub">
                      {isSoldOut ? "Tickets sold out" : "Instant confirmation"}
                    </span>
                  </div>
                </div>

                {isSoldOut ? (
                  <p className="booking-capacity-notice sold-out">
                    Tickets sold out
                  </p>
                ) : seatsLeft <= 15 ? (
                  <p className="booking-capacity-notice" role="status">
                    Only {seatsLeft}{" "}
                    {seatsLeft === 1 ? "seat" : "seats"} left
                  </p>
                ) : null}

                {!isDrawerOpen ? (
                  <button
                    type="button"
                    className="book-now-button"
                    onClick={handleBookTicketsClick}
                    disabled={isSoldOut || (tickets.length > 0 && !selectedTicket)}
                  >
                    {isSoldOut ? "Tickets Sold Out" : "Book Tickets"}
                  </button>
                ) : (
                  <div className="inline-booking-wrapper">
                    <Booking
                      isOpen={isDrawerOpen}
                      onClose={() => setIsDrawerOpen(false)}
                      event={eventForBooking}
                      capacityLeft={isSoldOut ? 0 : seatsLeft}
                      onCapacityChanged={(capacityLeft) => {
                        setRemainingCapacity(capacityLeft);
                        window.localStorage.setItem(
                          `citypass:event-booked:${event.id}`,
                          String(Math.max(0, Number(event.capacity ?? 0) - capacityLeft))
                        );
                      }}
                      onRequireAuth={() => setShowAuthModal(true)}
                    />
                  </div>
                )}

                <p className="booking-guarantee">
                  Official verified ticket • 100% Secure Checkout
                </p>
              </div>
            </div>
          </main>
        </div>

        {/* Mobile booking bar */}
        <div className="mobile-floating-checkout-bar">
          <div className="mobile-checkout-price">
            <span className="mobile-checkout-label">
              {selectedTicket ? selectedTicket.name : "From"}
            </span>

            <span className="mobile-checkout-amount">
              ₹
              {(selectedTicket
                ? Number(selectedTicket.price)
                : startingPrice
              ).toLocaleString("en-IN")}
            </span>
          </div>

          <button
            type="button"
            className="mobile-book-now-btn"
            onClick={handleBookTicketsClick}
            disabled={isSoldOut || (tickets.length > 0 && !selectedTicket)}
          >
            {isSoldOut ? "Sold Out" : "Book Now"}
          </button>
        </div>
      </div>

      {showImagePreview && eventImage && (
        <div
          className="image-lightbox-overlay"
          onClick={() => setShowImagePreview(false)}
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <button
            type="button"
            onClick={() => setShowImagePreview(false)}
            aria-label="Close image preview"
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#fff",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1.2rem",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)")
            }
          >
            <FaTimes />
          </button>

          <img
            src={eventImage}
            alt={event.name || "Event preview"}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "88vh",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
              userSelect: "none",
            }}
          />
        </div>
      )}

      {showAuthModal && (
        <Auth
          initialLogin={true}
          redirectOnSuccess={false}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
    </>
  );
}

export default EventDetails;