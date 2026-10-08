import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Loader2,
  MapPin,
  Plus,
  Search,
  Tag,
  X,
} from "lucide-react";
import {
  FaLaughSquint,
  FaMicrophone,
  FaMountain,
} from "react-icons/fa";
import { FaPaintbrush } from "react-icons/fa6";
import { IoFastFoodSharp } from "react-icons/io5";
import { MdSportsFootball, MdTheaterComedy } from "react-icons/md";
import type { IconType } from "react-icons";
import {
  fetchMyEvents,
  getOrganiserErrorMessage,
  type OrganiserEvent,
} from "../../../services/organiserService";
import { CreateEventModal } from "../CreateEventModal/CreateEventModal";
import "./OrganiserEvents.css";

type EventStatusFilter = "ALL" | OrganiserEvent["status"];

const PAGE_SIZE = 8;

const statuses: EventStatusFilter[] = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

const formatEventDate = (value?: string) => {
  if (!value) return "Date to be announced";
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (isNaN(parsed.getTime())) return "Date to be announced";
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatEventTime = (timeStr?: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

const categoryIcons: Record<string, IconType> = {
  Music: FaMicrophone,
  Sports: MdSportsFootball,
  Comedy: MdTheaterComedy,
  Food: IoFastFoodSharp,
  Art: FaPaintbrush,
  Adventure: FaMountain,
  Entertainment: FaLaughSquint,
};

const getCategoryIcon = (categoryName?: string | null) => {
  const normalizedCategory = categoryName?.toLowerCase() || "";
  if (normalizedCategory.includes("music")) return categoryIcons.Music;
  if (normalizedCategory.includes("sport")) return categoryIcons.Sports;
  if (normalizedCategory.includes("comedy")) return categoryIcons.Comedy;
  if (normalizedCategory.includes("theatre") || normalizedCategory.includes("theater")) return categoryIcons.Comedy;
  if (normalizedCategory.includes("food")) return categoryIcons.Food;
  if (normalizedCategory.includes("art")) return categoryIcons.Art;
  if (normalizedCategory.includes("adventure")) return categoryIcons.Adventure;
  if (normalizedCategory.includes("entertainment")) return categoryIcons.Entertainment;
  return null;
};

function OrganiserEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<OrganiserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventStatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<OrganiserEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<OrganiserEvent | null>(null);
  const [notice, setNotice] = useState("");

  const isCreateOpen = searchParams.get("create") === "1" || Boolean(editingEvent);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setEvents(await fetchMyEvents());
    } catch (loadError: unknown) {
      setError(
        getOrganiserErrorMessage(
          loadError,
          "Could not load your events. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchMyEvents()
      .then((data) => {
        if (active) setEvents(data);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            getOrganiserErrorMessage(
              loadError,
              "Could not load your events. Please try again."
            )
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return events.filter((event) => {
      const matchesStatus = filter === "ALL" || event.status === filter;

      const matchesSearch =
        !query ||
        [event.name, event.city_name, event.category_name, event.location].some(
          (value) => value?.toLocaleLowerCase().includes(query)
        );

      return matchesStatus && matchesSearch;
    });
  }, [events, filter, search]);

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pageEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const closeFormModal = () => {
    setEditingEvent(null);
    searchParams.delete("create");
    setSearchParams(searchParams, { replace: true });
  };

  const handleEventSaved = async () => {
    const wasEditing = Boolean(editingEvent);
    closeFormModal();
    setNotice(
      wasEditing
        ? "Event details updated successfully."
        : "Event submitted for admin approval"
    );
    window.setTimeout(() => setNotice(""), 5000);
    await loadEvents();
  };

  const changeFilter = (next: EventStatusFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="organiser-events">
      <header className="org-page-heading org-events-heading">
        <div>
          <span className="org-eyebrow">EVENT MANAGEMENT</span>
          <h1>My events</h1>
          <p>Track submissions and keep event details in one place.</p>
        </div>

        <button
          className="org-primary-action"
          onClick={() => {
            setEditingEvent(null);
            setSearchParams({ create: "1" });
          }}
        >
          <Plus size={17} /> Create event
        </button>
      </header>

      {notice && (
        <div className="org-success-toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="org-event-toolbar">
        <div className="org-event-tabs" role="tablist" aria-label="Filter events by status">
          {statuses.map((status) => (
            <button
              key={status}
              role="tab"
              aria-selected={filter === status}
              className={filter === status ? "active" : ""}
              onClick={() => changeFilter(status)}
            >
              {status === "ALL"
                ? "All"
                : status.charAt(0) + status.slice(1).toLowerCase()}
              <span>
                {status === "ALL"
                  ? events.length
                  : events.filter((event) => event.status === status).length}
              </span>
            </button>
          ))}
        </div>

        <label className="org-event-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search events"
            aria-label="Search events"
          />
        </label>
      </div>

      {loading && (
        <div className="org-events-state">
          <Loader2 className="org-spin" size={25} />
          <span>Loading your events...</span>
        </div>
      )}

      {!loading && error && (
        <div className="org-events-state org-events-error">
          <p>{error}</p>
          <button className="org-button-secondary" onClick={() => void loadEvents()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && pageEvents.length === 0 && (
        <div className="org-events-state org-events-empty">
          <CalendarDays size={34} />
          <h2>
            {events.length
              ? "No matching events"
              : "Your next great event starts here"}
          </h2>
          <p>
            {events.length
              ? "Try another status or search term."
              : "Create an event to submit it for admin approval."}
          </p>

          {!events.length && (
            <button
              className="org-primary-action"
              onClick={() => setSearchParams({ create: "1" })}
            >
              <Plus size={16} /> Create event
            </button>
          )}
        </div>
      )}

      {!loading && !error && pageEvents.length > 0 && (
        <>
          <div className="org-cards-grid">
            {pageEvents.map((event) => {
              const CategoryIcon = getCategoryIcon(event.category_name);
              const imageUrl = (event as any).image_url || (event as any).image;

              return (
                <article
                  className="org-grid-card"
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div
                    className={`org-card-media ${imageUrl ? "has-image" : ""}`}
                    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                  >
                    {imageUrl && <div className="org-card-media-overlay" />}

                    <div className="org-card-top-badges">
                      <span className="org-card-category-badge">
                        {CategoryIcon ? <CategoryIcon size={12} /> : <Tag size={12} />}
                        {event.category_name || "Event"}
                      </span>
                      <span className={`org-card-status-pill ${event.status.toLowerCase()}`}>
                        {event.status}
                      </span>
                    </div>

                    <p className="org-card-location">
                      <MapPin size={13} className="org-card-pin" />
                      <span>{event.location || event.city_name || "Location TBD"}</span>
                    </p>
                  </div>

                  <div className="org-card-content">
                    <div>
                      <span className="org-card-date">
                        {formatEventDate(event.event_date)}
                        {event.time ? ` · ${formatEventTime(event.time)}` : ""}
                      </span>
                      <h3 title={event.name}>{event.name}</h3>
                    </div>

                    <div className="org-card-footer">
                      <div>
                        <span className="org-card-price-label">Ticket Price</span>
                        <p className="org-card-price">
                          ₹{Number(event.price || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="org-card-action-group">
                        <button
                          type="button"
                          className="org-card-edit-btn"
                          title="Edit event"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                          }}
                        >
                          <Edit size={13} /> Edit
                        </button>

                        <button
                          type="button"
                          className="org-card-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                        >
                          <Eye size={13} /> Details
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {pageCount > 1 && (
            <nav className="org-pagination" aria-label="Event pages">
              <span>
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filteredEvents.length)} of{" "}
                {filteredEvents.length}
              </span>

              <div>
                <button
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={17} />
                </button>

                <span>
                  {page} / {pageCount}
                </span>

                <button
                  aria-label="Next page"
                  disabled={page === pageCount}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={closeFormModal}
        onEventSaved={handleEventSaved}
        eventToEdit={editingEvent}
      />

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {
            const ev = selectedEvent;
            setSelectedEvent(null);
            setEditingEvent(ev);
          }}
        />
      )}
    </div>
  );
}

function EventDetailsModal({
  event,
  onClose,
  onEdit,
}: {
  event: OrganiserEvent;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="org-detail-backdrop"
      onMouseDown={(click) => {
        if (click.target === click.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="org-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-detail-title"
      >
        <header className="org-detail-header">
          <div className="org-detail-header-text">
            <div className="org-detail-meta-tags">
              <span className="org-detail-badge-cat">
                {event.category_name || "General"}
              </span>
              <span className={`org-status-badge ${event.status.toLowerCase()}`}>
                {event.status}
              </span>
            </div>
            <h2 id="org-detail-title">{event.name}</h2>
          </div>

          <button
            className="org-detail-close-btn"
            onClick={onClose}
            aria-label="Close event details"
          >
            <X size={18} />
          </button>
        </header>

        <div className="org-detail-content">
          {event.status === "REJECTED" && (
            <div className="org-detail-reason">
              <strong>Admin Rejection Feedback</strong>
              <p>
                {event.rejection_reason ||
                  "Your submission was rejected by the platform administrator. Please verify venue details and resubmit."}
              </p>
            </div>
          )}

          <div className="org-detail-metrics-row">
            <div className="org-detail-metric-card">
              <span className="metric-label">Date & Time</span>
              <span className="metric-value">
                {formatEventDate(event.event_date)}
              </span>
              <span className="metric-sub">
                {event.time ? formatEventTime(event.time) : "Time not set"}
              </span>
            </div>

            <div className="org-detail-metric-card">
              <span className="metric-label">Ticket Price</span>
              <span className="metric-value">
                ₹{Number(event.price).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="metric-sub">Per ticket</span>
            </div>

            <div className="org-detail-metric-card">
              <span className="metric-label">Capacity</span>
              <span className="metric-value">{event.capacity || "—"}</span>
              <span className="metric-sub">Max attendees</span>
            </div>
          </div>

          <div className="org-detail-section">
            <span className="org-detail-section-title">Venue & Location</span>
            <div className="org-detail-location-card">
              <MapPin size={18} className="org-detail-location-icon" />
              <div>
                <p className="org-detail-venue">{event.location || "Venue not set"}</p>
                <p className="org-detail-city">{event.city_name || "City not specified"}</p>
              </div>
            </div>
          </div>

          <div className="org-detail-section">
            <span className="org-detail-section-title">Description</span>
            <p className="org-detail-description">
              {event.description?.trim() || "No event description provided for this submission."}
            </p>
          </div>
        </div>

        <footer className="org-detail-footer">
          <div className="org-detail-footer-actions">
            {event.status === "APPROVED" && event.slug ? (
              <a
                className="org-public-event-link"
                href={`/events/${event.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                View Public Event <ArrowUpRight size={15} />
              </a>
            ) : (
              <span className="org-detail-footer-note">
                {event.status === "PENDING"
                  ? "Awaiting review by platform administrator."
                  : "Public ticket sales unavailable."}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="org-button-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              onClick={onEdit}
            >
              <Edit size={14} /> Edit Event
            </button>

            <button
              type="button"
              className="org-button-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default OrganiserEvents;