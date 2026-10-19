import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import "./Events.css";
import { type City, type Events } from "../../types/auth";
import Navbar from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { ChevronDown } from "lucide-react";

import {
  FaMapPin,
  FaMicrophone,
  FaLaughSquint,
  FaPaintBrush,
  FaMountain,
  FaCompass,
} from "react-icons/fa";

import {
  MdSportsFootball,
  MdTheaterComedy,
} from "react-icons/md";

import { IoFastFoodSharp } from "react-icons/io5";
import type { IconType } from "react-icons";

// Parse the event date and time consistently.
const parseEventTimestamp = (event: Events): number | null => {
  if (!event.event_date) return null;

  const dateStr = String(event.event_date);
  const cleanDatePart = dateStr.includes("T")
    ? dateStr.split("T")[0]
    : dateStr.split(" ")[0];

  const [year, month, day] = cleanDatePart.split("-").map(Number);

  if (!year || !month || !day) {
    const fallback = new Date(event.event_date).getTime();
    return Number.isNaN(fallback) ? null : fallback;
  }

  let hours = 23;
  let minutes = 59;
  let seconds = 59;

  const timeField = (event as any).time;

  if (typeof timeField === "string" && timeField.includes(":")) {
    const parts = timeField.split(":").map(Number);
    hours = parts[0] ?? 0;
    minutes = parts[1] ?? 0;
    seconds = parts[2] ?? 0;
  }

  const timestamp = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    seconds
  ).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

function Event() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { selectedCity, setSelectedCity } = useCity();

  const categoryIcons: Record<string, IconType> = {
    Music: FaMicrophone,
    Sports: MdSportsFootball,
    Comedy: MdTheaterComedy,
    Food: IoFastFoodSharp,
    Art: FaPaintBrush,
    Adventure: FaMountain,
    Entertainment: FaLaughSquint,
  };

  const sortOptions = [
    { value: "date_asc", label: "Date: Upcoming first" },
    { value: "date_desc", label: "Date: Later dates first" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
  ];

  const getCategoryIcon = (
    categoryName?: string | null
  ): IconType | null => {
    const normalized = categoryName?.toLowerCase() || "";

    if (normalized.includes("music")) return categoryIcons.Music;
    if (normalized.includes("sport")) return categoryIcons.Sports;
    if (normalized.includes("comedy")) return categoryIcons.Comedy;
    if (normalized.includes("food")) return categoryIcons.Food;
    if (normalized.includes("art")) return categoryIcons.Art;
    if (normalized.includes("adventure")) return categoryIcons.Adventure;
    if (normalized.includes("entertainment")) {
      return categoryIcons.Entertainment;
    }

    return null;
  };

  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Events[]>([]);
  const [sortBy, setSortBy] = useState("date_asc");
  const [locations, setLocations] = useState<string[]>([]);
  const [cityIdMap, setCityIdMap] = useState<Record<string | number, string>>({});

  const [openDropdown, setOpenDropdown] = useState<
    "category" | "location" | "sort" | null
  >(null);

  const controlsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        controlsRef.current &&
        !controlsRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const cityParam = searchParams.get("city");

    if (cityParam) {
      if (cityParam !== selectedCity) {
        setSelectedCity(cityParam);
      }
      return;
    }

    if (selectedCity !== ALL_LOCATIONS) {
      setSelectedCity(ALL_LOCATIONS);
    }
  }, [
    searchParams,
    selectedCity,
    setSelectedCity,
    ALL_LOCATIONS,
  ]);

  const selectedCategory = searchParams.get("category") || "ALL";
  const activeCityFilter =
    searchParams.get("city") || selectedCity || ALL_LOCATIONS;

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "ALL" ||
    (
      activeCityFilter !== "ALL" &&
      activeCityFilter !== ALL_LOCATIONS
    ) ||
    sortBy !== "date_asc";

  const handleLocationChange = (location: string) => {
    const isAll =
      location === ALL_LOCATIONS || location === "ALL";

    const nextCity = isAll ? ALL_LOCATIONS : location;

    setSelectedCity(nextCity);
    setOpenDropdown(null);

    const params = new URLSearchParams(searchParams);

    if (isAll) {
      params.delete("city");
    } else {
      params.set("city", nextCity);
    }

    setSearchParams(params);
  };

  const handleCategoryChange = (category: string) => {
    setOpenDropdown(null);

    const params = new URLSearchParams(searchParams);

    if (category === "ALL") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    setSearchParams(params);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setOpenDropdown(null);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSortBy("date_asc");
    setSelectedCity(ALL_LOCATIONS);
    setOpenDropdown(null);
    setSearchParams({}, { replace: true });
  };

  // Fetch events and available cities.
  useEffect(() => {
    let cancelled = false;

    const fetchFilterData = async () => {
      try {
        const [eventsResponse, locationsResponse] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/v1/events/events`),
            axios.get(`${API_BASE_URL}/v1/cities`),
          ]);

        if (cancelled) return;

        const rawEvents =
          eventsResponse.data?.events || [];

        setEvents(rawEvents);

        const cityList: City[] =
          locationsResponse.data?.city ||
          locationsResponse.data?.cities ||
          [];

        const idMap: Record<string | number, string> = {};
        const names: string[] = [];

        cityList.forEach((c: any) => {
          const name = c?.name?.trim();
          if (name) {
            names.push(name);
            if (c.id !== undefined && c.id !== null) {
              idMap[c.id] = name;
            }
          }
        });

        setLocations([...new Set(names)]);
        setCityIdMap(idMap);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Error fetching event and filter data:",
          error
        );

        setEvents([]);
        setLocations([]);
      }
    };

    fetchFilterData();

    return () => {
      cancelled = true;
    };
  }, []);

  const getResolvedCityName = (event: any): string => {
    if (event.city_name && typeof event.city_name === "string") {
      return event.city_name.trim();
    }
    if (event.city && typeof event.city === "string") {
      return event.city.trim();
    }
    if (event.city?.name && typeof event.city.name === "string") {
      return event.city.name.trim();
    }
    if (event.city_id && cityIdMap[event.city_id]) {
      return cityIdMap[event.city_id];
    }
    return "";
  };

  // Filter and sort events.
  const processedEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const currentTime = Date.now();

    const filtered = events.filter((event: any) => {
      const eventTimestamp = parseEventTimestamp(event);

      if (
        eventTimestamp === null ||
        eventTimestamp < currentTime
      ) {
        return false;
      }

      const eventLocation = String(
        event.location || ""
      ).trim().toLowerCase();

      const eventCity = getResolvedCityName(event).toLowerCase();

      // City filter.
      if (
        activeCityFilter !== "ALL" &&
        activeCityFilter !== ALL_LOCATIONS
      ) {
        const targetCity =
          activeCityFilter.trim().toLowerCase();

        const matchesCity =
          eventCity === targetCity ||
          eventLocation.includes(targetCity);

        if (!matchesCity) return false;
      }

      // Category filter.
      if (
        selectedCategory !== "ALL" &&
        String(event.category_name || "")
          .trim()
          .toLowerCase() !== selectedCategory.trim().toLowerCase()
      ) {
        return false;
      }

      // Search filter.
      if (!normalizedSearch) return true;

      return [
        event.name,
        event.category_name,
        event.location,
        eventCity,
      ]
        .filter(
          (value) => typeof value === "string" && value
        )
        .some((value: string) =>
          value.toLowerCase().includes(normalizedSearch)
        );
    });

    return filtered.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;

      const timeA = parseEventTimestamp(a) ?? Infinity;
      const timeB = parseEventTimestamp(b) ?? Infinity;

      switch (sortBy) {
        case "date_asc":
          return timeA - timeB;

        case "date_desc":
          return timeB - timeA;

        case "price_asc":
          return priceA - priceB;

        case "price_desc":
          return priceB - priceA;

        default:
          return 0;
      }
    });
  }, [
    events,
    activeCityFilter,
    selectedCategory,
    search,
    sortBy,
    cityIdMap,
  ]);

  // Show categories that have upcoming events.
  const activeCategories = useMemo(() => {
    const categories = new Set<string>();
    const currentTime = Date.now();

    events.forEach((event: any) => {
      const timestamp = parseEventTimestamp(event);

      if (
        timestamp !== null &&
        timestamp >= currentTime &&
        event.category_name?.trim()
      ) {
        categories.add(event.category_name.trim());
      }
    });

    return Array.from(categories);
  }, [events]);

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date TBA";

    const date = new Date(eventDate);

    if (Number.isNaN(date.getTime())) {
      return "Date TBA";
    }

    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleCardClick = (event: Events) => {
    if (!event.slug) {
      console.warn(
        "Event is missing a slug! Event ID:",
        event.id
      );

      return;
    }

    navigate(`/events/${event.slug}`);
  };

  const renderEventCard = (event: Events) => {
    const CategoryIcon = getCategoryIcon(
      event.category_name
    );

    const eventBackgrounds = [
      "/eventBG/image1.png",
      "/eventBG/image2.png",
      "/eventBG/image3.png",
    ];

    const fallbackImage =
      eventBackgrounds[
        Number(event.id || 0) % eventBackgrounds.length
      ];

    const posterImage =
      (event as any).poster_url ||
      (event as any).image_url ||
      (event as any).image ||
      fallbackImage;

    const isLive =
      event.is_live === true ||
      Number(event.is_live) === 1;

    const cityName = getResolvedCityName(event);

    return (
      <article
        className="eventpage-card"
        key={event.id || event.name}
        onClick={() => handleCardClick(event)}
      >
        <div
          className="eventpage-card-media-wrapper"
          style={{
            position: "relative",
            overflow: "hidden",
          }}
        >
          <img
            src={posterImage}
            alt={event.name || "Event"}
            className="eventpage-card-poster"
            loading="lazy"
            onError={(e) => {
              const image = e.currentTarget;

              if (
                image.dataset.fallbackApplied !== "true"
              ) {
                image.dataset.fallbackApplied = "true";
                image.src = fallbackImage;
              } else {
                image.style.visibility = "hidden";
              }
            }}
          />

          <div className="eventpage-media-badges">
            <span className="eventpage-badge">
              {CategoryIcon && (
                <CategoryIcon className="eventpage-category-icon" />
              )}
              {event.category_name || "Event"}
            </span>
          </div>
        </div>

        <div className="eventpage-card-content">
          <div className="eventpage-card-info">
            <span className="eventpage-date-text">
              {formatEventDate(event.event_date)}
              {event.time &&
                ` · ${String(event.time).slice(0, 5)}`}
            </span>

            <div className="eventpage-title-row">
              <h3 title={event.name}>
                {event.name || "Untitled event"}
              </h3>

              {isLive && (
                <span className="eventpage-live-badge-title">
                  <span className="live-pulse-dot" />
                  LIVE
                </span>
              )}
            </div>

            <p className="eventpage-location">
              <FaMapPin className="eventpage-location-pin" />
              <span>
                {event.location ||
                  cityName ||
                  "Venue TBA"} , {cityName || "City yet to be announced"}
              </span>
            </p>

            
          </div>

          <div className="eventpage-card-footer">
            <div className="eventpage-price-box">
              <span className="eventpage-price-label">
                Starting from
              </span>

              <p className="eventpage-price">
                ₹
                {Number(event.price || 0).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>

            <button
              type="button"
              className="eventpage-pass-button"
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                handleCardClick(event);
              }}
            >
              Get Tickets
            </button>
          </div>
        </div>
      </article>
    );
  };

  const displayLocation =
    activeCityFilter !== "ALL" &&
    activeCityFilter !== ALL_LOCATIONS
      ? activeCityFilter
      : ALL_LOCATIONS;

  return (
    <>
      <Navbar />

      <div className="events-hero-banner">
        <div className="events-hero-content">
          <span className="events-hero-badge">
            <FaCompass className="hero-badge-icon" />
            Discover & Explore
          </span>

          <h1>
            {displayLocation !== ALL_LOCATIONS
              ? `Explore events in ${displayLocation}`
              : "Explore events happening in the city"}
          </h1>

          <p>
            Top-rated concerts, masterclasses, and weekend
            pop-ups selling fast across your city.
          </p>
        </div>
      </div>

      <section className="eventpage-section">
        <div className="eventpage-filter-toolbar">
          <div className="eventpage-title-group">
            <h2 className="eventpage-main-heading">
              All Events
            </h2>

            <span className="eventpage-count-badge">
              {processedEvents.length}{" "}
              {processedEvents.length === 1
                ? "Event"
                : "Events"}
            </span>
          </div>

          <div className="eventpage-actions-row">
            <form
              className="eventpage-search"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                id="eventpage-search-input"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by category, event name, or location"
              />
            </form>

            <div
              className="eventpage-controls"
              ref={controlsRef}
            >
              {/* Category dropdown */}
              <div className="custom-event-dropdown">
                <button
                  type="button"
                  className={`custom-event-trigger ${
                    selectedCategory !== "ALL"
                      ? "has-value"
                      : ""
                  }`}
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "category"
                        ? null
                        : "category"
                    )
                  }
                >
                  <span>
                    {selectedCategory === "ALL"
                      ? "All Categories"
                      : selectedCategory}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`custom-event-chevron ${
                      openDropdown === "category"
                        ? "open"
                        : ""
                    }`}
                  />
                </button>

                {openDropdown === "category" && (
                  <div className="custom-event-menu">
                    <button
                      type="button"
                      className={`custom-event-option ${
                        selectedCategory === "ALL"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleCategoryChange("ALL")
                      }
                    >
                      <span>All Categories</span>

                      {selectedCategory === "ALL" && (
                        <span className="custom-event-check">
                          &#10003;
                        </span>
                      )}
                    </button>

                    {activeCategories.map((category) => (
                      <button
                        type="button"
                        key={category}
                        className={`custom-event-option ${
                          selectedCategory === category
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleCategoryChange(category)
                        }
                      >
                        <span>{category}</span>

                        {selectedCategory === category && (
                          <span className="custom-event-check">
                            &#10003;
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location dropdown */}
              <div className="custom-event-dropdown">
                <button
                  type="button"
                  className={`custom-event-trigger ${
                    displayLocation !== ALL_LOCATIONS
                      ? "has-value"
                      : ""
                  }`}
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "location"
                        ? null
                        : "location"
                    )
                  }
                >
                  <span>{displayLocation}</span>

                  <ChevronDown
                    size={16}
                    className={`custom-event-chevron ${
                      openDropdown === "location"
                        ? "open"
                        : ""
                    }`}
                  />
                </button>

                {openDropdown === "location" && (
                  <div className="custom-event-menu">
                    <button
                      type="button"
                      className={`custom-event-option ${
                        displayLocation === ALL_LOCATIONS
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleLocationChange(ALL_LOCATIONS)
                      }
                    >
                      <span>{ALL_LOCATIONS}</span>

                      {displayLocation === ALL_LOCATIONS && (
                        <span className="custom-event-check">
                          &#10003;
                        </span>
                      )}
                    </button>

                    {locations.map((location) => (
                      <button
                        type="button"
                        key={location}
                        className={`custom-event-option ${
                          displayLocation === location
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleLocationChange(location)
                        }
                      >
                        <span>{location}</span>

                        {displayLocation === location && (
                          <span className="custom-event-check">
                            &#10003;
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="custom-event-dropdown">
                <button
                  type="button"
                  className="custom-event-trigger sort-trigger"
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "sort"
                        ? null
                        : "sort"
                    )
                  }
                >
                  <span>
                    {sortOptions.find(
                      (option) => option.value === sortBy
                    )?.label || "Sort"}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`custom-event-chevron ${
                      openDropdown === "sort" ? "open" : ""
                    }`}
                  />
                </button>

                {openDropdown === "sort" && (
                  <div className="custom-event-menu sort-menu">
                    {sortOptions.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={`custom-event-option ${
                          sortBy === option.value
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleSortChange(option.value)
                        }
                      >
                        <span>{option.label}</span>

                        {sortBy === option.value && (
                          <span className="custom-event-check">
                            &#10003;
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="eventpage-reset-button"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="eventpage-grid">
          {processedEvents.map(renderEventCard)}

          {!processedEvents.length && (
            <p className="eventpage-empty">
              No matching upcoming events found. Try adjusting
              or resetting your filters.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Event;