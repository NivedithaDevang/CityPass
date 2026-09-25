import "./Hero.css";
import { useEffect, useState, useRef } from "react";
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
  FaTicket,
} from "react-icons/fa6";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/pagination";

function Hero() {
  const navigate = useNavigate();
  //store events displayed in the hero carousel
  const [featuredEvents, setFeaturedEvents] = useState<Events[]>([]);
  //store swiper instance so that the custoom -> / <- buttons can control it
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const fetchHeroEvents = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/events`);
        //extract events from API response
        const eventList: Events[] = response.data.events || [];
        setFeaturedEvents(eventList.slice(0, 5));
      } catch (error) {
        console.error("Error fetching hero carousel events:", error);
      }
    };

    fetchHeroEvents();
  }, []);

  const formatHeroDate = (dateStr?: string) => {
    if (!dateStr) return "Upcoming";
    return new Intl.DateTimeFormat("en-US", {
      month: "short", //ex: Sep 24
      day: "numeric",
    }).format(new Date(dateStr));
  };

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
            Discover what's <br />
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

        {/* Right Column: Solid Ticket Showcase Carousel */}
        <div className="hero-carousel-wrapper">
          {featuredEvents.length > 0 ? (
            <div className="featured-showcase-container">
              {/* Header Navigation with Next/Prev Arrows */}
              <div className="showcase-nav-header">
                <span className="showcase-label">FEATURED PASSES</span>
                <div className="showcase-controls">
                  <button
                    type="button"
                    className="showcase-arrow"
                    onClick={() => swiperRef.current?.slidePrev()}
                    aria-label="Previous event"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    type="button"
                    className="showcase-arrow"
                    onClick={() => swiperRef.current?.slideNext()}
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
                autoplay={{
                  delay: 2500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                pagination={{
                  clickable: true,
                  el: ".hero-swiper-pagination",
                }}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                className="hero-swiper"
              >
                {featuredEvents.map((event) => {
                  const slug = createEventSlug(event.name);

                  return (
                    <SwiperSlide key={event.id || event.name}>
                      <div
                        className="ticket-card"
                        onClick={() => navigate(`/events/${slug}`)}
                      >
                        {/* Ticket Top: Category & Price */}
                        <div className="ticket-top">
                          <span className="ticket-category">
                            {event.category_name || "FEATURED"}
                          </span>
                          <span className="ticket-price">
                            ₹ {event.price || "Free"}
                          </span>
                        </div>

                        {/* Ticket Middle: Title & Meta */}
                        <div className="ticket-body">
                          <h3 className="ticket-title">{event.name}</h3>

                          <div className="ticket-meta-row">
                            <span className="ticket-meta">
                              <FaLocationDot /> {event.location || "City Venue"}
                            </span>
                            <span className="ticket-meta">
                              <FaCalendarDays /> {formatHeroDate(event.event_date)}
                            </span>
                          </div>
                        </div>

                        {/* Perforated Divider with Cutout Notches */}
                        <div className="ticket-perforation">
                          <span className="notch notch-left" />
                          <div className="dashed-line" />
                          <span className="notch notch-right" />
                        </div>

                        {/* Ticket Bottom: Action button */}
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
                              navigate(`/events/${slug}`);
                            }}
                          >
                            <FaTicket />
                            <span>Book Now</span>
                          </button>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
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