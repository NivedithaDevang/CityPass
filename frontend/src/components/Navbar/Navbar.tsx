import { ChevronDown, MapPin, Menu, X } from "lucide-react";
import Auth from "../Auth/Auth";
import { Sidebar } from "../Sidebar/Sidebar";
import "./Navbar.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/config";
import { type City } from "../../types/auth";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { FaUserAlt } from "react-icons/fa";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";

// Reliable active check handling boolean, 1/0, string, or Buffer
const isCityActive = (city: any): boolean => {
  if (city.status !== undefined && city.status !== null) {
    return String(city.status).trim().toUpperCase() === "ACTIVE";
  }

  if (city.is_active !== undefined && city.is_active !== null) {
    if (typeof city.is_active === "boolean") return city.is_active;
    if (typeof city.is_active === "number") return city.is_active === 1;
    if (typeof city.is_active === "string") {
      const lower = city.is_active.trim().toLowerCase();
      return lower === "true" || lower === "1" || lower === "active";
    }
    // Handle MySQL Buffer if returned
    if (city.is_active?.data && Array.isArray(city.is_active.data)) {
      return city.is_active.data[0] === 1;
    }
    return Boolean(city.is_active);
  }

  // If backend already filtered via GET /v1/cities (WHERE is_active = TRUE)
  return true;
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { user, setUser, clearUser } = useUser();
  const { selectedCity, setSelectedCity } = useCity();

  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [cities, setCities] = useState<City[]>([]);
  const [isCityMenuOpen, setIsCityMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Active pill indicators
  const isForYouActive = location.pathname === "/";
  const isEventsBaseActive = location.pathname === "/events";
  const isActivitiesActive = location.pathname === "/activities";
  const isConcertsActive = location.pathname === "/concerts";

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/v1/cities`);

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await response.json();

        const cityList: City[] = Array.isArray(data)
          ? data
          : data?.cities ??
            data?.city ??
            data?.data?.cities ??
            data?.data ??
            [];

        if (Array.isArray(cityList)) {
          setCities(cityList);
        } else {
          setCities([]);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
      }
    };

    fetchCities();
  }, []);

  // Filter and sort active cities alphabetically
  const activeCities = useMemo(() => {
    return cities
      .filter(isCityActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cities]);

  // Close dropdown on outside click
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

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleCitySelect = (cityName: string) => {
    const isAll = cityName === ALL_LOCATIONS || cityName === "ALL";
    const nextCity = isAll ? ALL_LOCATIONS : cityName;

    setSelectedCity(nextCity);
    setIsCityMenuOpen(false);

    if (["/events", "/activities", "/concerts"].includes(location.pathname)) {
      const params = new URLSearchParams(searchParams);

      if (isAll) {
        params.delete("city");
      } else {
        params.set("city", nextCity);
      }

      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : "",
        },
        { replace: true }
      );
    }
  };

  return (
    <>
      <nav className="navbar">
        {/* Mobile Menu Button */}
        <div className="mobile-menu-button">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Left Section */}
        <div className="navbar-left">
          {/* Logo */}
          <div
            className="navbar-brand"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <img
              src="/image.png"
              alt="CityPass Icon"
              className="navbar-logo-icon"
            />
            <h2 className="logo">CityPass</h2>
          </div>

          {/* City Dropdown */}
          <div className="location city-dropdown" ref={cityDropdownRef}>
            <MapPin size={18} />

            <button
              type="button"
              className="city-trigger"
              aria-expanded={isCityMenuOpen}
              aria-haspopup="listbox"
              onClick={() => setIsCityMenuOpen((isOpen) => !isOpen)}
            >
              <span>{selectedCity || ALL_LOCATIONS}</span>
              <ChevronDown
                size={16}
                className={isCityMenuOpen ? "city-chevron open" : "city-chevron"}
              />
            </button>

            {isCityMenuOpen && (
              <div className="city-menu" role="listbox" aria-label="Cities">
                {/* All Locations */}
                <button
                  type="button"
                  role="option"
                  aria-selected={!selectedCity || selectedCity === ALL_LOCATIONS}
                  className={`city-option ${
                    !selectedCity || selectedCity === ALL_LOCATIONS ? "selected" : ""
                  }`}
                  onClick={() => handleCitySelect(ALL_LOCATIONS)}
                >
                  <span>{ALL_LOCATIONS}</span>
                  {(!selectedCity || selectedCity === ALL_LOCATIONS) && (
                    <span className="city-check">&#10003;</span>
                  )}
                </button>

                {/* Active Cities */}
                {activeCities.map((city) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedCity === city.name}
                    className={`city-option ${
                      selectedCity === city.name ? "selected" : ""
                    }`}
                    key={city.id}
                    onClick={() => handleCitySelect(city.name)}
                  >
                    <span>{city.name}</span>
                    {selectedCity === city.name && (
                      <span className="city-check">&#10003;</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          <Link to="/" className={`nav-item ${isForYouActive ? "active" : ""}`}>
            For You
          </Link>

          <Link
            to="/events"
            className={`nav-item ${isEventsBaseActive ? "active" : ""}`}
          >
            Events
          </Link>

          <Link
            to="/activities"
            className={`nav-item ${isActivitiesActive ? "active" : ""}`}
          >
            Activities
          </Link>

          <Link
            to="/concerts"
            className={`nav-item ${isConcertsActive ? "active" : ""}`}
          >
            Concerts
          </Link>
        </div>

        {/* Profile */}
        <div className="profile-area">
          <button
            type="button"
            className="profile"
            onClick={handleProfileClick}
            aria-label="Open profile"
          >
            <FaUserAlt size={20} />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="mobile-nav-menu">
            <Link
              to="/"
              className={`mobile-nav-item ${isForYouActive ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              For You
            </Link>

            <Link
              to="/events"
              className={`mobile-nav-item ${isEventsBaseActive ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              Events
            </Link>

            <Link
              to="/activities"
              className={`mobile-nav-item ${isActivitiesActive ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              Activities
            </Link>

            <Link
              to="/concerts"
              className={`mobile-nav-item ${isConcertsActive ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              Concerts
            </Link>
          </div>
        )}

        {/* Authentication Modal */}
        {showAuth && (
          <Auth
            onClose={() => setShowAuth(false)}
            initialLogin={searchParams.get("login") === "true"}
            onSuccess={(authenticatedUser) => {
              setUser(authenticatedUser);
              setShowAuth(false);
              setIsSidebarOpen(true);
            }}
          />
        )}
      </nav>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />
    </>
  );
}

export default Navbar;