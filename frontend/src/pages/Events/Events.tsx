import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import "./Events.css";
import { type Category, type City, type Events } from "../../types/auth";
import Navbar from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";

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

  const categoryHeadings: Record<string, string> = {
    Music: "Turn Up the Volume, Live the Experience",
    Sports: "Chase the Score, Feel the Roar",
    Comedy: "Laugh First, Figure Out Life Later",
    Food: "For the Love of Everything Delicious",
    Art: "Make Something Only You Could Create",
    Adventure: "Trade the Ordinary for a Little Adrenaline",
    Entertainment: "Your Boring Plans Just Got Cancelled",
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
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("date_asc");
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

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

    const params = new URLSearchParams(searchParams);
    if (cat === "ALL") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedLocation("ALL");
    setSortBy("date_asc");
    setSearchParams({});
  };

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [eventsRes, catRes, locRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/v1/events/events`),
          axios.get(`${API_BASE_URL}/v1/categories`),
          axios.get(`${API_BASE_URL}/v1/cities`),
        ]);

        setEvents(eventsRes.data?.events || []);

        const categoryList = catRes.data?.categories || [];
        const categoryNames = (categoryList as Category[])
          .map((cat) => cat.name?.trim())
          .filter((name): name is string => Boolean(name));
        setCategories([...new Set(categoryNames)]);

        const cityList = locRes.data?.city || locRes.data?.cities || [];
        const cityNames = (cityList as City[])
          .map((city) => city.name?.trim())
          .filter((name): name is string => Boolean(name));
        setLocations([...new Set(cityNames)]);
      } catch (error) {
        console.error("Error fetching event and filter data:", error);
        setEvents([]);
        setCategories([]);
        setLocations([]);
      }
    };

    fetchFilterData();
  }, []);

  const processedEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = events.filter((event: any) => {
      const eventLoc = (event.location || "").trim().toLowerCase();
      const eventCity = (event.city || "").trim().toLowerCase();

      // 1. Global Navbar location check
      if (selectedCity && selectedCity !== ALL_LOCATIONS) {
        const targetCity = selectedCity.trim().toLowerCase();
        const matchesGlobal =
          eventCity === targetCity || eventLoc.includes(targetCity);
        if (!matchesGlobal) return false;
      }

      // 2. Filter toolbar location dropdown
      if (selectedLocation !== "ALL") {
        const targetLoc = selectedLocation.trim().toLowerCase();
        const matchesLoc =
          eventCity === targetLoc || eventLoc.includes(targetLoc);
        if (!matchesLoc) return false;
      }

      // 3. Category dropdown
      if (
        selectedCategory !== "ALL" &&
        (event.category_name || "").trim().toLowerCase() !==
          selectedCategory.trim().toLowerCase()
      ) {
        return false;
      }

      // 4. Search input
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
      const timeA = a.event_date ? new Date(a.event_date).getTime() : Infinity;
      const timeB = b.event_date ? new Date(b.event_date).getTime() : Infinity;

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
  ]);

  const categoryOrder = [
    "Music",
    "Sports",
    "Comedy",
    "Food",
    "Art",
    "Adventure",
    "Entertainment",
  ];

  const categorizedEvents = useMemo(() => {
    const result: Record<string, Events[]> = {};

    categoryOrder.forEach((category) => {
      result[category] = processedEvents.filter(
        (event) =>
          event.category_name?.trim().toLowerCase() === category.toLowerCase()
      );
    });

    return result;
  }, [processedEvents]);

  const formatEventDate = (eventDate?: string) => {
    if (!eventDate) {
      return "Date to be announced";
    }

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
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

    return (
      <article
        className="eventpage-card"
        key={event.id || event.name}
        onClick={() => handleCardClick(event)}
        style={{ cursor: "pointer" }}
      >
        <div className="eventpage-card-media">
          <span className="eventpage-badge">
            {CategoryIcon && (
              <CategoryIcon className="eventpage-category-icon" />
            )}
            {event.category_name || "Event"}
          </span>

          <p className="eventpage-location">
            <FaMapPin className="eventpage-location-pin" />
            {event.location || "Location to be announced"}
          </p>
        </div>

        <div className="eventpage-card-content">
          <span className="eventpage-date">
            {formatEventDate(event.event_date)}
          </span>

          <h3>{event.name || "Untitled event"}</h3>

          <div className="eventpage-card-footer">
            <div>
              <span className="eventpage-price-label">Starting from</span>
              <p className="eventpage-price">
                ₹ {event.price || "Price yet to be announced"}
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

  const renderCategorySection = (category: string) => {
    const categoryEvents = categorizedEvents[category] || [];

    if (categoryEvents.length === 0) {
      return null;
    }

    const CategoryIcon = getCategoryIcon(category);
    const headingTitle = categoryHeadings[category] || category;

    return (
      <section className="event-category-section" key={category}>
        <div className="event-category-heading">
          <div className="event-category-title">
            {CategoryIcon && (
              <CategoryIcon className="event-category-icon" />
            )}
            <h2>{headingTitle}</h2>
          </div>

          <button
            type="button"
            className="event-category-view-all"
            onClick={() => handleCategoryChange(category)}
          >
            View All
          </button>
        </div>

        <div className="event-category-grid">
          {categoryEvents.slice(0, 6).map(renderEventCard)}
        </div>
      </section>
    );
  };

  return (
    <>
      <Navbar />

      <div className="hero-banner">
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
        {/* Filter Toolbar */}
        <div className="eventpage-filter-toolbar">
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

          <div className="eventpage-controls">
            <select
              className="eventpage-filter-select"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="eventpage-filter-select"
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

            <select
              className="eventpage-filter-select sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_asc">Date: Upcoming first</option>
              <option value="date_desc">Date: Later dates first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

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

        {hasActiveFilters ? (
          <div className="eventpage-grid">
            {processedEvents.map(renderEventCard)}
            {!processedEvents.length && (
              <p className="eventpage-empty">
                No matching events found. Try adjusting or resetting your filters.
              </p>
            )}
          </div>
        ) : (
          <div className="event-category-container">
            {categoryOrder.map((category) => renderCategorySection(category))}
            {!processedEvents.length && (
              <p className="eventpage-empty">
                {selectedCity && selectedCity !== ALL_LOCATIONS
                  ? `Currently no events in ${selectedCity}.`
                  : "No upcoming events are available right now."}
              </p>
            )}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}

export default Event;