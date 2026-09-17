import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events } from "../../types/auth";
import Navbar from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
import { FaMapPin, FaCalendarAlt, FaArrowLeft, FaArrowRight } from "react-icons/fa";
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
const response = await axios.get(
    `${API_BASE_URL}/v1/events/${slug}`
);        // Adjust according to your API payload shape (e.g., response.data.event or response.data)
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
            <FaArrowLeft /> Go Back
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="details-wrapper">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Events
        </button>

        {/* Hero Section */}
        <header className="details-hero">
          <p className="details-eyebrow">Discover your next experience</p>
          <span className="details-badge">{event.category_name || "Event"}</span>
          <h1>{event.name || "Untitled event"}</h1>
          <div className="details-meta">
            <span><FaCalendarAlt /> {formatEventDate(event.event_date)}</span>
            <span><FaMapPin /> {event.location || "Venue TBA"}</span>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="details-body">
          <section className="details-left">
            <div className="details-section">
              <h2>About</h2>
              <p className="details-description">
                {event.description || "No description provided for this event."}
              </p>
                            <h2>Terms & Conditions
                              <FaArrowRight size = {14} className="terms-link" onClick={() => setShowTerms(true)} />

                            </h2>

            </div>

<TermsModal
  isOpen={showTerms}
  onClose={() => setShowTerms(false)} />


  <div className="organiser-details">
<h2>Organised by</h2>

<OrganiserDetails />



  </div>
          </section>


          {/* Sticky Booking Card */}
          <aside className="details-sidebar">
            <div className="booking-card">
              <div className="booking-card-heading">
                <FaTicketAlt aria-hidden="true" />
                <span>Reserve your spot</span>
              </div>
              <span className="price-tag-label">Tickets from</span>
              <p className="price-tag-amount">₹ {event.price || "TBA"}</p>
              <button 
                type="button" 
                className="book-now-button"
onClick={() => {
              navigate("/bookings");
            }}>
                Book tickets
              </button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default EventDetails;