
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events, type User } from "../../types/auth";
import { useUser } from "../../context/UserContext";
import Navbar from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
import {
  FaMapPin,
  FaCalendarAlt,
  FaArrowLeft,
  FaShieldAlt,
  FaChevronRight,
  FaTicketAlt,
  FaExternalLinkAlt,
  FaClock,
  FaFire,
  FaCheckCircle,
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
  image_url?: string;
  poster_url?: string;
  banner_image?: string;
}

function EventDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const [event, setEvent] = useState<EventWithTickets | null>(null);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [selectedTicket, setSelectedTicket] =
    useState<EventTicket | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${API_BASE_URL}/v1/events/${slug}`
        );

        const loadedEvent: EventWithTickets =
          response.data.event || response.data;

        setEvent(loadedEvent);

        // The event API should return the event-specific ticket records.
        const eventTicketList: EventTicket[] = (
          loadedEvent.event_tickets ||
          loadedEvent.tickets ||
          []
        ).filter(
          (ticket) =>
            ticket.status === undefined ||
            ticket.status === "ACTIVE"
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

  const handleBookTicketsClick = () => {
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
      <>
        <Navbar />
        <div className="details-container details-state">
          <div className="details-loading-spinner" />
          <p className="status-text">Loading event details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="details-container details-state">
          <p className="status-text">
            {error || "Event not found."}
          </p>

          <button
            className="back-button"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Back to Events
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const eventBackgrounds = [
    "/eventBG/image1.png",
    "/eventBG/image2.png",
    "/eventBG/image3.png",
  ];

  const fallbackImage =
    eventBackgrounds[event.id % eventBackgrounds.length];

  const eventImage =
    event.image ||
    event.poster_url ||
    event.image_url ||
    event.banner_image;

  const posterImage = eventImage || fallbackImage;

  const formattedTime =
    formatTimeString(event.time) ||
    "(Time yet to be confirmed)";

  const startingPrice =
    tickets.length > 0
      ? Math.min(...tickets.map((ticket) => Number(ticket.price)))
      : Number(event.price || 0);

  // Pass the selected event-ticket details to the booking component.
  // Booking.tsx must use selected_ticket_id when creating the booking.
  const eventForBooking = {
    ...event,
    selected_ticket_id: selectedTicket?.id ?? null,
    selected_ticket_name: selectedTicket?.name ?? null,
    selected_ticket_price: selectedTicket
      ? Number(selectedTicket.price)
      : null,
  };

  return (
    <>
      <Navbar />

      <div className="details-outer-container">
        <div className="details-page-bg">
          <main className="details-wrapper">
            <button
              className="back-button"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft />
              <span>Back to Events</span>
            </button>

            {/* Event hero */}
            <header className="details-hero">
              <img
                src={posterImage}
                alt={event.name || "Event backdrop"}
                className="hero-backdrop-img"
                onError={(e) => {
                  const image = e.currentTarget;

                  if (image.dataset.fallbackApplied !== "true") {
                    image.dataset.fallbackApplied = "true";
                    image.src = fallbackImage;
                  } else {
                    image.style.visibility = "hidden";
                  }
                }}
              />

              <div className="hero-overlay-shade" />

              <div className="hero-grid-content">
                <div className="hero-poster-wrapper">
                  <img
                    src={posterImage}
                    alt={event.name || "Event poster"}
                    className="hero-poster-img"
                    onError={(e) => {
                      const image = e.currentTarget;

                      if (image.dataset.fallbackApplied !== "true") {
                        image.dataset.fallbackApplied = "true";
                        image.src = fallbackImage;
                      } else {
                        image.style.visibility = "hidden";
                      }
                    }}
                  />
                </div>

                <div className="hero-info-column">
                  <div className="hero-tags-strip">
                    <span className="details-badge">
                      {event.category_name || "Event"}
                    </span>

                    <span className="details-sub-tag">
                      English / Hindi
                    </span>

                    <span className="details-sub-tag">16+</span>

                    <span className="details-sub-tag">
                      <FaClock className="tag-icon" /> 2 Hours
                    </span>
                  </div>

                  <h1 className="details-title">
                    {event.name || "Untitled event"}
                  </h1>

                  <div className="details-meta-cards">
                    <div className="meta-card">
                      <div className="meta-icon-wrapper">
                        <FaCalendarAlt />
                      </div>

                      <div>
                        <span className="meta-label">
                          Date & Time
                        </span>

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
                        <span className="meta-label">
                          Location
                        </span>

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
                <div className="content-card">
                  <h2 className="section-title">
                    About the Event
                  </h2>

                  <p className="details-description">
                    {event.description ||
                      "No description provided for this event."}
                  </p>
                </div>

                {/* Event ticket categories */}
                {tickets.length > 0 && (
                  <div className="content-card event-ticket-options">
                    <h2 className="section-title">
                      Choose Your Ticket
                    </h2>

                    <p className="ticket-selection-description">
                      Select your preferred ticket category.
                    </p>

                    <div className="event-ticket-list">
                      {tickets.map((ticket) => {
                        const isSelected =
                          selectedTicket?.id === ticket.id;

                        return (
                          <button
                            key={ticket.id}
                            type="button"
                            className={`event-ticket-option ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={() =>
                              setSelectedTicket(ticket)
                            }
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
                              ₹
                              {Number(ticket.price).toLocaleString(
                                "en-IN"
                              )}
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
                        Cancellation policies, venue rules, and
                        entry guidelines
                      </p>
                    </div>
                  </div>

                  <FaChevronRight className="terms-chevron" />
                </div>

                <div className="content-card organiser-section">
                  <h2 className="section-title">
                    Organised By
                  </h2>

                  <OrganiserDetails
                    stageName={event.organiser_stage_name}
                    userName={event.organiser_user_name}
                  />
                </div>
              </section>

              {/* Booking card */}
              <aside className="details-sidebar">
                <div className="booking-card">
                  <div className="booking-card-header">
                    <div>
                      <div className="booking-icon-circle">
                        <FaTicketAlt />
                      </div>

                      <span className="booking-card-title">
                        Reserve Spot
                      </span>

                      <span className="booking-card-sub">
                        Instant confirmation
                      </span>
                    </div>
                  </div>

                  <div className="urgency-pill">
                    <FaFire className="urgency-icon" />
                    <span>
                      Filling fast • Limited tickets available
                    </span>
                  </div>

                  <div className="booking-price-container">
                    <span className="price-tag-label">
                      {tickets.length > 0
                        ? "Selected ticket price"
                        : "Tickets starting from"}
                    </span>

                    <p className="price-tag-amount">
                      ₹
                      {(selectedTicket
                        ? Number(selectedTicket.price)
                        : startingPrice
                      ).toLocaleString("en-IN")}
                    </p>

                    {selectedTicket && (
                      <p className="selected-ticket-summary">
                        {selectedTicket.name}
                      </p>
                    )}
                  </div>

                  {!isDrawerOpen ? (
                    <button
                      type="button"
                      className="book-now-button"
                      onClick={handleBookTicketsClick}
                      disabled={
                        tickets.length > 0 && !selectedTicket
                      }
                    >
                      Book Tickets
                    </button>
                  ) : (
                    <div className="inline-booking-wrapper">
                      <Booking
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        event={eventForBooking}
                        onRequireAuth={() => setShowAuthModal(true)}
                      />
                    </div>
                  )}

                  <p className="booking-guarantee">
                    Official verified ticket • 100% Secure Checkout
                  </p>
                </div>
              </aside>
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
            disabled={tickets.length > 0 && !selectedTicket}
          >
            Book Now
          </button>
        </div>
      </div>

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

      <Footer />
    </>
  );
}

export default EventDetails;
