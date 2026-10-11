import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { API_BASE_URL } from "../../config/config";
import { type Events } from "../../types/auth";
import { useUser } from "../../context/UserContext";

import {
  FaMinus,
  FaPlus,
  FaCheckCircle,
  FaQuestionCircle,
  FaTicketAlt,
} from "react-icons/fa";

import {
  getEventTickets,
  type EventTicket,
} from "../../services/eventTicketService";

import "./Booking.css";

interface ExtendedEvent extends Events {
  ticket_category_name?: string | null;
}

interface BookingProps {
  isOpen: boolean;
  onClose: () => void;
  event: ExtendedEvent;
  onRequireAuth?: () => void;
}

export function Booking({
  isOpen,
  onClose,
  event,
  onRequireAuth,
}: BookingProps) {
  const navigate = useNavigate();
  const { user } = useUser();

  // Tickets assigned to this specific event.
  const [parsedTiers, setParsedTiers] = useState<EventTicket[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<number | "">("");
  const [loadingTiers, setLoadingTiers] = useState(false);

  // Booking state.
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Confirmation modal state.
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] =
    useState<number | null>(null);

  const isConfirmationOpen = showReviewModal || showSuccessModal;

  // Fetch tickets whenever this booking panel opens for an event.
  useEffect(() => {
    if (!isOpen || !event.id) return;

    let cancelled = false;

    const loadTickets = async () => {
      setLoadingTiers(true);
      setBookingError(null);
      setParsedTiers([]);
      setSelectedTierId("");
      setTicketQuantity(1);

      try {
        const tickets = await getEventTickets(Number(event.id));

        if (!cancelled) {
          setParsedTiers(tickets);
          setSelectedTierId(tickets[0]?.id ?? "");
        }
      } catch (error) {
        console.error("Failed to load event tickets:", error);

        if (!cancelled) {
          setParsedTiers([]);
          setSelectedTierId("");
          setBookingError(
            "Unable to load tickets for this event. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTiers(false);
        }
      }
    };

    void loadTickets();

    return () => {
      cancelled = true;
    };
  }, [isOpen, event.id]);

  // Find the selected ticket.
  const activeTier = useMemo(
    () => parsedTiers.find((tier) => tier.id === selectedTierId),
    [parsedTiers, selectedTierId],
  );

  // Calculate the amount for the selected ticket and quantity.
  const unitPrice = Number(activeTier?.price ?? 0);
  const totalAmount = unitPrice * ticketQuantity;

  // Prevent background scrolling while a confirmation modal is open.
  useEffect(() => {
    if (!isConfirmationOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [isConfirmationOpen]);

  const handleOpenReview = () => {
    if (!user) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    if (loadingTiers) {
      setBookingError("Please wait while tickets are loading.");
      return;
    }

    if (!activeTier) {
      setBookingError("No tickets are available for this event.");
      return;
    }

    setBookingError(null);
    setShowReviewModal(true);
  };

  const handleFinalBookingSubmit = async () => {
    if (!activeTier) {
      setBookingError("Please select an available ticket.");
      return;
    }

    if (!Number.isInteger(ticketQuantity) || ticketQuantity < 1 || ticketQuantity > 10) {
      setBookingError("Please select a quantity between 1 and 10.");
      return;
    }

    try {
      setIsSubmitting(true);
      setBookingError(null);

      // The backend must validate this ticket belongs to this event
      // and calculate the final amount using its database price.
      const payload = {
        pass_id: Number(event.id),
        event_ticket_id: Number(activeTier.id),
        number_of_tickets: ticketQuantity,
        total_amount: totalAmount,
        booking_date: new Date().toISOString().split("T")[0],
        status: "CONFIRMED",
      };

      const response = await axios.post(
        `${API_BASE_URL}/v1/bookings`,
        payload,
        { withCredentials: true },
      );

      setConfirmedBookingId(response.data?.bookingId ?? null);
      setShowReviewModal(false);
      setShowSuccessModal(true);
    } catch (error: unknown) {
      console.error("Booking error:", error);
      setShowReviewModal(false);

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        onRequireAuth
      ) {
        onRequireAuth();
        return;
      }

      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message
          : undefined;

      setBookingError(
        message || "Failed to complete booking. Please try again.",
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
        {bookingError && (
          <div className="inline-error-banner" role="alert">
            {bookingError}
          </div>
        )}

        {/* TICKET CATEGORY DROPDOWN */}
        <div className="booking-tier-select-box">
          <label
            htmlFor="booking-tier-select"
            className="booking-tier-label"
          >
            <FaTicketAlt className="booking-tier-icon" />
            <span>Select Ticket Category</span>
          </label>

          <select
            id="booking-tier-select"
            className="booking-tier-dropdown"
            value={selectedTierId}
            onChange={(e) => {
              setSelectedTierId(
                e.target.value ? Number(e.target.value) : "",
              );
              setBookingError(null);
            }}
            disabled={loadingTiers || parsedTiers.length === 0}
          >
            {loadingTiers ? (
              <option value="">Loading tickets...</option>
            ) : parsedTiers.length === 0 ? (
              <option value="">No tickets available</option>
            ) : (
              parsedTiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name} — ₹
                  {Number(tier.price).toLocaleString("en-IN")}
                </option>
              ))
            )}
          </select>

          {activeTier?.description && (
            <p className="booking-tier-description">
              {activeTier.description}
            </p>
          )}
        </div>

        {/* QUANTITY COUNTER */}
        <div className="inline-counter-box">
          <div>
            <span className="counter-title">Quantity</span>

            <p className="counter-sub">
              ₹ {unitPrice.toLocaleString("en-IN")} / ticket
            </p>
          </div>

          <div className="counter-controls">
            <button
              type="button"
              className="counter-action-btn"
              onClick={() =>
                setTicketQuantity((quantity) =>
                  Math.max(1, quantity - 1),
                )
              }
              disabled={ticketQuantity <= 1}
              aria-label="Decrease quantity"
            >
              <FaMinus />
            </button>

            <span className="counter-count">{ticketQuantity}</span>

            <button
              type="button"
              className="counter-action-btn"
              onClick={() =>
                setTicketQuantity((quantity) =>
                  Math.min(10, quantity + 1),
                )
              }
              disabled={ticketQuantity >= 10}
              aria-label="Increase quantity"
            >
              <FaPlus />
            </button>
          </div>
        </div>

        {/* PRICE BREAKDOWN */}
        <div className="inline-price-breakdown">
          <div className="breakdown-line">
            <span>Ticket Category</span>

            <span className="breakdown-highlight-tier">
              {activeTier?.name ?? "No ticket selected"}
            </span>
          </div>

          <div className="breakdown-line">
            <span>Net Price ({ticketQuantity}x)</span>
            <span>₹ {totalAmount.toLocaleString("en-IN")}</span>
          </div>

          <div className="breakdown-line">
            <span>Convenience Fee</span>
            <span className="free-tag">FREE</span>
          </div>

          <div className="breakdown-sep" />

          <div className="breakdown-line total-line">
            <span>Grand Total</span>
            <span>₹ {totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="inline-action-buttons">
          <button
            type="button"
            className="inline-pay-btn"
            onClick={handleOpenReview}
            disabled={loadingTiers || !activeTier || isSubmitting}
          >
            {loadingTiers
              ? "Loading tickets..."
              : !activeTier
                ? "Tickets unavailable"
                : `Pay ₹ ${totalAmount.toLocaleString("en-IN")}`}
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

      {/* REVIEW AND SUCCESS MODALS */}
      {isConfirmationOpen &&
        createPortal(
          <>
            {/* REVIEW MODAL */}
            {showReviewModal && (
              <div className="booking-modal-overlay">
                <div
                  className="booking-modal-card review-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="booking-review-title"
                >
                  <div className="review-icon-wrapper">
                    <FaQuestionCircle />
                  </div>

                  <h3 id="booking-review-title">
                    Confirm Your Booking
                  </h3>

                  <p className="booking-modal-sub">
                    Do you confirm that you want to book this event?
                    Please review your reservation details below.
                  </p>

                  <div className="booking-summary-mini">
                    <div className="mini-row">
                      <span>Event:</span>
                      <strong>{event.name}</strong>
                    </div>

                    <div className="mini-row">
                      <span>Category / Tier:</span>

                      <strong style={{ color: "#5144ed" }}>
                        {activeTier?.name}
                      </strong>
                    </div>

                    <div className="mini-row">
                      <span>Location:</span>

                      <strong>
                        {event.location || event.city_name || "Venue TBA"}
                      </strong>
                    </div>

                    {event.event_date && (
                      <div className="mini-row">
                        <span>Date:</span>

                        <strong>
                          {new Intl.DateTimeFormat("en-IN", {
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

                      <strong>
                        {ticketQuantity} Pass
                        {ticketQuantity > 1 ? "es" : ""}
                      </strong>
                    </div>

                    <div className="mini-row total-highlight">
                      <span>Payable Amount:</span>

                      <strong>
                        ₹ {totalAmount.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>

                  <div className="review-modal-actions">
                    <button
                      type="button"
                      className="review-btn-cancel"
                      onClick={() => setShowReviewModal(false)}
                      disabled={isSubmitting}
                    >
                      Not yet
                    </button>

                    <button
                      type="button"
                      className="review-btn-confirm"
                      onClick={() => void handleFinalBookingSubmit()}
                      disabled={isSubmitting || !activeTier}
                    >
                      {isSubmitting
                        ? "Securing Pass..."
                        : "Yes, Confirm Booking"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUCCESS MODAL */}
            {showSuccessModal && (
              <div className="booking-modal-overlay">
                <div
                  className="booking-modal-card"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="booking-success-title"
                >
                  <div className="booking-success-icon-wrapper">
                    <FaCheckCircle />
                  </div>

                  <h3 id="booking-success-title">
                    Booking Confirmed!
                  </h3>

                  <p className="booking-modal-sub">
                    Your tickets for <strong>{event.name}</strong> have
                    been secured successfully.
                  </p>

                  <div className="booking-summary-mini">
                    <div className="mini-row">
                      <span>Pass Holder:</span>

                      <strong>{user?.name || user?.email}</strong>
                    </div>

                    <div className="mini-row">
                      <span>Ticket Category:</span>

                      <strong style={{ color: "#5144ed" }}>
                        {activeTier?.name}
                      </strong>
                    </div>

                    <div className="mini-row">
                      <span>Passes:</span>

                      <strong>
                        {ticketQuantity} Pass
                        {ticketQuantity > 1 ? "es" : ""}
                      </strong>
                    </div>

                    <div className="mini-row">
                      <span>Total Paid:</span>

                      <strong>
                        ₹ {totalAmount.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    {confirmedBookingId !== null && (
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
          </>,
          document.body,
        )}
    </>
  );
}