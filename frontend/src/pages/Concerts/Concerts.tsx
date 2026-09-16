
import Navbar from "../../components/Navbar/Navbar";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/config";
import { type Activities } from "../../types/auth";
import axios from "axios";
import "./Concerts.css";
import { ALL_LOCATIONS, useCity } from "../../context/CityContext";

export function Concerts() {
    const [concerts, setConcerts] = useState<Activities[]>([]);
    const [error, setError] = useState(false);
    const { selectedCity } = useCity();
    const filteredConcerts = concerts.filter((concert) =>
        !selectedCity ||
        selectedCity === ALL_LOCATIONS ||
        concert.location?.trim().toLowerCase() === selectedCity.trim().toLowerCase()
    );

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

    return (
        <>
            <Navbar />
            <main className="concert-section">
            <div className="concert-heading">
                <h1>Explore Concerts</h1>
                <p>Find concerts and experiences happening in the city.</p>
            </div>

            {error && (
                <p className="concert-empty">Concerts are unavailable right now.</p>
            )}

            <div className="concert-grid">
                {!error && filteredConcerts.slice(0, 4).map((concert) => {
                    const eventDate = concert.event_date
                        ? new Date(concert.event_date).toLocaleDateString()
                        : "Date to be announced";

                    return (
                        <article className="concert-card" key={concert.id}>
                            <span className="concert-badge">
                                {concert.category_name || "Concert"}
                            </span>

                            <h3>{concert.name || "Untitled activity"}</h3>

                            <p className="concert-location">
                                {concert.location || "Location to be announced"}
                            </p>

                            <span className="concert-date">{eventDate}</span>
                            <p className="concert-price">
                                ₹ {concert.price || "Price yet to be announced"}
                            </p>
                        </article>
                    );
                })}
                {!error && !filteredConcerts.length && (
                    <p className="concert-empty">
                        {selectedCity && selectedCity !== ALL_LOCATIONS
                            ? "Currently no concerts in this place."
                            : "No concerts are available right now."}
                    </p>
                )}
            </div>
            </main>
        </>
    );
}