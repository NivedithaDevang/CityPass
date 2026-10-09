import "./Hero.css";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events } from "../../types/auth";
import {
  FaArrowRight,
  FaCompass,
  FaLocationDot,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarDays,
  FaTicket,
} from "react-icons/fa6";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/pagination";

function Hero() {
  const navigate = useNavigate();

  const [featuredEvents, setFeaturedEvents] = useState<Events[]>([]);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
  const fetchHeroEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/events/events`);
      const rawData = response.data;

      const eventList: Events[] = Array.isArray(rawData)
        ? rawData
        : rawData?.events || rawData?.data || [];

      // Current timestamp (right now)
      const now = new Date().getTime();

      const parseToTimestamp = (event: Events): number | null => {
        if (!event.event_date) return null;

        // Extract "YYYY-MM-DD" regardless of whether it's ISO, SQL, or standard date string
        const dateStr = event.event_date.toString();
        const cleanDatePart = dateStr.includes("T")
          ? dateStr.split("T")[0]
          : dateStr.split(" ")[0];

        const [year, month, day] = cleanDatePart.split("-").map(Number);
        if (!year || !month || !day) {
          const fallback = new Date(event.event_date).getTime();
          return isNaN(fallback) ? null : fallback;
        }

        // Extract time components if present (e.g., "18:30:00" or "02:30:00")
        let hours = 23;
        let minutes = 59;
        let seconds = 59;

        const timeField = (event as any).time;
        if (timeField && typeof timeField === "string" && timeField.includes(":")) {
          const timeParts = timeField.split(":").map(Number);
          hours = timeParts[0] ?? 0;
          minutes = timeParts[1] ?? 0;
          seconds = timeParts[2] ?? 0;
        }

        // Construct exact local date instance: Month is 0-indexed in JS (month - 1)
        const eventDateObj = new Date(year, month - 1, day, hours, minutes, seconds);
        const timeVal = eventDateObj.getTime();

        return isNaN(timeVal) ? null : timeVal;
      };

      // 1. Filter out all events where the event timestamp is strictly less than right now
      // 2. Sort by nearest upcoming event first
      const upcomingEvents = eventList
        .filter((event) => {
          const eventTime = parseToTimestamp(event);
          if (eventTime === null) return false;
          return eventTime >= now;
        })
        .sort((a, b) => {
          const timeA = parseToTimestamp(a) || 0;
          const timeB = parseToTimestamp(b) || 0;
          return timeA - timeB;
        })
        .slice(0, 5);

      setFeaturedEvents(upcomingEvents);
    } catch (error) {
      console.error("Error fetching hero carousel events:", error);
    }
  };

  fetchHeroEvents();
}, []);

  // Update Swiper after events are loaded
  useEffect(() => {
    if (swiperRef.current && featuredEvents.length > 1) {
      swiperRef.current.update();
      swiperRef.current.autoplay?.start();
    }
  }, [featuredEvents]);

  const formatHeroDate = (dateStr?: string) => {
    if (!dateStr) return "Upcoming";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  };

  const handleEventNavigate = (event: Events) => {
    if (!event.slug) {
      console.error("Event slug is missing:", event);
      return;
    }

    navigate(`/events/${event.slug}`);
  };

  return (
    <section className="hero">
      <div className="hero-glow glow-top" />
      <div className="hero-glow glow-bottom" />

      <div className="hero-container">

        {/* Left Column */}
        <div className="hero-content">

          <div className="hero-badge">
            <span className="hero-badge-pulse" />
            <span>Live in 8+ Major Cities</span>
          </div>

          <h1>
            Discover what's <br />
            <span className="hero-gradient-text">
              happening around you.
            </span>
          </h1>

          <p className="hero-description">
            Top-rated concerts, stand-up specials, pop-up markets,
            and sports experiences curated across your city every
            weekend.
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
                const popularSection =
                  document.querySelector(".city-section");

                popularSection?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <FaCompass />
              <span>Browse Cities</span>
            </button>

          </div>
        </div>

        {/* Right Column */}
        <div className="hero-carousel-wrapper">

          {featuredEvents.length > 0 ? (
            <div className="featured-showcase-container">

              {/* Carousel Header */}
              <div className="showcase-nav-header">

                <span className="showcase-label">
                  UPCOMING EVENTS
                </span>

                <div className="showcase-controls">

                  <button
                    type="button"
                    className="showcase-arrow"
                    onClick={() =>
                      swiperRef.current?.slidePrev()
                    }
                    aria-label="Previous event"
                  >
                    <FaChevronLeft />
                  </button>

                  <button
                    type="button"
                    className="showcase-arrow"
                    onClick={() =>
                      swiperRef.current?.slideNext()
                    }
                    aria-label="Next event"
                  >
                    <FaChevronRight />
                  </button>

                </div>
              </div>

              <Swiper
                modules={[Autoplay, Pagination]}
                slidesPerView={1}
                spaceBetween={24}
                grabCursor={true}
                observer={true}
                observeParents={true}
                autoplay={
                  featuredEvents.length > 1
                    ? {
                        delay: 2500,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                      }
                    : false
                }
                pagination={{
                  clickable: true,
                  el: ".hero-swiper-pagination",
                }}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                className="hero-swiper"
              >

                {featuredEvents.map((event) => (
                  <SwiperSlide
                    key={event.id || event.name}
                  >
                    <div
                      className="ticket-card"
                      onClick={() =>
                        handleEventNavigate(event)
                      }
                    >

                      {/* Ticket Top */}
                      <div className="ticket-top">

                        <span className="ticket-category">
                          {event.category_name || "FEATURED"}
                        </span>

                        <span className="ticket-price">
                          ₹ {event.price || "Free"}
                        </span>

                      </div>

                      {/* Ticket Body */}
                      <div className="ticket-body">

                        <h3 className="ticket-title">
                          {event.name}
                        </h3>

                        <div className="ticket-meta-row">

                          <span className="ticket-meta">
                            <FaLocationDot />
                            {event.location || "City Venue"}
                          </span>

                          <span className="ticket-meta">
                            <FaCalendarDays />
                            {formatHeroDate(event.event_date)}
                          </span>

                        </div>

                      </div>

                      {/* Perforated Divider */}
                      <div className="ticket-perforation">

                        <div className="dashed-line" />

                      </div>

                      {/* Ticket Footer */}
                      <div className="ticket-footer">

                        <div className="ticket-perk">
                          <span className="perk-dot" />
                          <span>Instant Confirmation</span>
                        </div>

                        <button
                          type="button"
                          className="ticket-book-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventNavigate(event);
                          }}
                        >
                          <FaTicket />
                          <span>Book Now</span>
                        </button>

                      </div>
                    </div>
                  </SwiperSlide>
                ))}

              </Swiper>

              <div className="hero-swiper-pagination" />

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