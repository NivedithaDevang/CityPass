import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events } from "../../types/auth";
import Navbar from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
import { FaMapPin, FaCalendarAlt, FaArrowLeft, FaShieldAlt, FaChevronRight } from "react-icons/fa";
import { FaTicketAlt } from "react-icons/fa";
import { createEventSlug } from "../../config/slug";
import { TermsModal } from "../Terms/Terms";
import { OrganiserDetails } from "../OrganiserCard/OrganiserCard";
import "./EventDetails.css";

function EventDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Events | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/v1/events/${slug}`);
        const loadedEvent = response.data.event || response.data;
        setEvent(loadedEvent);

        const canonicalSlug = createEventSlug(loadedEvent.name);
        if (canonicalSlug && canonicalSlug !== slug) {
          navigate(`/events/${canonicalSlug}`, { replace: true });
        }
        document.title = `${loadedEvent.name || "Event"} | CityPass`;
      } catch (err) {
        console.error("Error loading event:", err);
        setError("Failed to load event details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchEventDetails();
  }, [slug, navigate]);

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(eventDate));
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

  return (
    <>
      <Navbar />
      <div className="details-page-bg">
        <main className="details-wrapper">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft /> <span>Back to Events</span>
          </button>

          {/* Hero Section */}
          <header className="details-hero">
            <div className="hero-top-row">
              <span className="details-badge">{event.category_name || "Event"}</span>
            </div>

            <h1 className="details-title">{event.name || "Untitled event"}</h1>

            <div className="details-meta-cards">
              <div className="meta-card">
                <div className="meta-icon-wrapper">
                  <FaCalendarAlt />
                </div>
                <div>
                  <span className="meta-label">Date & Time</span>
                  <p className="meta-value">{formatEventDate(event.event_date)}</p>
                </div>
              </div>

              <div className="meta-card">
                <div className="meta-icon-wrapper">
                  <FaMapPin />
                </div>
                <div>
                  <span className="meta-label">Location</span>
                  <p className="meta-value">{event.location || "Venue TBA"}</p>
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

              {/* Clickable Terms & Policy Banner */}
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

              {/* Organiser Section */}
              <div className="content-card organiser-section">
                <h2 className="section-title">Organised By</h2>
                <OrganiserDetails />
              </div>
            </section>

            {/* Sticky Booking Card */}
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

                <div className="booking-price-container">
                  <span className="price-tag-label">Tickets starting from</span>
                  <p className="price-tag-amount">
                    ₹ {Number(event.price || 0).toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  className="book-now-button"
                  onClick={() => {
                    navigate(`/events/${slug}/book`, { state: { event } });
                  }}
                >
                  Book Tickets
                </button>

                <p className="booking-guarantee">
                  Official verified ticket - 100% Secure Checkout
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <Footer />
    </>
  );
}

export default EventDetails;