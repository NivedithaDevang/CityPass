import "./OrganiserCard.css";
import axios from "axios";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/config";
import { type Organizer } from "../../types/auth";
import { FaUserCircle } from "react-icons/fa";


export function OrganiserDetails() {
    const [organiser, setOrganiser] = useState<Organizer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrganiserDetails = async() => {
            try{
                const response = await axios.get(
                    `${API_BASE_URL}/v1/organizers`
                );
                const organisers = response.data.organizers || [];
                setOrganiser(organisers[0] || null);
            }
            catch(error){
                console.error("Error loading organiser: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrganiserDetails();
    }, []);


    return (

        <div className="organiser-card">
            {isLoading ? (
                <span className="organiser-card-status">Loading organiser...</span>
            ) : organiser ? (
                <>
                    <div className="organiser-avatar">
                        {organiser.profile_image ? (
                            <img
                                src={organiser.profile_image}
                                alt={`${organiser.organization_name} profile`}
                            />
                        ) : (
                            <FaUserCircle aria-hidden="true" />
                        )}
                    </div>
                    <h3>{organiser.organization_name}</h3>
                </>
            ) : (
                <span className="organiser-card-status">Organiser information unavailable</span>
            )}



        </div>
    )
}