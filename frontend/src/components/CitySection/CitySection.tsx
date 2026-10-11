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
  const [loading, setLoading] = useState(true);

  const localCityImages: Record<string, string> = {
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
        setLoading(true);
        // Public endpoint returns only active cities
        const response = await axios.get(`${API_BASE_URL}/v1/cities`);

        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : data?.cities ?? data?.city ?? data?.data?.cities ?? data?.data ?? [];

        if (Array.isArray(list)) {
          setCities(list);
        } else {
          console.error("Cities response is not an array:", data);
          setCities([]);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  const handleCityClick = (cityName: string) => {
    setSelectedCity(cityName);
    navigate(`/events?city=${encodeURIComponent(cityName)}`);
  };

  // Double-check active state in frontend as a safeguard
  const isCityActive = (city: any) => {
    if (city.status !== undefined && city.status !== null) {
      return String(city.status).toUpperCase() === "ACTIVE";
    }
    if (city.is_active !== undefined && city.is_active !== null) {
      return (
        city.is_active === true ||
        Number(city.is_active) === 1 ||
        String(city.is_active).toLowerCase() === "true"
      );
    }
    return false;
  };

  const activeCities = cities.filter(isCityActive);

  return (
    <section className="city-section">
      <div className="city-section-heading">
        <p>THE SCENE</p>
        <h2>Hit The Map</h2>
        <span>
          Pick a city to unlock local gigs, secret pop-ups, and nightlife.
        </span>
      </div>

      <div className="city-grid">
        {loading ? (
          <p style={{ color: "#aaa", textAlign: "center" }}>Loading cities...</p>
        ) : activeCities.length === 0 ? (
          <p style={{ color: "#aaa", textAlign: "center" }}>
            No cities currently available.
          </p>
        ) : (
          activeCities.map((city) => (
            <div
              className="city-card"
              key={city.id}
              onClick={() => handleCityClick(city.name)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={
                  city.image ||
                  localCityImages[city.name] ||
                  "/cities/default.jpeg"
                }
                alt={city.name}
              />
              <h4>{city.name}</h4>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default CitySection;