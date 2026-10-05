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
        const response = await axios.get(
          `${API_BASE_URL}/v1/events/events`
        );

        const rawData = response.data;

        // Supports:
        // 1. Direct array: [...]
        // 2. { events: [...] }
        // 3. { data: [...] }
        const eventList: Events[] = Array.isArray(rawData)
          ? rawData
          : rawData?.events || rawData?.data || [];

        setFeaturedEvents(eventList.slice(0, 5));
      } catch (error) {
        console.error(
          "Error fetching hero carousel events:",
          error
        );
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
                  FEATURED PASSES
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
