import "./CitySection.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type City } from "../../types/auth";

function CitySection() {
  const [cities, setCities] = useState<City[]>([]);

  const cityImages: Record<string, string> = {
    Bengaluru: "/cities/Bangalore.jpeg",
    Mumbai: "/cities/Mumbai.jpeg",
    Delhi: "/cities/Delhi.jpeg",
    Lucknow: "/cities/Lucknow.jpeg",
    Panaji: "/cities/Goa.jpeg",
    Hyderabad: "/cities/Hyderabad.jpeg",
    Chennai: "/cities/Chennai.jpeg",
    Thiruvananthapuram: "/cities/Trivandrum.jpeg",
  };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/cities`);

        console.log("City Section:", response.data);

        setCities(response.data.cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  return (
    <section className="city-section">
      <div className="section-heading">
        <p>EXPLORE</p>
        <h2>Popular Cities</h2>
        <span>Discover what's happening across India.</span>
      </div>

      <div className="city-grid">
        {cities
          .filter((city) => city.is_active)
          .map((city) => (
            <div
              className="city-card"
              key={city.id}
              style={{
                backgroundImage: `url(${cityImages[city.name]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <h3>{city.name}</h3>

              <span className="explore-events">
                Explore events →
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}

export default CitySection;