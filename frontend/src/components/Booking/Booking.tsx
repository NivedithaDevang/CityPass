import Navbar from "../Navbar/Navbar";
import { useEffect, useState} from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Bookings } from "../../types/auth";

export function Bookings(){
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            try{
                const response = await axios.get(
                    `${API_BASE_URL}/v1/bookings`,
                    {
                        withCredentials: true,
                    }
                );

                const fetchedBookings = response.data.booking;
                setBooking(fetchedBookings);
            }
            catch(error){
                console.error("Error fetching bookings: ", error);
            }
        }
        fetchBooking();
    }, []);

    return(
        <>
        <Navbar />
        <div className="booking-section">
            <h2>My bookings</h2>
<div className="event-grid">
        
        
        
</div>


        </div>
        </>

    )
}