import Navbar from "../../components/Navbar/Navbar";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/config";
import { type Concerts as ConcertType } from "../../types/auth";
import axios from "axios";
import "../Events/Events.css";
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

export function Concerts() {
  const navigate = useNavigate();
  const { selectedCity } = useCity();

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

  const [concerts, setConcerts] = useState<ConcertType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("date_asc");

  const formatConcertDate = (eventDate?: string) => {
    if (!eventDate) return "Date to be announced";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(eventDate));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [concertsRes, catRes, locRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/v1/events/concerts`),
          axios.get(`${API_BASE_URL}/v1/categories`).catch(() => ({ data: { categories: [] } })),
          axios.get(`${API_BASE_URL}/v1/cities`).catch(() => ({ data: { cities: [] } })),
        ]);

        const rawConcerts: ConcertType[] = concertsRes.data.concerts || [];
        setConcerts(rawConcerts);

        // 1. Set Categories
        const fetchedCats: string[] = (catRes.data.categories as Category[])
          ?.map((c) => c.name?.trim())
          .filter(Boolean);

        if (fetchedCats?.length) {
          setCategories([...new Set(fetchedCats)]);
        } else {
          const fallbackCats = rawConcerts
            .map((a) => a.category_name?.trim())
            .filter((c): c is string => Boolean(c));
          setCategories([...new Set(fallbackCats)]);
        }

        // 2. Set Locations (Fixed: was missing)
        const fetchedCities: string[] = (locRes.data.cities as City[])
          ?.map((c) => c.name?.trim())
          .filter(Boolean);

        if (fetchedCities?.length) {
          setLocations([...new Set(fetchedCities)]);
        } else {
          const fallbackLocs = rawConcerts
            .map((a) => a.location?.trim())
            .filter((l): l is string => Boolean(l));
          setLocations([...new Set(fallbackLocs)]);
        }
      } catch (err) {
        console.error("Error fetching concerts: ", err);
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

  const processedConcerts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = concerts.filter((concert) => {
      // 1. Global Navbar location
      const matchesGlobalCity =
        !selectedCity ||
        selectedCity === ALL_LOCATIONS ||
        concert.location?.trim().toLowerCase() === selectedCity.trim().toLowerCase();

      if (!matchesGlobalCity) return false;

      // 2. Specific Location Filter
      if (
        selectedLocation !== "ALL" &&
        concert.location?.trim().toLowerCase() !== selectedLocation.trim().toLowerCase()
      ) {
        return false;
      }

      // 3. Category Filter
      if (
        selectedCategory !== "ALL" &&
        concert.category_name?.trim().toLowerCase() !== selectedCategory.trim().toLowerCase()
      ) {
        return false;
      }

      // 4. Text Search
      if (!normalizedSearch) return true;
      return [concert.name, concert.category_name, concert.location]
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
  }, [concerts, selectedCity, selectedLocation, selectedCategory, search, sortBy]);

  const handleCardClick = (event: ConcertType) => {
    navigate(`/events/${createEventSlug(event.name)}`);
  };

  return (
    <>
      <Navbar />
      <div className="section-heading">
        <h2>Explore concerts happening in the city</h2>
        <p>Find concerts and experiences happening in the city.</p>
      </div>

      <main className="event-section">
        <div className="event-filter-toolbar">
          <form className="event-search" onSubmit={(e) => e.preventDefault()}>
            <input
              id="event-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by category, concert name, or location"
            />
          </form>

          <div className="event-controls">
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
              <option value="date_asc">Date:Earliest First</option>
              <option value="date_desc">Date:Latest First</option>
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
          </div>
        </div>

        {error && <p className="event-empty">Concerts are unavailable right now.</p>}

        <div className="event-grid">
          {!error &&
            processedConcerts.map((concert) => {
              const CategoryIcon = getCategoryIcon(concert.category_name);

              return (
                <article
                  className="event-card"
                  key={concert.id}
                  onClick={() => handleCardClick(concert)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="event-card-media">
                    <span className="event-badge">
                      {CategoryIcon && <CategoryIcon className="event-category-icon" />}
                      {concert.category_name || "Concert"}
                    </span>
                    <p className="event-location">
                      <FaMapPin className="event-location-pin" />
                      {concert.location || "Location to be announced"}
                    </p>
                  </div>
                  <div className="event-card-content">
                    <span className="event-date">{formatConcertDate(concert.event_date)}</span>
                    <h3>{concert.name || "Untitled concert"}</h3>
                    <p className="event-description">
                      {concert.description || "Description yet to be set"}
                    </p>
                    <div className="event-card-footer">
                      <div>
                        <span className="event-price-label">Starting from</span>
                        <p className="event-price">
                          ₹ {concert.price || "Price yet to be announced"}
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

          {!error && !processedConcerts.length && (
            <p className="event-empty">
              {hasActiveFilters
                ? "No concerts match your current filters."
                : selectedCity && selectedCity !== ALL_LOCATIONS
                ? "Currently no concerts in this place."
                : "No concerts are available right now."}
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}