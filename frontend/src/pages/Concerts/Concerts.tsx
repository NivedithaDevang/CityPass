
import Navbar from "../../components/Navbar/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/config";
import { type Activities } from "../../types/auth";
import axios from "axios";
import "./Concerts.css";
import "../Events/Events.css";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { Footer } from "../../components/Footer/Footer";
import { FaMapPin, FaMicrophone, FaLaughSquint } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy } from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";
import { FaPaintbrush, FaMountain } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { createEventSlug } from "../../config/slug";

export function Concerts() {
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

    const [concerts, setConcerts] = useState<Activities[]>([]);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const { selectedCity } = useCity();
    const normalizedSearch = search.trim().toLowerCase();
    const filteredConcerts = concerts.filter((concert) => {
        const matchesCity =
            !selectedCity ||
            selectedCity === ALL_LOCATIONS ||
            concert.location?.trim().toLowerCase() === selectedCity.trim().toLowerCase();

        if (!matchesCity) return false;
        if (!normalizedSearch) return true;

        return [concert.name, concert.category_name, concert.location]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });

    const formatConcertDate = (eventDate?: string) => {
        if (!eventDate) return "Date to be announced";

        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
        }).format(new Date(eventDate));
    };

    useEffect(() => {
        const fetchConcerts = async() => {
            try { 
                const response = await axios.get(`${API_BASE_URL}/v1/events/concerts`);
                setConcerts(response.data.concerts);

            }catch(error){
                console.error("Error fetching concerts: ", error);
                setError(true);
            } 
        };
        fetchConcerts();
    }, []);
const navigate = useNavigate();
const handleCardClick = (event: Activities) => {
    navigate(`/events/${createEventSlug(event.name)}`);
}
    return (
        <>
            <Navbar />
            <div className="section-heading">
                <h2>Explore concerts happening in the city</h2>
                <p>Find concerts and experiences happening in the city.</p>
            </div>

            <main className="event-section">
            <form className="event-search" onSubmit={(event) => event.preventDefault()}>
                <input
                    id="concert-search-input"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by category, concert name, or location"
                />
            </form>

            {error && <p className="event-empty">Concerts are unavailable right now.</p>}

            <div className="event-grid">
                {!error && filteredConcerts.map((concert) => {
                    return (
                        <article className="event-card" key={concert.id}
                        onClick={() => handleCardClick(concert)}
                        style={{cursor: "pointer"}}>
                            <div className="event-card-media">
                                <span className="event-badge">
                                    {(() => {
                                        const CategoryIcon = getCategoryIcon(concert.category_name);

                                        return CategoryIcon ? <CategoryIcon className="event-category-icon" /> : null;
                                    })()}
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
                                    <button type="button" className="event-pass-button">Get Tickets</button>
                                </div>
                            </div>
                        </article>
                    );
                })}
                {!error && !filteredConcerts.length && (
                    <p className="event-empty">
                        {selectedCity && selectedCity !== ALL_LOCATIONS
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