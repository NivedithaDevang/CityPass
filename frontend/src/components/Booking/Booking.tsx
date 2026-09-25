import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config/config";
import { type Events } from "../../types/auth";
import { useUser } from "../../context/UserContext";
import { 
  FaMinus, 
  FaPlus, 
  FaCheckCircle,
  FaQuestionCircle 
} from "react-icons/fa";
import "./Booking.css";

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

  // Pre-Booking Confirmation Dialog State
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Final Success Confirmation Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<number | null>(null);

  const unitPrice = Number(event.price || 0);
  const totalAmount = unitPrice * ticketQuantity;

  const handleOpenReview = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }
    setBookingError(null);
    setShowReviewModal(true);
  };

  const handleCancelReview = () => {
    setShowReviewModal(false);
  };

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

      setConfirmedBookingId(res.data?.bookingId || null);
      setShowReviewModal(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Booking error:", err);
      setShowReviewModal(false);

      if (err.response?.status === 401 && onRequireAuth) {
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

  const handleRedirectToBookings = () => {
    setShowSuccessModal(false);
    onClose();
    navigate("/bookings");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="booking-inline-panel">
        {bookingError && <div className="inline-error-banner">{bookingError}</div>}

        <div className="inline-counter-box">
          <div>
            <span className="counter-title">Quantity</span>
            <p className="counter-sub">₹ {unitPrice.toLocaleString()} / ticket</p>
          </div>

          <div className="counter-controls">
            <button
              type="button"
              className="counter-action-btn"
              onClick={() => setTicketQuantity((q) => Math.max(1, q - 1))}
              disabled={ticketQuantity <= 1}
            >
              <FaMinus />
            </button>
            <span className="counter-count">{ticketQuantity}</span>
            <button
              type="button"
              className="counter-action-btn"
              onClick={() => setTicketQuantity((q) => Math.min(10, q + 1))}
            >
              <FaPlus />
            </button>
          </div>
        </div>

        <div className="inline-price-breakdown">
          <div className="breakdown-line">
            <span>Net Price ({ticketQuantity}x)</span>
            <span>₹ {totalAmount.toLocaleString()}</span>
          </div>
          <div className="breakdown-line">
            <span>Convenience Fee</span>
            <span className="free-tag">FREE</span>
          </div>
          <div className="breakdown-sep" />
          <div className="breakdown-line total-line">
            <span>Grand Total</span>
            <span>₹ {totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="inline-action-buttons">
          <button
            type="button"
            className="inline-pay-btn"
            onClick={handleOpenReview}
          >
            Pay ₹ {totalAmount.toLocaleString()}
          </button>
          <button
            type="button"
            className="inline-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* 1. REVIEW CONFIRMATION MODAL */}
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

      {/* 2. SUCCESS CONFIRMATION MODAL */}
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