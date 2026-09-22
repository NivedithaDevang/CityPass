import "./CitySection.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type City } from "../../types/auth";
import { useCity } from "../../context/CityContext";

function CitySection() {
  const navigate = useNavigate();
  const { setSelectedCity } = useCity();
  const [cities, setCities] = useState<City[]>([]);

  const cityImages: Record<string, string> = {
    Bengaluru: "/cities/Bangalore.jpeg",
    Mumbai: "/cities/Mumbai.jpeg",
    Delhi: "/cities/Delhi.jpeg",
    Lucknow: "/cities/Lucknow.jpeg",
    Panaji: "/cities/Goa.jpeg",
    Hyderabad: "/cities/Hyderabad.jpeg",
    Chennai: "/cities/Chennai.jpeg",
    Trivandrum: "/cities/Trivandrum.jpeg",
  };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/cities`);
        setCities(response.data.cities);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  const handleCityClick = (cityName: string) => {
    if (setSelectedCity) {
      setSelectedCity(cityName);
    }
    navigate(`/events?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <section className="city-section">
      <div className="section-heading">
        <p>THE SCENE</p>
        <h2>Hit The Map</h2>
        <span>Pick a city to unlock local gigs, secret pop-ups, and nightlife.</span>
      </div>

      <div className="city-grid">
        {cities
          .filter((city) => city.is_active)
          .map((city) => (
            <div
              className="city-card"
              key={city.id}
              onClick={() => handleCityClick(city.name)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={cityImages[city.name]}
                alt={city.name}
              />
              <h2>{city.name}</h2>
            </div>
          ))}
      </div>
    </section>
  );
}

export default CitySection;