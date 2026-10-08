import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Plus,
  TicketCheck,
  Users,
} from "lucide-react";
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

function OrganiserHome() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<OrganiserEvent[]>([]);
  const [recentBookings, setRecentBookings] = useState<
    OrganiserBooking[]
  >([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetchMyEvents()
      .then((data) => {
        if (active) setEvents(data);
      })
      .catch((loadError: unknown) => {
        if (active)
          setError(
            getOrganiserErrorMessage(
              loadError,
              "We couldn't load your event overview."
            )
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchOrganiserBookings()
      .then((data) => {
        if (active) setRecentBookings(data.slice(0, 4));
      })
      .catch(() => {
        if (active) setRecentBookings([]);
      })
      .finally(() => {
        if (active) setBookingsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      setEvents(await fetchMyEvents());
    } catch (loadError: unknown) {
      setError(
        getOrganiserErrorMessage(
          loadError,
          "We couldn't load your event overview."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const result: Record<string, number> = {};

    statusOrder.forEach((status) => {
      result[status] = events.filter(
        (event) => event.status === status
      ).length;
    });

    return result;
  }, [events]);

  const upcoming = useMemo(
    () =>
      events
        .filter(
          (event) =>
            new Date(
              `${event.event_date}T${event.time || "00:00"}`
            ) >= new Date()
        )
        .sort(
          (a, b) =>
            new Date(a.event_date).getTime() -
            new Date(b.event_date).getTime()
        )
        .slice(0, 4),
    [events]
  );

  return (
    <div className="organiser-home">
      <header className="org-page-heading org-dashboard-heading">
        <div>
          <span className="org-eyebrow">
            YOUR ORGANISER SPACE
          </span>

          <h1>Dashboard</h1>

          <p>
            A clear view of your events and what needs attention.
          </p>
        </div>

        <button
          className="org-primary-action"
          onClick={() =>
            navigate("/organiser/events?create=1")
          }
        >
          <Plus size={17} /> Create event
        </button>
      </header>

      {error && (
        <div className="org-inline-error" role="alert">
          <span>{error}</span>

          <button onClick={() => void loadEvents()}>
            Retry
          </button>
        </div>
      )}

      <section
        className="org-stat-grid"
        aria-label="Event totals"
      >
        <article className="org-stat-card">
          <span className="org-stat-icon lilac">
            <CalendarDays size={19} />
          </span>

          <div>
            <p>Total events</p>

            <strong>
              {loading ? "—" : events.length}
            </strong>
          </div>
        </article>

        <article className="org-stat-card">
          <span className="org-stat-icon amber">
            <Clock3 size={19} />
          </span>

          <div>
            <p>Pending review</p>

            <strong>
              {loading ? "—" : counts.PENDING}
            </strong>
          </div>
        </article>

        <article className="org-stat-card">
          <span className="org-stat-icon green">
            <TicketCheck size={19} />
          </span>

          <div>
            <p>Approved</p>

            <strong>
              {loading ? "—" : counts.APPROVED}
            </strong>
          </div>
        </article>

        <article className="org-stat-card">
          <span className="org-stat-icon rose">
            <CalendarDays size={19} />
          </span>

          <div>
            <p>Rejected</p>

            <strong>
              {loading ? "—" : counts.REJECTED}
            </strong>
          </div>
        </article>
      </section>

      <section className="org-performance-grid">
        <article className="org-panel org-status-panel">
          <div className="org-panel-heading">
            <div>
              <h2>Event status</h2>

              <p>
                Review progress across your listings
              </p>
            </div>

            <Link to="/organiser/events">
              All events <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="org-panel-loading">
              Loading event summary...
            </div>
          ) : events.length === 0 ? (
            <div className="org-panel-empty">
              Your event status summary will appear here.
            </div>
          ) : (
            <div className="org-status-bars">
              {statusOrder.map((status) => {
                const total = events.length
                  ? (counts[status] / events.length) * 100
                  : 0;

                return (
                  <div
                    className="org-status-row"
                    key={status}
                  >
                    <span>
                      {status.charAt(0) +
                        status.slice(1).toLowerCase()}
                    </span>

                    <div className="org-status-track">
                      <i
                        className={`fill-${status.toLowerCase()}`}
                        style={{ width: `${total}%` }}
                      />
                    </div>

                    <strong>{counts[status]}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="org-panel org-metrics-panel">
          <div className="org-panel-heading">
            <div>
              <h2>Performance</h2>

              <p>Sales reporting for your events</p>
            </div>

            <CircleDollarSign size={19} />
          </div>

          <div className="org-unavailable-metric">
            <span>Tickets sold</span>

            <strong>Not available</strong>

            <small>
              The current API does not return ticket sales.
            </small>
          </div>

          <div className="org-unavailable-metric">
            <span>Total revenue</span>

            <strong>Not available</strong>

            <small>
              Revenue requires organiser booking data.
            </small>
          </div>
        </article>
      </section>

      <section className="org-bottom-grid">
        <article className="org-panel org-upcoming-panel">
          <div className="org-panel-heading">
            <div>
              <h2>Upcoming events</h2>

              <p>Your next scheduled listings</p>
            </div>

            <Link to="/organiser/events">
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="org-panel-loading">
              Loading upcoming events...
            </div>
          ) : upcoming.length === 0 ? (
            <div className="org-panel-empty">
              <CalendarDays size={22} />

              <span>No upcoming events yet.</span>
            </div>
          ) : (
            <div className="org-upcoming-list">
              {upcoming.map((event) => (
                <Link
                  className="org-upcoming-item"
                  to="/organiser/events"
                  key={event.id}
                >
                  <span className="org-upcoming-date">
                    <b>
                      {new Date(
                        `${event.event_date}T00:00:00`
                      ).toLocaleDateString("en", {
                        day: "2-digit",
                      })}
                    </b>

                    <small>
                      {new Date(
                        `${event.event_date}T00:00:00`
                      ).toLocaleDateString("en", {
                        month: "short",
                      })}
                    </small>
                  </span>

                  <span className="org-upcoming-info">
                    <b>{event.name}</b>

                    <small>
                      {event.city_name || "City not set"} ·{" "}
                      {event.time || "Time not set"}
                    </small>
                  </span>

                  <span
                    className={`org-status-badge ${event.status.toLowerCase()}`}
                  >
                    {event.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="org-panel org-recent-bookings">
          <div className="org-panel-heading">
            <div>
              <h2>Recent bookings</h2>

              <p>Latest attendee activity</p>
            </div>

            <Link to="/organiser/attendees">
              Bookings <ArrowRight size={15} />
            </Link>
          </div>

          {bookingsLoading ? (
            <div className="org-panel-loading">
              Loading recent bookings...
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="org-bookings-preview">
              <span>
                <Users size={19} />
              </span>

              <strong>No bookings yet</strong>

              <p>
                New attendee bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="org-recent-booking-list">
              {recentBookings.map((booking) => (
                <Link
                  to="/organiser/attendees"
                  className="org-recent-booking-row"
                  key={booking.booking_id}
                >
                  <span className="org-recent-booking-avatar">
                    {(booking.user_name || "G")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <span className="org-recent-booking-person">
                    <b>{booking.user_name || "Guest"}</b>

                    <small>{booking.event_name}</small>
                  </span>

                  <span className="org-recent-booking-tickets">
                    {booking.number_of_tickets} tk
                  </span>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default OrganiserHome;