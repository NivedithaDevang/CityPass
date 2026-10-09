import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events } from "../../types/auth";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { FaMapPin, FaMicrophone, FaLaughSquint } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy } from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";
import { FaPaintbrush, FaMountain } from "react-icons/fa6";
import type { IconType } from "react-icons";
import "./EventSection.css";

const isUpcomingEvent = (event: Events): boolean => {
  if (!event.event_date) return false;

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(event.event_date);
  const eventDate = dateOnly
    ? new Date(`${event.event_date}T00:00:00`)
    : new Date(event.event_date);

  if (Number.isNaN(eventDate.getTime())) return false;

  const eventTime = event.time?.trim();
  const timeMatch = eventTime?.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    eventDate.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
    return eventDate.getTime() >= Date.now();
  }

  if (dateOnly) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate.getTime() >= today.getTime();
  }

  return eventDate.getTime() >= Date.now();
};

function EventSection() {
  const navigate = useNavigate();
  const { selectedCity } = useCity(); // Access current selected city
  const [events, setEvents] = useState<Events[]>([]);

  const categoryIcons: Record<string, IconType> = {
    Music: FaMicrophone,
    Sports: MdSportsFootball,
    Comedy: MdTheaterComedy,
    Food: IoFastFoodSharp,
    Art: FaPaintbrush,
    Adventure: FaMountain,
    Entertainment: FaLaughSquint,
  };

  const getCategoryIcon = (categoryName?: string | null) => {
    const normalizedCategory = categoryName?.toLowerCase() || "";
    if (normalizedCategory.includes("music")) return categoryIcons.Music;
    if (normalizedCategory.includes("sport")) return categoryIcons.Sports;
    if (normalizedCategory.includes("comedy")) return categoryIcons.Comedy;
    if (normalizedCategory.includes("food")) return categoryIcons.Food;
    if (normalizedCategory.includes("art")) return categoryIcons.Art;
    if (normalizedCategory.includes("adventure")) return categoryIcons.Adventure;
    if (normalizedCategory.includes("entertainment")) return categoryIcons.Entertainment;
    return null;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/events/events`);
        const rawData = response.data;
        const eventList: Events[] = Array.isArray(rawData)
          ? rawData
          : rawData?.events || rawData?.data || [];
        setEvents(eventList);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
      new Date(eventDate)
    );
  };

  const handleCardClick = (event: Events) => {
    if (!event.slug) {
      console.warn("Event is missing a slug! Event ID:", event.id);
      return;
    }
    navigate(`/events/${event.slug}`);
  };

  // Filter events by selected city (supports event.city or matches inside event.location)
  const filteredEvents = events.filter((event: any) => {
    if (!isUpcomingEvent(event)) return false;

    if (!selectedCity || selectedCity === ALL_LOCATIONS) {
      return true;
    }

    const targetCity = selectedCity.trim().toLowerCase();
    const eventCity = (event.city || "").trim().toLowerCase();
    const eventLocation = (event.location || "").trim().toLowerCase();

    return (
      eventCity === targetCity ||
      eventLocation.includes(targetCity)
    );
  });

  // Limit display to the first 8 matching events
  const displayedEvents = filteredEvents.slice(0, 8);

  return (
    <section className="eventsec-section">
      <div className="event-section-heading">
        <p>THE LINEUP</p>
        <h2>
          {selectedCity && selectedCity !== ALL_LOCATIONS
            ? `Best Plans in ${selectedCity}`
            : "The City's Best Plans"}
        </h2>
        <span>Limited passes, standing pits, and reserved seats up for grabs.</span>
      </div>

      <div className="eventsec-grid">
        {displayedEvents.map((event) => {
          const CategoryIcon = getCategoryIcon(event.category_name);
          const eventBackgrounds = [
            "/eventBG/image1.png",
            "/eventBG/image2.png",
            "/eventBG/image3.png",
          ];
          const fallbackImage = eventBackgrounds[event.id % eventBackgrounds.length];
          const eventImage =
            (event as any).poster_url ||
            (event as any).image_url ||
            (event as any).image ||
            fallbackImage;

          return (
            <article
              className="eventsec-card"
              key={event.id || event.name}
              onClick={() => handleCardClick(event)}
              style={{ cursor: "pointer" }}
            >
              <div className="eventsec-card-media">
                <img
                  src={eventImage}
                  alt={event.name || "Event"}
                  className="eventsec-card-poster"
                  loading="lazy"
                  onError={(error) => {
                    const image = error.currentTarget;
                    if (image.dataset.fallbackApplied !== "true") {
                      image.dataset.fallbackApplied = "true";
                      image.src = fallbackImage;
                    } else {
                      image.style.visibility = "hidden";
                    }
                  }}
                />
                <span className="eventsec-badge">
                  {CategoryIcon && <CategoryIcon className="eventsec-category-icon" />}
                  {event.category_name || "Event"}
                </span>
                <p className="eventsec-location">
                  <FaMapPin className="eventsec-location-pin" />
                  {event.location || (event as any).city_name || "Location to be announced"}
                </p>
              </div>

              <div className="eventsec-card-content">
                <span className="event-date">
                  {formatEventDate(event.event_date)}
                </span>
                <h3>{event.name || "Untitled event"}</h3>

                <div className="eventsec-card-footer">
                  <div>
                    <span className="eventsec-price-label">Starting from</span>
                    <p className="eventsec-price">
                      ₹ {event.price || "Price yet to be announced"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="eventsec-pass-button"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      handleCardClick(event);
                    }}
                  >
                    Get Tickets
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!displayedEvents.length && (
          <p className="eventsec-empty">
            No upcoming events found for{" "}
            {selectedCity && selectedCity !== ALL_LOCATIONS
              ? selectedCity
              : "this location"}
            .
          </p>
        )}
      </div>
    </section>
  );
}

export default EventSection;