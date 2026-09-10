import { ChevronDown, MapPin } from "lucide-react";
import Auth from "../Auth/Auth";
import { Sidebar } from "../Sidebar/Sidebar";
import "./Navbar.css";
import { TiThMenu } from "react-icons/ti";
import { useState, useEffect, useRef } from "react";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/config";
import { type City } from "../../types/auth";
import { useNavigate, useSearchParams, NavLink } from "react-router-dom";
function Navbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser, clearUser } = useUser();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isCityMenuOpen, setIsCityMenuOpen] = useState<boolean>(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setShowAuth(true);
    }
  }, [searchParams]);

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
      await fetch(`${API_BASE_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
clearUser();
      setIsSidebarOpen(false);
      navigate("/");
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
<h2 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
  CityPass
</h2>
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
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            For You
          </NavLink>

          <NavLink
            to="/events"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            Events
          </NavLink>

 <NavLink
            to="/activities"
            onClick={() => navigate("/activities")}
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            Activities
          </NavLink>
<NavLink
            to="/concerts"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            Concerts
          </NavLink>        </div>

        <div className="profile-area">
          <button className="profile" onClick={handleProfileClick} aria-label="Open profile">
            <TiThMenu size={24} />
          </button>
        </div>

        {/* Auth Modal */}
        {showAuth && (
          <Auth
            onClose={() => setShowAuth(false)}
            initialLogin={searchParams.get("login") === "true"}
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