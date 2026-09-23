import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events } from "../../types/auth";
import { useUser } from "../../context/UserContext";
import { 
  FaMapPin, 
  FaTimes, 
  FaMinus, 
  FaPlus, 
  FaCheckCircle,
  FaQuestionCircle 
} from "react-icons/fa";
import "./Booking.css"

interface BookingProps {
  isOpen: boolean;
  onClose: () => void;
  event: Events;
  onRequireAuth?: () => void;
}

export function Booking({ isOpen, onClose, event, onRequireAuth }: BookingProps) {
  const navigate = useNavigate();
  const { user } = useUser();
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // 1. Pre-Booking Confirmation Dialog State
  const [showReviewModal, setShowReviewModal] = useState(false);

  // 2. Final Success Confirmation Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<number | null>(null);

  const unitPrice = Number(event.price || 0);
  const totalAmount = unitPrice * ticketQuantity;

  //Open the Review Dialog when "Pay" is pressed
  const handleOpenReview = () => {
    //checks whether the user is logged in
    if (!user) {
      if (onRequireAuth) {
        onClose();
        onRequireAuth();
      }
      return;
    }
    setBookingError(null);
    setShowReviewModal(true);
  };

  //User clicked "Not Yet", close the review modal
  const handleCancelReview = () => {
    setShowReviewModal(false);
  };

  //User clicked "Yes, Confirm" -> Call API & Show Confirmed Modal
  const handleFinalBookingSubmit = async () => {
    try {
      setIsSubmitting(true);
      setBookingError(null);

      const payload = {
        user_id: user?.id,
        pass_id: Number(event.id),
        number_of_tickets: ticketQuantity,
        total_amount: totalAmount,
        booking_date: new Date().toISOString().split("T")[0],
        status: "CONFIRMED",
      };

      const res = await axios.post(`${API_BASE_URL}/v1/bookings`, payload, {
        withCredentials: true,
      });
console.log("Booking data: ", res);
      // Save ID, close the review modal, and open the confirmed popup
      setConfirmedBookingId(res.data?.bookingId || null);
      setShowReviewModal(false);
      setShowSuccessModal(true);

    } catch (err: any) {
      console.error("Booking error:", err);
      setShowReviewModal(false); // return back to drawer to see error

      if (err.response?.status === 401 && onRequireAuth) {
        onClose();
        onRequireAuth();
        return;
      }
      setBookingError(
        err.response?.data?.message || "Failed to complete booking. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  //when user clicks on View my bookings
  const handleRedirectToBookings = () => {
    setShowSuccessModal(false);
    onClose();
    navigate("/bookings");
  };

  return (
    <>
      <div
      //if isOpen is true then drawer-backdrop-visible
      //if not drawer-backdrop
        className={`drawer-backdrop ${isOpen ? "visible" : ""}`}
        onClick={() => {
          if (!showReviewModal && !showSuccessModal) onClose();
        }}
      />

      <aside className={`booking-drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div>
            <h3>Book Tickets</h3>
            <p className="drawer-subtitle">Fast & secure checkout</p>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="drawer-body">
          {/* Show booking error only when bookingError contains a message */}
          {bookingError && <div className="drawer-error">{bookingError}</div>}

          <div className="drawer-section">
            <span className="drawer-label">SELECTED EVENT</span>
            <div className="drawer-event-pill">
              <span className="pill-badge">{event.category_name || "Event"}</span>
              <p className="pill-title">{event.name}</p>
              <p className="pill-meta">
                <FaMapPin /> {event.location || "Venue TBA"}
              </p>
            </div>
          </div>

          <div className="ticket-counter-box">
            <div>
              <span className="ticket-label">Ticket Quantity</span>
              <p className="ticket-rate">₹ {unitPrice.toLocaleString()} / ticket</p>
            </div>

            <div className="counter-btn-group">
 {/* Makes sure the ticket quantity doesnt go below 1 */}

              <button
                type="button"
                className="counter-btn"
                onClick={() => setTicketQuantity((q) => Math.max(1, q - 1))}
                disabled={ticketQuantity <= 1}
              >
                <FaMinus />
              </button>
              <span className="counter-val">{ticketQuantity}</span>
                {/* Makes sure the ticket quantity doesnt go above 10 */}

              <button
                type="button"
                className="counter-btn"
                onClick={() => setTicketQuantity((q) => Math.min(10, q + 1))}
              >
                <FaPlus />
              </button>
            </div>
          </div>

          <div className="drawer-breakdown">
            <div className="breakdown-row">
              <span>Net Price ({ticketQuantity}x)</span>
              <span>₹ {totalAmount.toLocaleString()}</span>
            </div>
            <div className="breakdown-row">
              <span>Booking & Convenience Fee</span>
              <span className="free-badge">FREE</span>
            </div>
            <div className="breakdown-divider" />
            <div className="breakdown-row total">
              <span>Grand Total</span>
              <span>₹ {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button
            type="button"
            className="drawer-pay-button"
            onClick={handleOpenReview}
          >
            Pay ₹ {totalAmount.toLocaleString()}
          </button>
        </div>
      </aside>

      {/* 1. PRE-CONFIRMATION / REVIEW MODAL */}
      {showReviewModal && (
        <div className="booking-modal-overlay">
          <div className="booking-modal-card review-modal">
            <div className="review-icon-wrapper">
              <FaQuestionCircle />
            </div>

            <h3>Confirm Your Booking</h3>
            <p className="booking-modal-sub">
              Do you confirm that you want to book this event? Please review your reservation details below.
            </p>

            <div className="booking-summary-mini">
              <div className="mini-row">
                <span>Event:</span>
                <strong>{event.name}</strong>
              </div>
              <div className="mini-row">
                <span>Location:</span>
                <strong>{event.location || "Venue TBA"}</strong>
              </div>
              {event.event_date && (
  <div className="mini-row">
    <span>Date:</span>
    <strong>
      {new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
      }).format(new Date(event.event_date))}
    </strong>
  </div>
)}
              <div className="mini-row">
                <span>Reserved For:</span>
                <strong>{user?.name || user?.email}</strong>
              </div>
              <div className="mini-row">
                <span>Passes:</span>
                <strong>{ticketQuantity} Pass{ticketQuantity > 1 ? "es" : ""}</strong>
              </div>
              <div className="mini-row total-highlight">
                <span>Payable Amount:</span>
                <strong>₹ {totalAmount.toLocaleString()}</strong>
              </div>
            </div>

            <div className="review-modal-actions">
              <button
                type="button"
                className="review-btn-cancel"
                onClick={handleCancelReview}
                disabled={isSubmitting}
              >
                Not yet
              </button>
              <button
                type="button"
                className="review-btn-confirm"
                onClick={handleFinalBookingSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Securing Pass..." : "Yes, Confirm Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FINAL BOOKING CONFIRMED SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="booking-modal-overlay">
          <div className="booking-modal-card">
            <div className="booking-success-icon-wrapper">
              <FaCheckCircle />
            </div>

            <h3>Booking Confirmed!</h3>
            <p className="booking-modal-sub">
              Your tickets for <strong>{event.name}</strong> have been secured successfully.
            </p>

            <div className="booking-summary-mini">
              <div className="mini-row">
                <span>Pass Holder:</span>
                <strong>{user?.name || user?.email}</strong>
              </div>
              <div className="mini-row">
                <span>Tickets:</span>
                <strong>{ticketQuantity} Pass{ticketQuantity > 1 ? "es" : ""}</strong>
              </div>
              <div className="mini-row">
                <span>Total Paid:</span>
                <strong>₹ {totalAmount.toLocaleString()}</strong>
              </div>
              {confirmedBookingId && (
                <div className="mini-row">
                  <span>Booking Reference:</span>
                  <strong>#{confirmedBookingId}</strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className="booking-view-all-btn"
              onClick={handleRedirectToBookings}
            >
              View My Bookings &rarr;
            </button>
          </div>
        </div>
      )}
    </>
  );
}