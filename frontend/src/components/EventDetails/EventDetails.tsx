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
} from "react-icons/fa";
import { TermsModal } from "../Terms/EventTerms";
import { OrganiserDetails } from "../OrganiserCard/OrganiserCard";
import { Booking } from "../Booking/Booking";
import Auth from "../Auth/Auth";
import "./EventDetails.css";

function EventDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const [event, setEvent] = useState<Events | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `${API_BASE_URL}/v1/events/${slug}`
        );

        const loadedEvent = response.data.event || response.data;

        setEvent(loadedEvent);
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

  // Formats date only (e.g., "Thursday, October 29, 2026")
  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
    }).format(new Date(eventDate));
  };

  // Formats time string (e.g., "02:30:00" -> "2:30 AM")
  const formatTimeString = (timeStr?: string) => {
    if (!timeStr) return "";

    const [hours, minutes] = timeStr.split(":");
    if (hours === undefined || minutes === undefined) return timeStr;

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
    setIsDrawerOpen((prev) => !prev);
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
          <p className="status-text">{error || "Event not found."}</p>
          <button className="back-button" onClick={() => navigate(-1)}>
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
  const fallbackImage = eventBackgrounds[event.id % eventBackgrounds.length];
  const eventImage =
    (event as any).image ||
    (event as any).poster_url ||
    (event as any).image_url ||
    (event as any).banner_image;
  const posterImage = eventImage || fallbackImage;
  const formattedTime = formatTimeString(event.time) || "(Time yet to be confirmed)";

  return (
    <>
     <Navbar />
    <div className="details-outer-container">
     

      <div className="details-page-bg">
        <main className="details-wrapper">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft /> <span>Back to Events</span>
          </button>

          {/* BookMyShow / District Style Hero Section */}
          <header className="details-hero">
            {posterImage && (
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
            )}
            <div className="hero-overlay-shade" />

            <div className="hero-grid-content">
              {posterImage && (
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
              )}

              <div className="hero-info-column">
                <div className="hero-tags-strip">
                  <span className="details-badge">
                    {event.category_name || "Event"}
                  </span>
                  <span className="details-sub-tag">English / Hindi</span>
                  <span className="details-sub-tag">16+</span>
                  <span className="details-sub-tag">
                    <FaClock className="tag-icon" /> 2 Hours
                  </span>
                </div>

                <h1 className="details-title">{event.name || "Untitled event"}</h1>

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
                      <p className="meta-value">{event.location || "Venue TBA"}</p>
                      {event.location && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            event.location
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="maps-link"
                        >
                          View on Maps <FaExternalLinkAlt className="maps-icon" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Layout */}
          <div className="details-body">
            <section className="details-left">
              <div className="content-card">
                <h2 className="section-title">About the Event</h2>
                <p className="details-description">
                  {event.description || "No description provided for this event."}
                </p>
              </div>

              <div
                className="terms-action-card"
                onClick={() => setShowTerms(true)}
                role="button"
                tabIndex={0}
              >
                <div className="terms-action-left">
                  <FaShieldAlt className="terms-shield-icon" />
                  <div>
                    <h4>Terms & Conditions</h4>
                    <p>Cancellation policies, venue rules, and entry guidelines</p>
                  </div>
                </div>
                <FaChevronRight className="terms-chevron" />
              </div>

              <div className="content-card organiser-section">
                <h2 className="section-title">Organised By</h2>
                <OrganiserDetails
                  stageName={event.organiser_stage_name}
                  userName={event.organiser_user_name}
                />
              </div>
            </section>

            {/* In-place Booking Card */}
            <aside className="details-sidebar">
              <div className="booking-card">
                <div className="booking-card-header">
                  <div>
                    <div className="booking-icon-circle">
                      <FaTicketAlt />
                    </div>
                    <span className="booking-card-title">Reserve Spot</span>
                    <span className="booking-card-sub">Instant confirmation</span>
                  </div>
                </div>

                {/* Urgency Trigger */}
                <div className="urgency-pill">
                  <FaFire className="urgency-icon" />
                  <span>Filling fast • Limited tickets available</span>
                </div>

                <div className="booking-price-container">
                  <span className="price-tag-label">Tickets starting from</span>
                  <p className="price-tag-amount">
                    ₹ {Number(event.price || 0).toLocaleString()}
                  </p>
                </div>

                {!isDrawerOpen ? (
                  <button
                    type="button"
                    className="book-now-button"
                    onClick={handleBookTicketsClick}
                  >
                    Book Tickets
                  </button>
                ) : (
                  <div className="inline-booking-wrapper">
                    <Booking
                      isOpen={isDrawerOpen}
                      onClose={() => setIsDrawerOpen(false)}
                      event={event}
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

      {/* Mobile Sticky Booking Bar */}
      <div className="mobile-floating-checkout-bar">
        <div className="mobile-checkout-price">
          <span className="mobile-checkout-label">From</span>
          <span className="mobile-checkout-amount">
            ₹{Number(event.price || 0).toLocaleString()}
          </span>
        </div>
        <button
          type="button"
          className="mobile-book-now-btn"
          onClick={handleBookTicketsClick}
        >
          Book Now
        </button>
      </div>

      {showAuthModal && (
        <Auth
          initialLogin={true}
          redirectOnSuccess={false}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <Footer />
    </div>
    </>
  );
}

export default EventDetails;