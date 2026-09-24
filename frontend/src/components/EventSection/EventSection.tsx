import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // Added useSearchParams
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import "./EventSection.css";
import { type Category, type City, type Events } from "../../types/auth";
import Navbar from "../../components/Navbar/Navbar";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { FaMapPin, FaMicrophone, FaLaughSquint } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy } from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";
import { FaPaintbrush, FaMountain } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { createEventSlug } from "../../config/slug";

function EventSection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); //useSearchParams() is used to read the parameters
  const { selectedCity, setSelectedCity } = useCity();

  const categoryIcons: Record<string, IconType> = {
    Music: FaMicrophone,
    Sports: MdSportsFootball,
    Comedy: MdTheaterComedy,
    Food: IoFastFoodSharp,
    Art: FaPaintbrush,
    Adventure: FaMountain,
    Entertainment: FaLaughSquint,
  };

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

  // Filter & Sort States
    // "ALL" means no category filter is applied.
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("date_asc");

  // API-driven dropdown options
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Sync city from URL search params into dropdown and context
  // Ex: /events?city=Bangalore
    // cityParam = "Bangalore"
  useEffect(() => {
    const cityParam = searchParams.get("city");
    if (cityParam) {
    // Update the location dropdown
      setSelectedLocation(cityParam);
      if (setSelectedCity) {
        setSelectedCity(cityParam);
      }
    }
  }, [searchParams, setSelectedCity]);   // Run this effect when searchParams or setSelectedCity changes.


  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedLocation !== "ALL" ||
    sortBy !== "date_asc";

  const handleLocationChange = (loc: string) => {
    setSelectedLocation(loc);
    if (loc === "ALL") {
      searchParams.delete("city"); //delete city from the url
      setSearchParams(searchParams);
    } else {
      setSearchParams({ city: loc });
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedLocation("ALL");
    setSortBy("date_asc");
    searchParams.delete("city");
    setSearchParams(searchParams);
  };

  // Fetch events, categories, and locations from backend
  useEffect(() => {
  const fetchFilterData = async () => {
    try {
      const [eventsRes, catRes, locRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/v1/events`),
        axios.get(`${API_BASE_URL}/v1/categories`),
        axios.get(`${API_BASE_URL}/v1/cities`),
      ]);

      // EVENTS
      setEvents(eventsRes.data?.events || []);

      // CATEGORIES
      const categoryList = catRes.data?.categories || [];

      const categoryNames = (categoryList as Category[])
        .map((category) => category.name?.trim())
        .filter((name): name is string => Boolean(name));

      setCategories([...new Set(categoryNames)]);

      // CITIES
      const cityList = locRes.data?.city || [];

      const cityNames = (cityList as City[])
        .map((city) => city.name?.trim())
        .filter((name): name is string => Boolean(name));

      setLocations([...new Set(cityNames)]);

    } catch (error) {
      console.error("Error fetching event and filter data:", error);

      // Prevent undefined data from breaking the UI
      setEvents([]);
      setCategories([]);
      setLocations([]);
    }
  };

  fetchFilterData();
}, []);

  // Combined Filtering and Sorting
  // useMemo calculates the final list of events to display.
  const processedEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = events.filter((event) => {
      // 1. Global Navbar City
        // An event matches the global city when:
      // 1. No city is selected
      // OR
      // 2. "All Locations" is selected
      // OR
      // 3. Event location matches selected city
      const matchesGlobalCity =
        !selectedCity ||
        selectedCity === ALL_LOCATIONS ||
        event.location?.trim().toLowerCase() === selectedCity.trim().toLowerCase();

      if (!matchesGlobalCity) return false;

      // Specific Location Filter
      if (
        selectedLocation !== "ALL" &&
        event.location?.trim().toLowerCase() !== selectedLocation.trim().toLowerCase()
      ) {
        return false;
      }

      // Category Filter
      if (
        selectedCategory !== "ALL" &&
        event.category_name?.trim().toLowerCase() !== selectedCategory.trim().toLowerCase()
      ) {
        return false;
      }

      // Text Search
      if (!normalizedSearch) return true;
      return [event.name, event.category_name, event.location]
        .filter(Boolean)
        // some() returns true if at least one value matches.
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });

    return filtered.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      // If an event has no date,use Infinity so it goes to the end when sorting ascending.
      const timeA = a.event_date ? new Date(a.event_date).getTime() : Infinity;
      const timeB = b.event_date ? new Date(b.event_date).getTime() : Infinity;

      switch (sortBy) {
        case "date_asc":
          return timeA - timeB;   // Earlier timestamp comes first.
        case "date_desc":
          return timeB - timeA;             // Later timestamp comes first.
        case "price_asc":
          return priceA - priceB;             // Smaller price comes first.
        case "price_desc":
          return priceB - priceA;            // Higher price comes first.
        default:
          return 0;
      }
    });
  }, [events, selectedCity, selectedLocation, selectedCategory, search, sortBy]);

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(eventDate));
  };       // Example: "Sep 25, 2026"

  const handleCardClick = (event: Events) => {
    navigate(`/events/${createEventSlug(event.name)}`);
  };

  return (
    <>
      <Navbar />
            <section className="event-section">

      <div className="section-heading">
        <p>THE LINEUP</p>
        <h2>The City's Best Plans</h2>
        <span>Limited passes, standing pits, and reserved seats up for grabs.</span>
      </div>

        {/* Search & Filter Toolbar */}
        <div className="event-filter-toolbar">
          <form className="event-search" onSubmit={(e) => e.preventDefault()}>
            <input
              id="event-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by category, event name, or location"
            />
          </form>

          <div className="event-controls">
            {/* Category Filter from API */}
            <select
              className="event-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)} 
              // Update category when user selects an option.

            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Location Filter from API */}
            <select
              className="event-filter-select"
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
            >
              <option value="ALL">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              className="event-filter-select sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_asc">Date: Upcoming first</option>
              <option value="date_desc">Date: Later dates first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                className="event-reset-button"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        <div className="event-grid">
          {processedEvents.map((event) => {
            const CategoryIcon = getCategoryIcon(event.category_name);

            return (
              <article
                className="event-card"
                key={event.id}
                onClick={() => handleCardClick(event)}
                style={{ cursor: "pointer" }}
              >
                <div className="event-card-media">
                  <span className="event-badge">
                    {CategoryIcon && <CategoryIcon className="event-category-icon" />}
                    {event.category_name || "Event"}
                  </span>
                  <p className="event-location">
                    <FaMapPin className="event-location-pin" />
                    {event.location || "Location to be announced"}
                  </p>
                </div>

                <div className="event-card-content">
                  <span className="event-date">{formatEventDate(event.event_date)}</span>
                  <h3>{event.name || "Untitled event"}</h3>

                  <div className="event-card-footer">
                    <div>
                      <span className="event-price-label">Starting from</span>
                      <p className="event-price">
                        ₹ {event.price || "Price yet to be announced"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="event-pass-button"
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
          })}

          {!processedEvents.length && (
            <p className="event-empty">
              {hasActiveFilters
                ? "No matching events found. Try adjusting or resetting your filters."
                : selectedCity && selectedCity !== ALL_LOCATIONS
                ? "Currently no events in this place."
                : "No upcoming events are available right now."}
            </p>
          )}
        </div>
      </section>
    </>
  );
}

export default EventSection;