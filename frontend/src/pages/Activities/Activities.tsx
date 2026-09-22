import Navbar from "../../components/Navbar/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/config";
import { type Activities } from "../../types/auth";
import axios from "axios";
import "../Events/Events.css"
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { Footer } from "../../components/Footer/Footer";
import { FaMapPin, FaMicrophone, FaLaughSquint } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy } from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";
import { FaPaintbrush, FaMountain } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { createEventSlug } from "../../config/slug";

interface Category {
  id?: number | string;
  name: string;
}

interface City {
  id?: number | string;
  name: string;
}

export function Activities() {
  const navigate = useNavigate();
  const { selectedCity } = useCity();

  // Data
  const [activities, setActivities] = useState<Activities[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [error, setError] = useState(false);

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("date_asc");

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
    const normalized = categoryName?.toLowerCase() || "";
    if (normalized.includes("music")) return categoryIcons.Music;
    if (normalized.includes("sport")) return categoryIcons.Sports;
    if (normalized.includes("comedy")) return categoryIcons.Comedy;
    if (normalized.includes("food")) return categoryIcons.Food;
    if (normalized.includes("art")) return categoryIcons.Art;
    if (normalized.includes("adventure")) return categoryIcons.Adventure;
    if (normalized.includes("entertainment")) return categoryIcons.Entertainment;
    return null;
  };

  const formatActivityDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(eventDate));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activitiesRes, catRes, locRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/v1/events/activities`),
          axios.get(`${API_BASE_URL}/v1/categories`).catch(() => ({ data: { categories: [] } })),
          axios.get(`${API_BASE_URL}/v1/cities`).catch(() => ({ data: { cities: [] } })),
        ]);

        const rawActivities: Activities[] = activitiesRes.data.activities || [];
        setActivities(rawActivities);

        // Fetch categories or derive from activities
        const fetchedCats: string[] = (catRes.data.categories as Category[])
          ?.map((c) => c.name?.trim())
          .filter(Boolean);
        if (fetchedCats?.length) {
          setCategories([...new Set(fetchedCats)]);
        } else {
          const fallbackCats = rawActivities
            .map((a) => a.category_name?.trim())
            .filter((c): c is string => Boolean(c));
          setCategories([...new Set(fallbackCats)]);
        }

        // Fetch cities or derive from activities
        const fetchedCities: string[] = (locRes.data.cities as City[])
          ?.map((c) => c.name?.trim())
          .filter(Boolean);
        if (fetchedCities?.length) {
          setLocations([...new Set(fetchedCities)]);
        } else {
          const fallbackLocs = rawActivities
            .map((a) => a.location?.trim())
            .filter((l): l is string => Boolean(l));
          setLocations([...new Set(fallbackLocs)]);
        }
      } catch (err) {
        console.error("Error fetching activities and options: ", err);
        setError(true);
      }
    };

    fetchData();
  }, []);

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedLocation !== "ALL" ||
    sortBy !== "date_asc";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedLocation("ALL");
    setSortBy("date_asc");
  };

  const processedActivities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = activities.filter((activity) => {
      // 1. Navbar location context
      const matchesGlobalCity =
        !selectedCity ||
        selectedCity === ALL_LOCATIONS ||
        activity.location?.trim().toLowerCase() === selectedCity.trim().toLowerCase();

      if (!matchesGlobalCity) return false;

      // 2. Location dropdown
      if (
        selectedLocation !== "ALL" &&
        activity.location?.trim().toLowerCase() !== selectedLocation.trim().toLowerCase()
      ) {
        return false;
      }

      // 3. Category dropdown
      if (
        selectedCategory !== "ALL" &&
        activity.category_name?.trim().toLowerCase() !== selectedCategory.trim().toLowerCase()
      ) {
        return false;
      }

      // 4. Text input search
      if (!normalizedSearch) return true;
      return [activity.name, activity.category_name, activity.location]
        .filter(Boolean)
        .some((val) => val!.toLowerCase().includes(normalizedSearch));
    });

    return [...filtered].sort((a, b) => {
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
  }, [activities, selectedCity, selectedLocation, selectedCategory, search, sortBy]);

  const handleCardClick = (activity: Activities) => {
    navigate(`/events/${createEventSlug(activity.name)}`);
  };

  return (
    <>
      <Navbar />
      <div className="section-heading">
        <h2>Explore activities happening in the city</h2>
        <p>Find activities and experiences happening in the city.</p>
      </div>

      <main className="event-section">
        {/* Search, Filter & Sort Controls */}
        <div className="event-filter-toolbar">
          <form className="event-search" onSubmit={(e) => e.preventDefault()}>
            <input
              id="event-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by category, activity name, or location"
            />
          </form>
<div className = "event-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="event-filter-select"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="event-filter-select"
          >
            <option value="ALL">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="event-filter-select sort-select"
          >
            <option value="date_asc">Date: Earliest first</option>
            <option value="date_desc">Date: Latest first</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="event-reset-button"
            >
              Reset Filters
            </button>
          )}
        </div></div>

        {error && <p className="event-empty">Activities are unavailable right now.</p>}

        <div className="event-grid">
          {!error &&
            processedActivities.map((activity) => {
              const CategoryIcon = getCategoryIcon(activity.category_name);

              return (
                <article
                  className="event-card"
                  key={activity.id}
                  onClick={() => handleCardClick(activity)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="event-card-media">
                    <span className="event-badge">
                      {CategoryIcon && <CategoryIcon className="event-category-icon" />}
                      {activity.category_name || "Activity"}
                    </span>
                    <p className="event-location">
                      <FaMapPin className="event-location-pin" />
                      {activity.location || "Location to be announced"}
                    </p>
                  </div>
                  <div className="event-card-content">
                    <span className="event-date">{formatActivityDate(activity.event_date)}</span>
                    <h3>{activity.name || "Untitled activity"}</h3>
                    <div className="event-card-footer">
                      <div>
                        <span className="event-price-label">Starting from</span>
                        <p className="event-price">
                          ₹ {activity.price || "Price yet to be announced"}
                        </p>
                      </div>
                      <button type="button" className="event-pass-button">
                        Get Tickets
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

          {!error && !processedActivities.length && (
            <p className="event-empty">
              {hasActiveFilters
                ? "No activities match your current filters."
                : selectedCity && selectedCity !== ALL_LOCATIONS
                ? "Currently no activities in this place."
                : "No upcoming activities are available right now."}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}