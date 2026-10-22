import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import {
  deactivateOrganiser,
  fetchMyEvents,
  getOrganiserErrorMessage,
  type OrganiserEvent,
} from "../../../services/organiserService";
import "./DeactivateOrganiser.css";

const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getUpcomingEvents = (events: OrganiserEvent[]): OrganiserEvent[] => {
  const today = getLocalDateKey(new Date());

  return events.filter((event) => {
    const eventDate = event.event_date.split("T")[0].split(" ")[0];
    return (
      (event.status === "PENDING" || event.status === "APPROVED") &&
      (eventDate >= today || event.is_live === true || event.is_live === 1)
    );
  });
};

function DeactivateOrganiser() {
  const navigate = useNavigate();
  const { clearUser } = useUser();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<OrganiserEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  const loadUpcomingEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError("");

    try {
      const events = await fetchMyEvents();
      setUpcomingEvents(getUpcomingEvents(events));
    } catch (loadError: unknown) {
      setEventsError(
        getOrganiserErrorMessage(
          loadError,
          "Unable to check your events. Please try again.",
        ),
      );
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchMyEvents()
      .then((events) => {
        if (isMounted) setUpcomingEvents(getUpcomingEvents(events));
      })
      .catch((loadError: unknown) => {
        if (isMounted) {
          setEventsError(
            getOrganiserErrorMessage(
              loadError,
              "Unable to check your events. Please try again.",
            ),
          );
        }
      })
      .finally(() => {
        if (isMounted) setEventsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!showConfirmation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        setShowConfirmation(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, showConfirmation]);

  const executeDeactivate = async () => {
    setError("");

    try {
      setLoading(true);
      await deactivateOrganiser();
      clearUser();
      navigate("/", { replace: true });
    } catch (deactivationError: unknown) {
      setShowConfirmation(false);
      setError(
        getOrganiserErrorMessage(
          deactivationError,
          "Unable to deactivate your organiser account. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="org-deactivate-page">
      <header className="org-deactivate-heading">
        <span className="org-deactivate-eyebrow">ACCOUNT</span>
        <h1>Deactivate organiser account</h1>
        <p>
          You can deactivate your account only when you have no upcoming
          events.
        </p>
      </header>

      <div className="org-deactivate-card">
        <div className="org-deactivate-warning" role="note">
          <span className="org-deactivate-warning-icon" aria-hidden="true">
            !
          </span>
          <div>
            <h2>Upcoming events must be resolved first</h2>
            <p>
              If you have any upcoming event, including a live event, you cannot
              deactivate your account. This keeps your attendees and bookings
              from being affected.
            </p>
          </div>
        </div>

        {eventsLoading ? (
          <p className="org-deactivate-event-status" role="status">
            Checking your upcoming events...
          </p>
        ) : eventsError ? (
          <div className="org-deactivate-event-error" role="alert">
            <p>{eventsError}</p>
            <button
              type="button"
              className="org-deactivate-cancel"
              onClick={() => void loadUpcomingEvents()}
            >
              Try again
            </button>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="org-deactivate-blocked" role="alert">
            <h2>
              Deactivation unavailable: {upcomingEvents.length} upcoming{" "}
              {upcomingEvents.length === 1 ? "event" : "events"}
            </h2>
            <p>
              Cancel or complete these events before deactivating your account.
            </p>
            <ul>
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <strong>{event.name}</strong>
                  <span>{event.event_date.split("T")[0].split(" ")[0]}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="org-deactivate-manage"
              onClick={() => navigate("/organiser/events")}
            >
              Manage events
            </button>
          </div>
        ) : (
        <div className="org-deactivate-details">
          <h2>Before you continue</h2>
          <ul>
            <li>
              Deactivation is not permanent deletion. Your account information
              may be retained in accordance with the CityPass Privacy Policy.
            </li>
            <li>
              Existing events, bookings, and tickets are not automatically
              cancelled by deactivating your account.
            </li>
            <li>
              Contact CityPass support if you need help with events or bookings
              before deactivating.
            </li>
          </ul>
        </div>
        )}

        {error && (
          <p className="org-deactivate-error" role="alert">
            {error}
          </p>
        )}

        <div className="org-deactivate-actions">
          <button
            type="button"
            className="org-deactivate-cancel"
            onClick={() => navigate("/organiser")}
          >
            Keep my account
          </button>
          <button
            type="button"
            className="org-deactivate-submit"
            onClick={() => {
              setError("");
              setShowConfirmation(true);
            }}
            disabled={
              loading ||
              eventsLoading ||
              Boolean(eventsError) ||
              upcomingEvents.length > 0
            }
          >
            {eventsLoading
              ? "Checking events..."
              : upcomingEvents.length > 0
                ? "Resolve upcoming events first"
                : "Deactivate account"}
          </button>
        </div>
      </div>

      {showConfirmation && (
        <div
          className="org-deactivate-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) {
              setShowConfirmation(false);
            }
          }}
        >
          <section
            className="org-deactivate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="org-deactivate-confirm-title"
          >
            <h2 id="org-deactivate-confirm-title">
              Confirm account deactivation
            </h2>
            <p>
              Are you sure you want to deactivate your organiser account? You
              will be signed out immediately.
            </p>
            <div className="org-deactivate-modal-actions">
              <button
                type="button"
                className="org-deactivate-cancel"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Go back
              </button>
              <button
                type="button"
                className="org-deactivate-submit"
                onClick={() => void executeDeactivate()}
                disabled={loading || eventsLoading || upcomingEvents.length > 0}
              >
                {loading ? "Deactivating..." : "Confirm deactivation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default DeactivateOrganiser;
