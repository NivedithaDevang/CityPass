import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import "./EventSection.css";
import { type Events } from "../../types/auth";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";

function EventSection() {
  const [events, setEvents] = useState<Events[]>([]);
  const { selectedCity } = useCity();

  const filteredEvents = useMemo(() => {
    if (!selectedCity || selectedCity === ALL_LOCATIONS) {
      return events;
    }

    const normalizedCity = selectedCity.trim().toLowerCase();
    return events.filter(
      (event) => event.location?.trim().toLowerCase() === normalizedCity
    );
  }, [events, selectedCity]);

  const navigate = useNavigate();
  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
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


  return (
    <section className="event-section">
      <div className="section-heading">
        <h2>Popular Events</h2>
        <p>Top-rated concerts, masterclasses, and weekend pop-ups selling fast</p>

          <span
          className="browse-events"
          onClick={() => navigate("/events")}>
          Browse all events
          <ArrowRight className="browse-arrow" />
        </span>

        
      </div>

      <div className="event-grid">
        {filteredEvents.slice(0, 6).map((event) => (
          <article className="event-card" key={event.id}>
            <span className="event-badge">{event.category_name || "Event"}</span>
            <h3>{event.name || "Untitled event"}</h3>
            <p className="event-location">{event.location || "Location to be announced"}</p>
            <span className="event-date">{formatEventDate(event.event_date)}</span>
          </article>
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
  );
}

export default EventSection;
