import "./CitySection.css"
import Bangalore from "../../../public/cities/Bangalore.jpeg";
import Chennai from "../../../public/cities/Chennai.jpeg";
import Delhi from "../../../public/cities/Delhi.jpeg";
import Hyderabad from "../../../public/cities/Hyderabad.jpeg";
import Lucknow from "../../../public/cities/Lucknow.jpeg";
import Mumbai from "../../../public/cities/Mumbai.jpeg";
import Trivandrum from "../../../public/cities/Trivandrum.jpeg";

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
    Bengaluru: Bangalore,
    Mumbai: Mumbai,
    Delhi: Delhi,
    Lucknow: Lucknow,
    Panaji: Lucknow,
    Hyderabad: Hyderabad,
    Chennai: Chennai,
    Thiruvananthapuram: Trivandrum,
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