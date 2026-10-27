import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdEventAvailable,
  MdPendingActions,
  MdCheckCircle,
  MdCancel,
  MdConfirmationNumber,
} from "react-icons/md";
import {
  fetchMyEvents,
  fetchOrganiserBookings,
  getOrganiserErrorMessage,
  type OrganiserBooking,
  type OrganiserEvent,
} from "../../../services/organiserService";
import "./OrganiserHome.css";

const statusOrder = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
] as const;

// Checks whether an event date/time has already passed
const isEventPast = (dateValue?: string, timeValue?: string): boolean => {
  if (!dateValue) return false;

  const rawDate = dateValue.includes("T")
    ? dateValue.split("T")[0]
    : dateValue.split(" ")[0];

  const [yearStr, monthStr, dayStr] = rawDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

  let hours = 23;
  let minutes = 59;

  if (timeValue) {
    const parts = timeValue.split(":");
    if (parts.length >= 2) {
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    }
  }

  const eventDateTime = new Date(year, month - 1, day, hours, minutes, 0);
  return eventDateTime.getTime() < Date.now();
};

// Returns resolved event status (past non-cancelled events resolve to COMPLETED)
const resolveEventStatus = (event: OrganiserEvent): OrganiserEvent["status"] => {
  if (event.status === "CANCELLED") return "CANCELLED";
  if (isEventPast(event.event_date, event.time)) return "COMPLETED";
  return event.status;
};

function OrganiserHome() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<OrganiserEvent[]>([]);
  const [recentBookings, setRecentBookings] = useState<OrganiserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsData, bookingsData] = await Promise.all([
        fetchMyEvents(),
        fetchOrganiserBookings().catch(() => []),
      ]);
      setEvents(eventsData);
      setRecentBookings(bookingsData.slice(0, 5));
    } catch (loadError: unknown) {
      setError(
        getOrganiserErrorMessage(
          loadError,
          "We couldn't load your organiser dashboard."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Tally counts using resolved status so past approved events become COMPLETED
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    statusOrder.forEach((status) => {
      result[status] = events.filter(
        (e) => resolveEventStatus(e) === status
      ).length;
    });
    return result;
  }, [events]);

  // Only upcoming events that remain truly APPROVED
  const upcomingEvents = useMemo(
    () =>
      events
        .filter(
          (event) =>
            resolveEventStatus(event) === "APPROVED" &&
            new Date(`${event.event_date}T${event.time || "00:00"}`) >=
              new Date()
        )
        .sort(
          (a, b) =>
            new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        )
        .slice(0, 5),
    [events]
  );

  return (
    <>
      {error && (
        <div className="org-cmd-error-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadData()}>
            Retry
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="org-header-card">
        <div>
          <span className="org-badge">WORKSPACE OVERVIEW</span>
          <h2 className="org-title">Organiser Command Center</h2>
          <p className="org-subtitle">
            Manage your live event registrations, attendee bookings, ticket sales,
            and review listings across CityPass.
          </p>
        </div>

        <button
          type="button"
          className="org-btn-create-event"
          onClick={() => navigate("/organiser/events?create=1")}
        >
          + Create Event
        </button>
      </div>

      {/* Stats Grid */}
      <div className="org-stats-grid">
        <div className="org-stat-card">
          <div className="org-stat-header">
            <span>TOTAL EVENTS</span>
            <span><MdEventAvailable className="org-stat-icon" /></span>
          </div>
          <div className="org-stat-value">{loading ? "—" : events.length}</div>
          <div className="org-stat-subtext">All created listings</div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-header">
            <span>PENDING REVIEW</span>
            <span><MdPendingActions className="org-stat-icon" /></span>
          </div>
          <div className="org-stat-value">{loading ? "—" : counts.PENDING || 0}</div>
          <div className="org-stat-subtext">Awaiting admin review</div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-header">
            <span>APPROVED</span>
            <span><MdCheckCircle className="org-stat-icon" /></span>
          </div>
          <div className="org-stat-value">{loading ? "—" : counts.APPROVED || 0}</div>
          <div className="org-stat-subtext">Live on CityPass</div>
        </div>

        <div className="org-stat-card">
          <div className="org-stat-header">
            <span>REJECTED</span>
            <span><MdCancel className="org-stat-icon" /></span>
          </div>
          <div className="org-stat-value">{loading ? "—" : counts.REJECTED || 0}</div>
          <div className="org-stat-subtext">Declined submissions</div>
        </div>
      </div>

      {/* 2-Column Split: Dual Operational Cards */}
      <div className="org-queues-grid-dual">
        {/* Status Distribution Panel */}
        <div className="org-queue-card">
          <div className="org-card-head">
            <div>
              <h3 className="org-queue-title">Event Status Overview</h3>
              <p className="org-queue-desc">Review progress across your listings</p>
            </div>
            <Link to="/organiser/events" className="org-queue-link">
              All Events &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="org-queue-empty-state">
              <p>Loading event progress...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="org-queue-empty-state">
              <span className="org-empty-icon">
                <MdEventAvailable className="org-stat-icon" />
              </span>
              <p>No events submitted yet.</p>
            </div>
          ) : (
            <div className="org-status-bars-list">
              {statusOrder.map((status) => {
                const count = counts[status] || 0;
                const percentage = events.length
                  ? (count / events.length) * 100
                  : 0;

                return (
                  <div className="org-status-progress-row" key={status}>
                    <span className="org-status-label">
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                    <div className="org-progress-track">
                      <div
                        className={`org-progress-fill fill-${status.toLowerCase()}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <strong className="org-status-count">{count}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Bookings Panel */}
        <div className="org-queue-card">
          <div className="org-card-head">
            <div>
              <h3 className="org-queue-title">Recent Bookings</h3>
              <p className="org-queue-desc">Latest attendee ticket registrations</p>
            </div>
            <Link to="/organiser/attendees" className="org-queue-link">
              View All &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="org-queue-empty-state">
              <p>Loading recent bookings...</p>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="org-queue-empty-state">
              <span className="org-empty-icon">
                <MdConfirmationNumber className="org-stat-icon" />
              </span>
              <p>No recent attendee bookings yet.</p>
            </div>
          ) : (
            <div className="org-queue-items-list">
              {recentBookings.map((booking) => (
                <div key={booking.booking_id} className="org-item-row">
                  <div className="org-item-avatar">
                    {(booking.user_name || "G").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="org-item-content">
                    <div className="org-item-title">{booking.user_name || "Guest"}</div>
                    <div className="org-item-sub">{booking.event_name}</div>
                  </div>
                  <span className="org-ticket-badge">
                    {booking.number_of_tickets} tickets
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events Full Panel */}
      <div className="org-queue-card">
        <div className="org-card-head">
          <div>
            <h3 className="org-queue-title">Upcoming Scheduled Events</h3>
            <p className="org-queue-desc">Your active and approved listings</p>
          </div>
          <Link to="/organiser/events" className="org-queue-link">
            All Listings &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="org-queue-empty-state">
            <p>Loading upcoming events...</p>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="org-queue-empty-state">
            <span className="org-empty-icon">
              <MdEventAvailable className="org-stat-icon" />
            </span>
            <p>No upcoming approved events scheduled.</p>
          </div>
        ) : (
          <div className="org-queue-items-list">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="org-item-row">
                <div className="org-event-date-box">
                  <b>
                    {new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en", {
                      day: "2-digit",
                    })}
                  </b>
                  <small>
                    {new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en", {
                      month: "short",
                    })}
                  </small>
                </div>
                <div className="org-item-content">
                  <div className="org-item-title">{event.name}</div>
                  <div className="org-item-sub">
                    {event.city_name || "City not set"} · {event.time || "Time not set"}
                  </div>
                </div>
                <span className={`org-badge-status ${event.status.toLowerCase()}`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default OrganiserHome;