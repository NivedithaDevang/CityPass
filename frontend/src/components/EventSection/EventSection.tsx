import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events } from "../../types/auth";
import Navbar from "../../components/Navbar/Navbar";
import { FaMapPin, FaMicrophone, FaLaughSquint } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy } from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";
import { FaPaintbrush, FaMountain } from "react-icons/fa6";
import type { IconType } from "react-icons";
import "./EventSection.css";

function EventSection() {
  const navigate = useNavigate();
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
        // Limit to only 8 events
        setEvents(eventList.slice(0, 8));
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(eventDate));
  };

  const handleCardClick = (event: Events) => {
  console.log("Clicked event:", event);
  if (!event.slug) {
    console.warn("Event is missing a slug! Event ID:", event.id);
    return;
  }
  navigate(`/events/${event.slug}`);
};

  return (
    <>
      <Navbar />
      <section className="eventsec-section">
        <div className="section-heading">
          <p>THE LINEUP</p>
          <h2>The City's Best Plans</h2>
          <span>Limited passes, standing pits, and reserved seats up for grabs.</span>
        </div>

        <div className="eventsec-grid">
          {events.map((event) => {
            const CategoryIcon = getCategoryIcon(event.category_name);

            return (
              <article
                className="eventsec-card"
                key={event.id || event.name}
                onClick={() => handleCardClick(event)}
                style={{ cursor: "pointer" }}
              >
                <div className="eventsec-card-media">
                  <span className="eventsec-badge">
                    {CategoryIcon && <CategoryIcon className="eventsec-category-icon" />}
                    {event.category_name || "Event"}
                  </span>
                  <p className="eventsec-location">
                    <FaMapPin className="eventsec-location-pin" />
                    {event.location || "Location to be announced"}
                  </p>
                </div>

                <div className="eventsec-card-content">
                  <span className="event-date">{formatEventDate(event.event_date)}</span>
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

          {!events.length && (
            <p className="eventsec-empty">
              No upcoming events are available right now.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

export default EventSection;