import Navbar from "../../components/Navbar/Navbar";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/config";
import { type Activities } from "../../types/auth";
import axios from "axios";
import "./Activities.css";
import "../Events/Events.css";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";
import { Footer } from "../../components/Footer/Footer";
import { FaMapPin, FaMicrophone, FaLaughSquint } from "react-icons/fa";
import { MdSportsFootball, MdTheaterComedy} from "react-icons/md";
import { IoFastFoodSharp } from "react-icons/io5";
import { FaPaintbrush, FaMountain } from "react-icons/fa6";
import type { IconType } from "react-icons";

export function Activities() {

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

    const [activities, setActivities] = useState<Activities[]>([]);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const { selectedCity } = useCity();
    const normalizedSearch = search.trim().toLowerCase();
    const filteredActivities = activities.filter((activity) => {
        const matchesCity =
            !selectedCity ||
            selectedCity === ALL_LOCATIONS ||
            activity.location?.trim().toLowerCase() === selectedCity.trim().toLowerCase();

        if (!matchesCity) return false;
        if (!normalizedSearch) return true;

        return [activity.name, activity.category_name, activity.location]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });

    const formatActivityDate = (eventDate?: string) => {
        if (!eventDate) return "Date to be announced";

        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
        }).format(new Date(eventDate));
    };

    useEffect(() => {
        const fetchActivities = async() => {
            try { 
                const response = await axios.get(`${API_BASE_URL}/v1/events/activities`);
                setActivities(response.data.activities);

            }catch(error){
                console.error("Error fetching activities: ", error);
                setError(true);
            } 
        };
        fetchActivities();
    }, []);

    return (
        <>
            <Navbar />
            <div className="section-heading">
                <h2>Explore activities happening in the city</h2>
                <p>Find activities and experiences happening in the city.</p>
            </div>

            <main className="event-section">
            <form className="event-search" onSubmit={(event) => event.preventDefault()}>
                <input
                    id="activity-search-input"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by category, activity name, or location"
                />
            </form>

            {error && <p className="event-empty">Activities are unavailable right now.</p>}

            <div className="event-grid">
                {!error && filteredActivities.map((activity) => {
                    return (
                                                <article className="event-card" key={activity.id}>
                                                        <div className="event-card-media">
                                                            <span className="event-badge">
                                                                {(() => {
                  const CategoryIcon = getCategoryIcon(activity.category_name);

                  return CategoryIcon ? <CategoryIcon className="event-category-icon" /> : null;
                })()}
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
                                                            <p className="event-description">
                                                                {activity.description || "Description yet to be set"}
                                                            </p>
                                                            <div className="event-card-footer">
                                                                <div>
                                                                    <span className="event-price-label">Starting from</span>
                                                                    <p className="event-price">
                                                                        ₹ {activity.price || "Price yet to be announced"}
                                                                    </p>
                                                                </div>
                                                                <button type="button" className="event-pass-button">Get Tickets</button>
                                                            </div>
                                                        </div>
                        </article>
                    );
                })}
                {!error && !filteredActivities.length && (
                    <p className="event-empty">
                        {selectedCity && selectedCity !== ALL_LOCATIONS
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