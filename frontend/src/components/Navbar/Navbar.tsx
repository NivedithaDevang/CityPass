import { ChevronDown, MapPin, Menu, X } from "lucide-react";
import Auth from "../Auth/Auth";
import { Sidebar } from "../Sidebar/Sidebar";
import "./Navbar.css";
import { useState, useEffect, useRef } from "react";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/config";
import { type City } from "../../types/auth";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { FaUserAlt } from "react-icons/fa";
import { useNavigate, useSearchParams, NavLink } from "react-router-dom";

// Check whether a city is active
const isCityActive = (city: any): boolean => {
  if (city.status !== undefined && city.status !== null) {
    return String(city.status).trim().toUpperCase() === "ACTIVE";
  }

  if (city.is_active !== undefined && city.is_active !== null) {
    return (
      city.is_active === true ||
      Number(city.is_active) === 1 ||
      String(city.is_active).toLowerCase() === "true"
    );
  }

  // If backend does not send status, consider it active
  return true;
};

function Navbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user, setUser, clearUser } = useUser();

  const { selectedCity, setSelectedCity } = useCity();

  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [cities, setCities] = useState<City[]>([]);
  const [isCityMenuOpen, setIsCityMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState<boolean>(false);

  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cities only once
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/v1/cities`);

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data = await response.json();

        // Support different backend response structures
        const cityList: City[] = Array.isArray(data)
          ? data
          : data?.city ??
            data?.cities ??
            data?.data?.cities ??
            data?.data ??
            [];

        if (Array.isArray(cityList)) {
          setCities(cityList);

          // Set first active city only if no city is selected
          const firstActiveCity = cityList.find(isCityActive);

          if (firstActiveCity && !selectedCity) {
            setSelectedCity(firstActiveCity.name);
          }
        } else {
          setCities([]);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
      }
    };

    fetchCities();
  }, [setSelectedCity, selectedCity]);

  // Close city dropdown when clicking outside
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

  // Only active cities should appear
  const activeCities = cities.filter(isCityActive);

  return (
    <>
      <nav className="navbar">
        {/* Mobile Menu Button */}
        <div className="mobile-menu-button">
          <button
            type="button"
            onClick={() =>
              setIsMobileMenuOpen((open) => !open)
            }
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
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
          <div
            className="location city-dropdown"
            ref={cityDropdownRef}
          >
            <MapPin size={18} />

            <button
              type="button"
              className="city-trigger"
              aria-expanded={isCityMenuOpen}
              aria-haspopup="listbox"
              onClick={() =>
                setIsCityMenuOpen((isOpen) => !isOpen)
              }
            >
              <span>
                {selectedCity || ALL_LOCATIONS}
              </span>

              <ChevronDown
                size={16}
                className={
                  isCityMenuOpen
                    ? "city-chevron open"
                    : "city-chevron"
                }
              />
            </button>

            {isCityMenuOpen && (
              <div
                className="city-menu"
                role="listbox"
                aria-label="Cities"
              >
                {/* All Locations */}
                <button
                  type="button"
                  role="option"
                  aria-selected={
                    selectedCity === ALL_LOCATIONS
                  }
                  className={`city-option ${
                    selectedCity === ALL_LOCATIONS
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedCity(ALL_LOCATIONS);
                    setIsCityMenuOpen(false);
                  }}
                >
                  <span>{ALL_LOCATIONS}</span>

                  {selectedCity === ALL_LOCATIONS && (
                    <span className="city-check">
                      &#10003;
                    </span>
                  )}
                </button>

                {/* Active Cities */}
                {activeCities.map((city) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={
                      selectedCity === city.name
                    }
                    className={`city-option ${
                      selectedCity === city.name
                        ? "selected"
                        : ""
                    }`}
                    key={city.id}
                    onClick={() => {
                      setSelectedCity(city.name);
                      setIsCityMenuOpen(false);
                    }}
                  >
                    <span>{city.name}</span>

                    {selectedCity === city.name && (
                      <span className="city-check">
                        &#10003;
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            For You
          </NavLink>

          <NavLink
            to="/events"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Events
          </NavLink>
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
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? "mobile-nav-item active"
                  : "mobile-nav-item"
              }
              onClick={closeMobileMenu}
            >
              For You
            </NavLink>

            <NavLink
              to="/events"
              className={({ isActive }) =>
                isActive
                  ? "mobile-nav-item active"
                  : "mobile-nav-item"
              }
              onClick={closeMobileMenu}
            >
              Events
            </NavLink>
          </div>
        )}

        {/* Authentication Modal */}
        {showAuth && (
          <Auth
            onClose={() => setShowAuth(false)}
            initialLogin={
              searchParams.get("login") === "true"
            }
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