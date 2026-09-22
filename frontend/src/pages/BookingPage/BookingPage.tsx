import Navbar from "../../components/Navbar/Navbar";
import { Footer } from "../../components/Footer/Footer";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { useUser } from "../../context/UserContext";
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEye, 
  FaBan 
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "./BookingPage.css";
import { Ticket } from "lucide-react";

interface BookingItem {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  event_title?: string;
  venue?: string;
  location?: string;
  event_date?: string;
  category_name?: string;
  image_url?: string;
  number_of_tickets?: number;
  total_amount?: string | number;
  booking_date?: string;
  status?: "CONFIRMED" | "CANCELLED";
}

// Map city names to images in public/cities/
const CITY_IMAGE_MAP: Record<string, string> = {
  Bengaluru: "/cities/Bangalore.jpeg",
  Mumbai: "/cities/Mumbai.jpeg",
  Delhi: "/cities/Delhi.jpeg",
  Lucknow: "/cities/Lucknow.jpeg",
  Panaji: "/cities/Goa.jpeg",
  Hyderabad: "/cities/Hyderabad.jpeg",
  Chennai: "/cities/Chennai.jpeg",
  Trivandrum: "/cities/Trivandrum.jpeg",
};

const DEFAULT_POSTER = "/categories/image.png";

export function BookingPage() {
  const { user } = useUser();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/v1/bookings`, {
          withCredentials: true,
        });
        console.log(res.data);
        const list = res.data.bookings || res.data.booking || [];
        setBookings(Array.isArray(list) ? list : [list]);
      } catch (err: any) {
        console.error("Error loading bookings:", err);
        setError("Unable to load bookings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getCityPoster = (item: BookingItem): string => {
    const loc = (item.location || item.venue || "").trim().toLowerCase();
    for (const [cityName, imgPath] of Object.entries(CITY_IMAGE_MAP)) {
      if (loc.includes(cityName.toLowerCase())) {
        return imgPath;
      }
    }

    return item.image_url || DEFAULT_POSTER;
  };

  const formatEventDateTime = (dateStr?: string) => {
    if (!dateStr) return "Date to be announced";
    try {
      const d = new Date(dateStr);
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);

      const formattedTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);

      return `${formattedDate} • ${formattedTime}`;
    } catch {
      return dateStr;
    }
  };

  const formatBookingDate = (dateStr?: string) => {
    if (!dateStr) return "Recent";
    try {
      return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <Navbar />
      <section className="hero-banner">
      <div className="booking-heading">
          <div className="booking-hero">
            <Ticket className="ticket" />
            <span>Digital Passes Vault</span>
          </div>
          <h1>
            My Event Bookings
          </h1>
          <p>
            Access, view, print and manage your active and past event passes for seamless entry.
          </p>
        </div>
</section>
      <main className="hz-bookings-container">
        {loading ? (
          <div className="hz-status-box">
            <div className="hz-spinner" />
            <p>Loading your passes...</p>
          </div>
        ) : error ? (
          <div className="hz-status-box hz-error">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="hz-status-box">
            <p>No bookings found.</p>
            <Link to="/events" className="hz-explore-link">
              Explore Events &rarr;
            </Link>
          </div>
        ) : (
          <div className="hz-card-list">
            {bookings.map((item) => {
              const isCancelled = item.status?.toUpperCase() === "CANCELLED";
              const cityRaw = item.location || item.venue || "CITY";
              
              return (
                <article key={item.id} className="hz-booking-card">
                  {/* Left Media Thumbnail */}
                  <div className="hz-card-media">
                    <img
                      src={getCityPoster(item)}
                      alt={item.event_title || cityRaw}
                      className="hz-poster-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_POSTER;
                      }}
                    />
                    <div className="hz-media-badges">
                      <span className="hz-location-tag">{cityRaw}</span>
                    </div>
                  </div>

                  {/* Right Details Section */}
                  <div className="hz-card-details">
                    <div className="hz-top-row">
                      <span className="hz-event-datetime">
                        <FaCalendarAlt className="hz-cal-icon" />
                        {formatEventDateTime(item.event_date || item.booking_date)}
                      </span>

                      <span className={`hz-status-pill ${isCancelled ? "cancelled" : "confirmed"}`}>
                        {isCancelled ? <FaTimesCircle /> : <FaCheckCircle />}
                        {isCancelled ? "Cancelled" : "Confirmed"}
                      </span>
                    </div>

                    <h3 className="hz-title">{item.event_title || "Event Pass"}</h3>
                    <p className="hz-venue">
                      <FaMapMarkerAlt className="hz-pin-icon" />
                      {item.venue || item.location || "Venue details TBA"}
                    </p>

                    <div className="hz-info-capsule">
                      <div className="hz-info-col">
                        <span className="hz-col-label">PASS HOLDER</span>
                        <span className="hz-col-val">
                          {item.user_name || user?.name || item.user_email || "User"}
                        </span>
                      </div>

                      <div className="hz-info-col">
                        <span className="hz-col-label">TICKETS</span>
                        <span className="hz-col-val">
                          {item.number_of_tickets || 1} Pass
                          {(item.number_of_tickets || 1) > 1 ? "es" : ""}
                        </span>
                      </div>

                      <div className="hz-info-col">
                        <span className="hz-col-label">TOTAL PAID</span>
                        <span className="hz-col-val hz-price">
                          ₹{Number(item.total_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="hz-footer-row">
                      <span className="hz-booking-timestamp">
                        Booked on {formatBookingDate(item.booking_date)}
                      </span>

                      <div className="hz-action-buttons">
                        {!isCancelled && (
                          <button type="button" className="hz-cancel-btn">
                            <FaBan /> Cancel
                          </button>
                        )}
                        <button type="button" className="hz-view-pass-btn">
                          <FaEye /> View Pass
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

export default BookingPage;