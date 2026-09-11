import Navbar from "../../components/Navbar/Navbar";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/config";
import { type Activities } from "../../types/auth";
import axios from "axios";
import "./Activities.css";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";

export function Activities() {
    const [activities, setActivities] = useState<Activities[]>([]);
    const [error, setError] = useState(false);
    const { selectedCity } = useCity();
    const filteredActivities = activities.filter((activity) =>
        !selectedCity ||
        selectedCity === ALL_LOCATIONS ||
        activity.location?.trim().toLowerCase() === selectedCity.trim().toLowerCase()
    );

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
            <main className="act-section">
            <div className="act-heading">
                <h1>Explore Activities</h1>
                <p>Find activities and experiences happening in the city.</p>
            </div>

            {error && (
                <p className="act-empty">Activities are unavailable right now.</p>
            )}

            <div className="act-grid">
                {!error && filteredActivities.slice(0, 4).map((activity) => {
                    const eventDate = activity.event_date
                        ? new Date(activity.event_date).toLocaleDateString()
                        : "Date to be announced";

                    return (
                        <article className="act-card" key={activity.id}>
                            <span className="act-badge">
                                {activity.category_name || "Activity"}
                            </span>

                            <h3>{activity.name || "Untitled activity"}</h3>

                            <p className="act-location">
                                {activity.location || "Location to be announced"}
                            </p>

                            <span className="act-date">{eventDate}</span>
                            <p className="act-price">
                                ₹ {activity.price || "Price yet to be announced"}
                            </p>
                        </article>
                    );
                })}
                {!error && !filteredActivities.length && (
                    <p className="act-empty">
                        {selectedCity && selectedCity !== ALL_LOCATIONS
                            ? "Currently no activities in this place."
                            : "No activities are available right now."}
                    </p>
                )}
            </div>
            </main>
        </>
    );
}