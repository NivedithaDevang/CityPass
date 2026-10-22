import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type City, type Events } from "../../types/auth";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { FaMapPin, FaMicrophone, FaLaughSquint } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy } from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";
import { FaPaintbrush, FaMountain } from "react-icons/fa6";
import type { IconType } from "react-icons";
import "./EventSection.css";

type EventCardData = Events & {
  city?: string | { name?: string } | null;
  poster_url?: string | null;
  image_url?: string | null;
  image?: string | null;
};

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
  const [events, setEvents] = useState<EventCardData[]>([]);
  const [cityIdMap, setCityIdMap] = useState<Record<string | number, string>>({});

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
        const eventList: EventCardData[] = Array.isArray(rawData)
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

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/cities`);
        const data = response.data;
        const cityList: City[] = Array.isArray(data)
          ? data
          : data?.cities || data?.city || data?.data?.cities || data?.data || [];

        if (!Array.isArray(cityList)) {
          console.error("Cities response is not an array:", data);
          return;
        }

        const idMap: Record<string | number, string> = {};
        cityList.forEach((city) => {
          const name = city?.name?.trim();
          if (name && city.id !== undefined && city.id !== null) {
            idMap[city.id] = name;
          }
        });
        setCityIdMap(idMap);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  const getResolvedCityName = (event: EventCardData): string => {
    if (event.city_name && typeof event.city_name === "string") {
      return event.city_name.trim();
    }
    if (event.city && typeof event.city === "string") {
      return event.city.trim();
    }
    if (
      typeof event.city === "object" &&
      typeof event.city?.name === "string"
    ) {
      return event.city.name.trim();
    }
    if (event.city_id != null && cityIdMap[event.city_id]) {
      return cityIdMap[event.city_id];
    }
    return "";
  };

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
  const filteredEvents = events.filter((event) => {
    if (!isUpcomingEvent(event)) return false;

    if (!selectedCity || selectedCity === ALL_LOCATIONS) {
      return true;
    }

    const targetCity = selectedCity.trim().toLowerCase();
    const eventCity = getResolvedCityName(event).toLowerCase();
    const eventLocation = (event.location || "").trim().toLowerCase();

    return (
      eventCity === targetCity ||
      eventLocation.includes(targetCity)
    );
  });

  // Limit display to the first 5 matching events
  const displayedEvents = filteredEvents.slice(0, 5);

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
          const cityName = getResolvedCityName(event);
          const eventBackgrounds = [
            "/eventBG/image1.png",
            "/eventBG/image2.png",
            "/eventBG/image3.png",
          ];
          const fallbackImage = eventBackgrounds[event.id % eventBackgrounds.length];
          const eventImage =
            event.poster_url ||
            event.image_url ||
            event.image ||
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
                  {event.location || cityName || "Location to be announced"}
                </p>
              </div>

              <div className="eventsec-card-content">
                <span className="event-date">
                  {formatEventDate(event.event_date)}
                </span>
                <span className="event-date">
                  {cityName || "City to be announced"}
                </span>
                <div className="eventsec-title-row">
                  <h3>{event.name || "Untitled event"}</h3>
                  {(event.is_live === true || event.is_live === 1) && (
                    <span className="eventsec-live-badge">
                      <span className="eventsec-live-dot" />
                      LIVE
                    </span>
                  )}
                </div>

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