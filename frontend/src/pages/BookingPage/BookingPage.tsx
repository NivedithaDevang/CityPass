import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import { API_BASE_URL } from "../../config/config";
import "./BookingPage.css";

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState(location.state?.event || null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eventData && slug) {
      axios
        .get(`${API_BASE_URL}/v1/events/${slug}`)
        .then((res) => setEventData(res.data.event || res.data))
        .catch((err) => {
          console.error(err);
          setError("Failed to load event details.");
        });
    }
  }, [slug, eventData]);

  const handleBookingSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");

      await axios.post(
        `${API_BASE_URL}/v1/bookings`,
        {
          eventId: eventData?.id,
          eventSlug: slug,
          quantity,
        },
        { withCredentials: true }
      );

      navigate("/bookings");
    } catch (err: any) {
      console.error("Booking error:", err);
      setError(
        err.response?.data?.message || "Booking failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const ticketPrice = Number(eventData?.price) || 0;
  const totalPrice = ticketPrice * quantity;

  return (
    <>
      <Navbar />
      <div className="checkout-page">
        <div className="checkout-card">
          <div className="checkout-header">
            <span className="checkout-badge">Checkout</span>
            <h2>Complete Your Booking</h2>
            <p className="checkout-subtitle">
              You are reserving tickets for{" "}
              <span className="checkout-event-name">
                {eventData?.name || slug}
              </span>
            </p>
          </div>

          <div className="checkout-divider" />

          <div className="checkout-body">
            <div className="ticket-counter-row">
              <div>
                <label className="ticket-label">Number of tickets</label>
                <span className="ticket-subtext">
                  Maximum 10 tickets per booking
                </span>
              </div>

              <div className="ticket-counter">
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="counter-value">{quantity}</span>
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                >
                  +
                </button>
              </div>
            </div>

            <div className="price-summary-box">
              <div className="price-row">
                <span>Ticket Price</span>
                <span>₹ {ticketPrice}</span>
              </div>
              <div className="price-row">
                <span>Quantity</span>
                <span>× {quantity}</span>
              </div>
              <div className="price-row total-row">
                <span>Total Amount</span>
                <span>₹ {totalPrice}</span>
              </div>
            </div>

            {error && <p className="checkout-error">{error}</p>}

            <button
              type="button"
              onClick={handleBookingSubmit}
              disabled={submitting}
              className="checkout-submit-btn"
            >
              {submitting ? "Processing..." : "Confirm & Pay"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default BookingPage;