import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import "./Events.css";
import { type Events } from "../../types/auth";
import Navbar from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";

function EventSection() {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Events[]>([]);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredEvents = events.filter((event) => {
    if (!normalizedSearch) return true;

    return [event.name, event.category_name, event.location]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedSearch));
  });

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(eventDate));
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try{
const response = await axios.get(`${API_BASE_URL}/v1/events`);
setEvents(response.data.events);

      } catch(error){
        console.error("Error fetching events: ", error);
      }
    };
    fetchEvents()
  }, []);


  return (
    <>
    <Navbar />
     <div className="section-heading">
        <h2>Explore events happening in the city </h2>
        <p>Top-rated concerts, masterclasses, and weekend pop-ups selling fast
        </p>

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
          <article className="event-card" key={event.id}>
            <span className="event-badge">{event.category_name || "Event"}</span>
            
            <h3>{event.name || "Untitled event"}</h3>
            <p className="event-location">{event.location || "Location to be announced"}</p>
            <span className="event-date">{formatEventDate(event.event_date)}</span>
            <p className="event-price">₹ {event.price || "Price yet to be announced"}</p>

          </article>

        ))}
        {!filteredEvents.length && (
          <p className="event-empty">No upcoming events are available right now.</p>
        )}
      </div>
    </section>
          <Footer />
</>
  );

}

export default EventSection;
