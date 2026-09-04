import { ChevronDown, MapPin } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import Auth from "../Auth/Auth";
import { Sidebar } from "../Sidebar/Sidebar";
import "./Navbar.css";
import { useState, useEffect, useRef } from "react";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/config";
import { type City } from "../../types/auth";
function Navbar() {
const { user, setUser } = useUser();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isCityMenuOpen, setIsCityMenuOpen] = useState<boolean>(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  
    // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/v1/cities`);

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await response.json();

        console.log("Cities:", data);

        setCities(data.cities);

        // Set first active city as default
        const firstActiveCity = data.cities.find(
          (city: City) => city.is_active
        );

        if (firstActiveCity) {
          setSelectedCity(firstActiveCity.name);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCityMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  
  
  const handleProfileClick = () => {
    if (!user) {
      setShowAuth(true);
    } else {
      setIsSidebarOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <h2 className="logo">CityPass</h2>

          <div className="location city-dropdown" ref={cityDropdownRef}>
            <MapPin size={18} />

            <button
              type="button"
              className="city-trigger"
              aria-expanded={isCityMenuOpen}
              aria-haspopup="listbox"
              onClick={() => setIsCityMenuOpen((isOpen) => !isOpen)}
            >
              <span>{selectedCity || "Select city"}</span>
              <ChevronDown
                size={16}
                className={isCityMenuOpen ? "city-chevron open" : "city-chevron"}
              />
            </button>

            {isCityMenuOpen && (
              <div className="city-menu" role="listbox" aria-label="Cities">
                {cities.filter((city) => city.is_active).map((city) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedCity === city.name}
                    className={`city-option ${
                      selectedCity === city.name ? "selected" : ""
                    }`}
                    key={city.id}
                    onClick={() => {
                      setSelectedCity(city.name);
                      setIsCityMenuOpen(false);
                    }}
                  >
                    <span>{city.name}</span>
                    {selectedCity === city.name && <span className="city-check">&#10003;</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
</div>

        <div className="navbar-links">
          <a href="#" className="active">
            For You
          </a>
          <a href="#">Events</a>
          <a href="#">Activities</a>
          <a href="#">Concerts</a>
        </div>

        <div className="profile-area">
          {user && (
            <div className="profile-summary" aria-label="Logged-in user details">
              <h2>{user.name || "User"}</h2>
              <small>{user.role || "USER"}</small>
            </div>
          )}

          <button className="profile" onClick={handleProfileClick} aria-label="Open profile">
            <FaUserCircle size={24} />
          </button>
        </div>

        {/* Auth Modal */}
        {showAuth && (
          <Auth
            onClose={() => setShowAuth(false)}
            onSuccess={(loggedInUser) => {
              setUser(loggedInUser);
              setShowAuth(false);
              setIsSidebarOpen(true);
            }}
          />
        )}
      </nav>

      {/* Profile Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />
    </>
  );
}

export default Navbar;