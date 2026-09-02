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
    Bengaluru: "./cities/Bangalore.jpeg",
    Mumbai: "./cities/Mumbai.jpeg",
    Delhi: "./cities/Delhi.jpeg",
    Lucknow: "./cities/Lucknow.jpeg",
    Panaji: "./cities/Goa.jpeg",
    Hyderabad: "./cities/Hyderabad.jpeg",
    Chennai: "./cities/Chennai.jpeg",
    Thiruvananthapuram: "./cities/Trivandrum.jpeg",
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