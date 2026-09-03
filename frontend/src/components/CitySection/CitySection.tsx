import "./CitySection.css"

function CitySection() {
  const cities = [
    "Bengaluru",
    "Mumbai",
    "Delhi",
    "Lucknow",
    "Panaji",
    "Hyderabad",
    "Chennai",
    "Thiruvananthapuram",
  ];

  const cityImages: Record<string, string> = {
    Bengaluru:"../public/cities/Bangalore.jpeg",
    Mumbai: "../public/cities/Mumbai.jpeg",
    Delhi: "../public/cities/Delhi.jpeg",
    Lucknow: "../public/cities/Lucknow.jpeg",
    Panaji: "../public/cities/Goa.jpeg",
    Hyderabad: "../public/cities/Hyderabad.jpeg",
    Chennai: "../public/cities/Chennai.jpeg",
    Thiruvananthapuram: "../public/cities/Trivandrum.jpeg",
  };

  return (
    <section className="city-section">
      <div className="section-heading">
        <p>EXPLORE</p>
        <h2>Popular Cities</h2>
        <span>Discover what's happening across India.</span>
      </div>

      <div className="city-grid">
        {cities.map((city) => (
          <div
            className="city-card"
            key={city}
            style={{
  backgroundImage: `url(${cityImages[city]})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
}}
          >
            <h3>{city}</h3>
            <span className="explore-events">Explore events →</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CitySection;