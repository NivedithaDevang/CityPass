import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import "./Events.css";
import { type Events } from "../../types/auth";
import Navbar from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
<<<<<<< HEAD
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { FaMapPin ,FaMicrophone, FaLaughSquint } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy} from "react-icons/md";
=======
import { FaMapPin } from "react-icons/fa";
import { FaMicrophone } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy } from "react-icons/md";
>>>>>>> events-page
import { IoFastFoodSharp } from "react-icons/io5";
import { FaPaintbrush, FaMountain } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { createEventSlug } from "../../config/slug";

function EventSection() {
  const navigate = useNavigate();

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

  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Events[]>([]);
  const { selectedCity } = useCity();
  const normalizedSearch = search.trim().toLowerCase();
  const filteredEvents = events.filter((event) => {
    const matchesCity =
      !selectedCity ||
      selectedCity === ALL_LOCATIONS ||
      event.location?.trim().toLowerCase() === selectedCity.trim().toLowerCase();

    if (!matchesCity) return false;
    if (!normalizedSearch) return true;

    return [event.name, event.category_name, event.location]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedSearch));
  });

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(eventDate));
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/events`);
        setEvents(response.data.events);
      } catch (error) {
        console.error("Error fetching events: ", error);
      }
    };
    fetchEvents();
  }, []);

  const handleCardClick = (event: Events) => {
    navigate(`/events/${createEventSlug(event.name)}`);
  };

  return (
    <>
      <Navbar />
      <div className="section-heading">
        <h2>Explore events happening in the city</h2>
        <p>Top-rated concerts, masterclasses, and weekend pop-ups selling fast</p>
      </div>

      <section className="event-section">
        <form className="event-search" onSubmit={(event) => event.preventDefault()}>
          <input
            id="event-search-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by category, event name, or location"
          />
        </form>

        <div className="event-grid">
          {filteredEvents.map((event) => (
            <article
    className="event-card"
    key={event.id}
    onClick={() => handleCardClick(event)}
    style={{ cursor: "pointer" }}
>
              <div className="event-card-media">
                <span className="event-badge">
                  {(() => {
                    const CategoryIcon = getCategoryIcon(event.category_name);
                    return CategoryIcon ? (
                      <CategoryIcon className="event-category-icon" />
                    ) : null;
                  })()}
                  {event.category_name || "Event"}
                </span>
                <p className="event-location">
                  <FaMapPin className="event-location-pin" />
                  {event.location || "Location to be announced"}
                </p>
              </div>

<<<<<<< HEAD
        ))}
        {!filteredEvents.length && (
          <p className="event-empty">
            {selectedCity && selectedCity !== ALL_LOCATIONS
              ? "Currently no events in this place."
              : "No upcoming events are available right now."}
          </p>
        )}
      </div>
    </section>
          <Footer />
</>
=======
              <div className="event-card-content">
                <span className="event-date">{formatEventDate(event.event_date)}</span>
                <h3>{event.name || "Untitled event"}</h3>
                

                <div className="event-card-footer">
                  <div>
                    <span className="event-price-label">Starting from</span>
                    <p className="event-price">
                      ₹ {event.price || "Price yet to be announced"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="event-pass-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(event);
                    }}
                  >
                    Get Tickets
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!filteredEvents.length && (
            <p className="event-empty">No upcoming events are available right now.</p>
          )}
        </div>
      </section>
      <Footer />
    </>
>>>>>>> events-page
  );
}

export default EventSection;