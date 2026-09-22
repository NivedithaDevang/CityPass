import Navbar from "../Navbar/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Bookings } from "../../types/auth";
import "./Booking.css";
import { FaMapPin, FaTicket } from "react-icons/fa6";

export function Bookings() {
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/v1/bookings`, {
          withCredentials: true,
        });

        const fetchedBookings = response.data.booking || response.data.bookings || [];
        setBookings(Array.isArray(fetchedBookings) ? fetchedBookings : [fetchedBookings]);
      } catch (error) {
        console.error("Error fetching bookings: ", error);
        setError("Unable to load your bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, []);

  return (
    <>
      <Navbar />
      <div className="bookings-container">
        <div className="bookings-header">
          <h2>My Bookings</h2>
          <p>View and manage your upcoming and past event tickets</p>
        </div>

        {loading ? (
          <div className="bookings-status">Loading your bookings...</div>
        ) : error ? (
          <div className="bookings-error">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="bookings-empty">
            <p>You haven't booked any events yet.</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map((item: any, index) => (
              <div key={item.id || index} className="booking-card">
                <div className="booking-card-header">
                  <span className={`status-badge ${(item.status || "CONFIRMED").toLowerCase()}`}>
                    {item.status || "CONFIRMED"}
                  </span>
                  <span className="booking-date">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                  </span>
                </div>

                <div className="booking-card-body">
                  <h3 className="event-title">{item.event_title || item.title || "Event Ticket"}</h3>
                  <p className="event-venue">
                    <FaMapPin /> {item.venue || item.location || "Venue TBA"}
                  </p>
                  <p className="event-tickets">
                    <FaTicket /> Tickets: {item.quantity || item.tickets_count || 1}
                  </p>
                  {item.total_amount && (
                    <p className="event-price">₹ {Number(item.total_amount).toLocaleString()}</p>
                  )}
                </div>

                <div className="booking-card-footer">
                  <span className="ticket-code">ID: #{item.id || item.booking_id || "---"}</span>
                  <span className="view-ticket-link">View Details &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Bookings;