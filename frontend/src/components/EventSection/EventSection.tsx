
import "./EventSection.css";

const events = [
  {
    title: "Sunset Rooftop Party",
    location: "Bengaluru",
    date: "Fri, 8:00 PM",
    tag: "Live Music",
  },
  {
    title: "Street Food Trail",
    location: "Mumbai",
    date: "Sat, 6:30 PM",
    tag: "Foodies",
  },
  {
    title: "Art & Culture Walk",
    location: "Delhi",
    date: "Sun, 11:00 AM",
    tag: "Creative",
  },
  {
    title: "Weekend Sports Fest",
    location: "Hyderabad",
    date: "Sun, 4:00 PM",
    tag: "Adventure",
  },
];

function EventSection() {
  return (
    <section className="event-section">
      <div className="section-heading">
        <p>CURATED</p>
        <h2>Popular Events</h2>
      </div>

      <div className="event-grid">
        {events.map((event) => (
          <article className="event-card" key={event.title}>
            <div className="event-badge">{event.tag}</div>
            <h3>{event.title}</h3>
            <p>{event.location}</p>
            <span>{event.date}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default EventSection;
