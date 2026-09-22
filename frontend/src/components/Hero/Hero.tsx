import "./Hero.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events } from "../../types/auth";
import { createEventSlug } from "../../config/slug";
import {
  FaArrowRight,
  FaCompass,
  FaLocationDot,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarDays,
} from "react-icons/fa6";

function Hero() {
  const navigate = useNavigate();
  const [featuredEvents, setFeaturedEvents] = useState<Events[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch top 5 events for the carousel
  useEffect(() => {
    const fetchHeroEvents = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/events`);
        const eventList: Events[] = response.data.events || [];
        setFeaturedEvents(eventList.slice(0, 5));
      } catch (error) {
        console.error("Error fetching hero carousel events:", error);
      }
    };

    fetchHeroEvents();
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (featuredEvents.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [featuredEvents.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? featuredEvents.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredEvents.length);
  };

  const formatHeroDate = (dateStr?: string) => {
    if (!dateStr) return "Upcoming";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  };

  const activeEvent = featuredEvents[currentIndex];

  return (
    <section className="hero">
      <div className="hero-glow glow-top" />
      <div className="hero-glow glow-bottom" />

      <div className="hero-container">
        {/* Left Column: Heading & CTAs */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-pulse" />
            <span>Live in 8+ Major Cities</span>
          </div>

          <h1>
            Discover what’s <br />
            <span className="hero-gradient-text">happening around you.</span>
          </h1>

          <p className="hero-description">
            Top-rated concerts, stand-up specials, pop-up markets, and sports
            experiences curated across your city every weekend.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-button primary"
              onClick={() => navigate("/events")}
            >
              <span>Explore Events</span>
              <FaArrowRight className="hero-btn-icon" />
            </button>

            <button
              type="button"
              className="hero-button secondary"
              onClick={() => {
                const popularSection = document.querySelector(".city-section");
                popularSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <FaCompass />
              <span>Browse Cities</span>
            </button>
          </div>
        </div>

        {/* Right Column: Glassmorphic Event Carousel */}
        <div className="hero-carousel-wrapper">
          {activeEvent ? (
            <div
              className="hero-carousel-card"
              onClick={() =>
                navigate(`/events/${createEventSlug(activeEvent.name)}`)
              }
            >
              <div className="carousel-top-bar">
                <span className="carousel-tag">
                  {activeEvent.category_name || "FEATURED"}
                </span>
                <span className="carousel-price">
                  ₹ {activeEvent.price || "Free"}
                </span>
              </div>

              <h3 className="carousel-title">{activeEvent.name}</h3>

              <div className="carousel-meta-row">
                <span className="carousel-meta">
                  <FaLocationDot /> {activeEvent.location || "City Venue"}
                </span>
                <span className="carousel-meta">
                  <FaCalendarDays /> {formatHeroDate(activeEvent.event_date)}
                </span>
              </div>

              <div className="carousel-footer">
                <button
                  type="button"
                  className="carousel-book-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/events/${createEventSlug(activeEvent.name)}`);
                  }}
                >
                  Book Tickets
                </button>

                {/* Left/Right manual arrows */}
                <div
                  className="carousel-nav-arrows"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="carousel-arrow"
                    onClick={handlePrev}
                    aria-label="Previous event"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    type="button"
                    className="carousel-arrow"
                    onClick={handleNext}
                    aria-label="Next event"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>

              {/* Indicator Dots */}
              <div
                className="carousel-dots"
                onClick={(e) => e.stopPropagation()}
              >
                {featuredEvents.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`carousel-dot ${
                      i === currentIndex ? "active" : ""
                    }`}
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="hero-carousel-skeleton" />
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;