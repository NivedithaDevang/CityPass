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

  // Fetch cities from backend
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/v1/cities`);

        console.log("Raw API Response:", response.data);
        console.log("Response Status:", response.status);

        // Cities are returned inside the "city" property
        const list = response.data?.city || [];

        console.log("Cities:", list);

        if (Array.isArray(list)) {
          setCities(list);
        } else {
          console.error("Cities response is not an array");
          setCities([]);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
      }
    };

    fetchCities();
  }, []);

  // Handle city card click
  const handleCityClick = (cityName: string) => {
    setSelectedCity(cityName);

    navigate(`/events?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <section className="city-section">
      <div className="section-heading">
        <p>THE SCENE</p>

        <h2>Hit The Map</h2>

        <span>
          Pick a city to unlock local gigs, secret pop-ups, and nightlife.
        </span>
      </div>

      <div className="city-grid">
        {cities
          .filter((city) => Boolean(city.is_active ?? true))
          .map((city) => (
            <div
              className="city-card"
              key={city.id}
              onClick={() => handleCityClick(city.name)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={cityImages[city.name] || "/cities/default.jpeg"}
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