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

// Helper to reliably parse timestamps and omit past events
const parseEventTimestamp = (event: Events): number | null => {
  if (!event.event_date) return null;

  const dateStr = event.event_date.toString();
  const cleanDatePart = dateStr.includes("T")
    ? dateStr.split("T")[0]
    : dateStr.split(" ")[0];

  const [year, month, day] = cleanDatePart.split("-").map(Number);
  if (!year || !month || !day) {
    const fallback = new Date(event.event_date).getTime();
    return isNaN(fallback) ? null : fallback;
  }

  let hours = 23;
  let minutes = 59;
  let seconds = 59;

  const timeField = (event as any).time;
  if (timeField && typeof timeField === "string" && timeField.includes(":")) {
    const timeParts = timeField.split(":").map(Number);
    hours = timeParts[0] ?? 0;
    minutes = timeParts[1] ?? 0;
    seconds = timeParts[2] ?? 0;
  }

  const eventDateObj = new Date(year, month - 1, day, hours, minutes, seconds);
  const timeVal = eventDateObj.getTime();
  return isNaN(timeVal) ? null : timeVal;
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

  const getCategoryIcon = (categoryName?: string | null) => {
    const normalizedCategory = categoryName?.toLowerCase() || "";

    if (normalizedCategory.includes("music")) return categoryIcons.Music;
    if (normalizedCategory.includes("sport")) return categoryIcons.Sports;
    if (normalizedCategory.includes("comedy")) return categoryIcons.Comedy;
    if (normalizedCategory.includes("food")) return categoryIcons.Food;
    if (normalizedCategory.includes("art")) return categoryIcons.Art;
    if (normalizedCategory.includes("adventure")) return categoryIcons.Adventure;
    if (normalizedCategory.includes("entertainment")) return categoryIcons.Entertainment;

    return null;
  };

  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Events[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("date_asc");
  const [locations, setLocations] = useState<string[]>([]);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<"category" | "location" | "sort" | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const cityParam = searchParams.get("city");
    const categoryParam = searchParams.get("category");

    if (cityParam) {
      setSelectedLocation(cityParam);
      if (setSelectedCity) {
        setSelectedCity(cityParam);
      }
    } else {
      setSelectedLocation("ALL");
    }

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory("ALL");
    }
  }, [searchParams, setSelectedCity]);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedLocation !== "ALL" ||
    sortBy !== "date_asc";

  const handleLocationChange = (loc: string) => {
    setSelectedLocation(loc);
    setOpenDropdown(null);

    const params = new URLSearchParams(searchParams);
    if (loc === "ALL") {
      params.delete("city");
    } else {
      params.set("city", loc);
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setOpenDropdown(null);

    const params = new URLSearchParams(searchParams);
    if (cat === "ALL") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    setSearchParams(params);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setOpenDropdown(null);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedLocation("ALL");
    setSortBy("date_asc");
    setSearchParams({});
    setOpenDropdown(null);
  };

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [eventsRes, locRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/v1/events/events`),
          axios.get(`${API_BASE_URL}/v1/cities`),
        ]);

        const rawEvents = eventsRes.data?.events || [];
        setEvents(rawEvents);

        const cityList = locRes.data?.city || locRes.data?.cities || [];
        const cityNames = (cityList as City[])
          .map((city) => city.name?.trim())
          .filter((name): name is string => Boolean(name));
        setLocations([...new Set(cityNames)]);
      } catch (error) {
        console.error("Error fetching event and filter data:", error);
        setEvents([]);
        setLocations([]);
      }
    };

    fetchFilterData();
  }, []);

  const now = new Date().getTime();

  // 1. Filter out past events, apply search, city, and category filters
  const processedEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = events.filter((event: any) => {
      const eventTimestamp = parseEventTimestamp(event);
      if (eventTimestamp === null || eventTimestamp < now) {
        return false;
      }

      const eventLoc = (event.location || "").trim().toLowerCase();
      const eventCity = (event.city || "").trim().toLowerCase();

      // Global Navbar location check
      if (selectedCity && selectedCity !== ALL_LOCATIONS) {
        const targetCity = selectedCity.trim().toLowerCase();
        const matchesGlobal =
          eventCity === targetCity || eventLoc.includes(targetCity);
        if (!matchesGlobal) return false;
      }

      // Filter toolbar location dropdown
      if (selectedLocation !== "ALL") {
        const targetLoc = selectedLocation.trim().toLowerCase();
        const matchesLoc =
          eventCity === targetLoc || eventLoc.includes(targetLoc);
        if (!matchesLoc) return false;
      }

      // Category dropdown
      if (
        selectedCategory !== "ALL" &&
        (event.category_name || "").trim().toLowerCase() !==
          selectedCategory.trim().toLowerCase()
      ) {
        return false;
      }

      // Search input
      if (!normalizedSearch) {
        return true;
      }

      return [event.name, event.category_name, event.location, event.city]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(normalizedSearch));
    });

    return filtered.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      const timeA = parseEventTimestamp(a) || Infinity;
      const timeB = parseEventTimestamp(b) || Infinity;

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
    selectedCity,
    selectedLocation,
    selectedCategory,
    search,
    sortBy,
    now,
  ]);

  // Active categories that currently have upcoming events
  const activeCategories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((ev: any) => {
      const ts = parseEventTimestamp(ev);
      if (ts !== null && ts >= now && ev.category_name?.trim()) {
        set.add(ev.category_name.trim());
      }
    });
    return Array.from(set);
  }, [events, now]);

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date TBA";

    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(eventDate));
  };

  const handleCardClick = (event: Events) => {
    if (!event.slug) {
      console.warn("Event is missing a slug! Event ID:", event.id);
      return;
    }

    navigate(`/events/${event.slug}`);
  };

  const renderEventCard = (event: Events) => {
    const CategoryIcon = getCategoryIcon(event.category_name);
    const eventBackgrounds = [
      "/eventBG/image1.png",
      "/eventBG/image2.png",
      "/eventBG/image3.png",
    ];
    const fallbackImage = eventBackgrounds[event.id % eventBackgrounds.length];
    const posterImage =
      (event as any).poster_url ||
      (event as any).image_url ||
      (event as any).image ||
      fallbackImage;

    return (
      <article
        className="eventpage-card"
        key={event.id || event.name}
        onClick={() => handleCardClick(event)}
      >
        {/* Poster Media Box with clean image display */}
        <div className="eventpage-card-media-wrapper">
          {posterImage ? (
            <img
              src={posterImage}
              alt={event.name || "Event"}
              className="eventpage-card-poster"
              loading="lazy"
              onError={(e) => {
                const image = e.currentTarget;
                if (image.dataset.fallbackApplied !== "true") {
                  image.dataset.fallbackApplied = "true";
                  image.src = fallbackImage;
                } else {
                  image.style.visibility = "hidden";
                }
              }}
            />
          ) : (
            <div className="eventpage-card-poster-placeholder">
              {CategoryIcon ? (
                <CategoryIcon className="placeholder-cat-icon" />
              ) : (
                <FaCompass className="placeholder-cat-icon" />
              )}
            </div>
          )}

          {/* Floating Category Badge */}
          <div className="eventpage-media-badges">
            <span className="eventpage-badge">
              {CategoryIcon && (
                <CategoryIcon className="eventpage-category-icon" />
              )}
              {event.category_name || "Event"}
            </span>
          </div>
        </div>

        {/* Text Content Area: Date -> Title -> Location -> Footer */}
        <div className="eventpage-card-content">
          <div className="eventpage-card-info">
            {/* 1. Date right above title */}
            <span className="eventpage-date-text">
              {formatEventDate(event.event_date)}
              {event.time && ` · ${event.time.slice(0, 5)}`}
            </span>
            {/* 2. Event Title */}
            <h3 title={event.name}>{event.name || "Untitled event"}</h3>

            {/* 3. Location right below title */}
            <p className="eventpage-location">
              <FaMapPin className="eventpage-location-pin" />
              <span>{event.location || event.city_name || "Venue TBA"}</span>
            </p>
          </div>

          {/* 4. Price & Booking Button */}
          <div className="eventpage-card-footer">
            <div className="eventpage-price-box">
              <span className="eventpage-price-label">Starting from</span>
              <p className="eventpage-price">
                ₹{Number(event.price || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
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
            {selectedCity && selectedCity !== ALL_LOCATIONS
              ? `Explore events in ${selectedCity}`
              : "Explore events happening in the city"}
          </h1>
          <p>
            Top-rated concerts, masterclasses, and weekend pop-ups selling fast across your city.
          </p>
        </div>
      </div>

      <section className="eventpage-section">
        {/* Header with "All Events" Title Beside Search & Filters */}
        <div className="eventpage-filter-toolbar">
          <div className="eventpage-title-group">
            <h2 className="eventpage-main-heading">All Events</h2>
            <span className="eventpage-count-badge">
              {processedEvents.length} {processedEvents.length === 1 ? "Event" : "Events"}
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

            <div className="eventpage-controls" ref={controlsRef}>
              {/* Category Dropdown */}
              <div className="custom-event-dropdown">
                <button
                  type="button"
                  className={`custom-event-trigger ${selectedCategory !== "ALL" ? "has-value" : ""}`}
                  onClick={() =>
                    setOpenDropdown(openDropdown === "category" ? null : "category")
                  }
                >
                  <span>
                    {selectedCategory === "ALL" ? "All Categories" : selectedCategory}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`custom-event-chevron ${openDropdown === "category" ? "open" : ""}`}
                  />
                </button>

                {openDropdown === "category" && (
                  <div className="custom-event-menu">
                    <button
                      type="button"
                      className={`custom-event-option ${selectedCategory === "ALL" ? "selected" : ""}`}
                      onClick={() => handleCategoryChange("ALL")}
                    >
                      <span>All Categories</span>
                      {selectedCategory === "ALL" && <span className="custom-event-check">&#10003;</span>}
                    </button>
                    {activeCategories.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        className={`custom-event-option ${selectedCategory === cat ? "selected" : ""}`}
                        onClick={() => handleCategoryChange(cat)}
                      >
                        <span>{cat}</span>
                        {selectedCategory === cat && <span className="custom-event-check">&#10003;</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Dropdown */}
              <div className="custom-event-dropdown">
                <button
                  type="button"
                  className={`custom-event-trigger ${selectedLocation !== "ALL" ? "has-value" : ""}`}
                  onClick={() =>
                    setOpenDropdown(openDropdown === "location" ? null : "location")
                  }
                >
                  <span>
                    {selectedLocation === "ALL" ? "All Locations" : selectedLocation}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`custom-event-chevron ${openDropdown === "location" ? "open" : ""}`}
                  />
                </button>

                {openDropdown === "location" && (
                  <div className="custom-event-menu">
                    <button
                      type="button"
                      className={`custom-event-option ${selectedLocation === "ALL" ? "selected" : ""}`}
                      onClick={() => handleLocationChange("ALL")}
                    >
                      <span>All Locations</span>
                      {selectedLocation === "ALL" && <span className="custom-event-check">&#10003;</span>}
                    </button>
                    {locations.map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        className={`custom-event-option ${selectedLocation === loc ? "selected" : ""}`}
                        onClick={() => handleLocationChange(loc)}
                      >
                        <span>{loc}</span>
                        {selectedLocation === loc && <span className="custom-event-check">&#10003;</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="custom-event-dropdown">
                <button
                  type="button"
                  className="custom-event-trigger sort-trigger"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "sort" ? null : "sort")
                  }
                >
                  <span>
                    {sortOptions.find((opt) => opt.value === sortBy)?.label || "Sort"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`custom-event-chevron ${openDropdown === "sort" ? "open" : ""}`}
                  />
                </button>

                {openDropdown === "sort" && (
                  <div className="custom-event-menu sort-menu">
                    {sortOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        className={`custom-event-option ${sortBy === opt.value ? "selected" : ""}`}
                        onClick={() => handleSortChange(opt.value)}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.value && <span className="custom-event-check">&#10003;</span>}
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

        {/* Unified 4-Column Event Grid */}
        <div className="eventpage-grid">
          {processedEvents.map(renderEventCard)}
          {!processedEvents.length && (
            <p className="eventpage-empty">
              No matching upcoming events found. Try adjusting or resetting your filters.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Event;