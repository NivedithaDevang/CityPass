import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  FileEdit,
  Globe2,
  Info,
  Loader2,
  MapPin,
  Plus,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import {
  fetchMyEvents,
  fetchOrganiserBookings,
  getOrganiserErrorMessage,
  cancelEvent,
  liveEvent,
  type OrganiserEvent,
  type OrganiserBooking,
} from "../../../services/organiserService";

import { CreateEventModal } from "../CreateEventModal/CreateEventModal";
import EventTicketManager from "../../../components/EventTicketManager/EventTicketManager";
import { useUser } from "../../../context/UserContext";
import {
  deleteOrganiserEventDraft,
  getOrganiserEventDrafts,
  saveOrganiserEventDraft,
  type OrganiserEventDraft,
} from "../../../services/organiserEventDrafts";
import "./OrganiserEvents.css";

type EventStatusFilter = "ALL" | OrganiserEvent["status"];

type Decision = {
  eventId: number;
  eventName: string;
  status: "CANCELLED";
};

const PAGE_SIZE = 8;

const statuses: EventStatusFilter[] = [
  "ALL",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

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

const isEventToday = (dateValue?: string): boolean => {
  if (!dateValue) return false;

  const rawDate = dateValue.includes("T")
    ? dateValue.split("T")[0]
    : dateValue.split(" ")[0];

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  return rawDate === todayStr;
};

const formatEventDate = (value?: string) => {
  if (!value) return "Date to be announced";

  const rawDate = value.includes("T")
    ? value.split("T")[0]
    : value.split(" ")[0];

  const [yearStr, monthStr, dayStr] = rawDate.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return "Date to be announced";
  }

  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString("en-IN", {
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

const resolveEventStatus = (event: OrganiserEvent): OrganiserEvent["status"] => {
  if (event.status === "CANCELLED") return "CANCELLED";
  if (isEventPast(event.event_date, event.time)) return "COMPLETED";
  return event.status;
};

function OrganiserEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUser();

  const [events, setEvents] = useState<OrganiserEvent[]>([]);
  const [bookings, setBookings] = useState<OrganiserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<EventStatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [selectedEvent, setSelectedEvent] = useState<OrganiserEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<OrganiserEvent | null>(null);
  const [drafts, setDrafts] = useState<OrganiserEventDraft[]>([]);
  const [editingDraft, setEditingDraft] = useState<OrganiserEventDraft | null>(null);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftsError, setDraftsError] = useState("");

  const [notice, setNotice] = useState("");
  const [ticketEventId, setTicketEventId] = useState<number | null>(null);

  const isCreateOpen =
    searchParams.get("create") === "1" ||
    Boolean(editingEvent) ||
    Boolean(editingDraft);
  const organiserId = String(user?.id ?? "");

  const [cancel, setCancel] = useState<Decision | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [liveEvents, setLiveEvents] = useState<Record<string, boolean>>({});

  // Map of eventId -> total booked tickets count
  const bookedCountsMap = useMemo(() => {
    const map: Record<number, number> = {};

    bookings.forEach((booking: any) => {
      // Exclude cancelled / failed bookings from attendance count
      const status = (booking.status || "").toUpperCase();
      if (status === "CANCELLED" || status === "FAILED") return;

      const evId = Number(booking.event_id || booking.pass_id);
      const count = Number(booking.number_of_tickets || booking.tickets_count || 1);

      if (evId) {
        map[evId] = (map[evId] || 0) + count;
      }
    });

    return map;
  }, [bookings]);

  const confirmCancelEvent = async () => {
    if (!cancel) return;

    const { eventId, status } = cancel;

    try {
      setActionLoading(eventId);
      setError(null);

      await cancelEvent(eventId, status);

      setEvents((prev) =>
        prev.map((ev) =>
          Number(ev.id) === eventId ? { ...ev, status: "CANCELLED" } : ev
        )
      );

      setSelectedEvent((prev) =>
        prev && Number(prev.id) === eventId
          ? { ...prev, status: "CANCELLED" }
          : prev
      );

      setNotice(`"${cancel.eventName}" has been cancelled successfully.`);
      window.setTimeout(() => setNotice(""), 4000);
    } catch (err: unknown) {
      setError(
        getOrganiserErrorMessage(
          err,
          "Failed to cancel the event. Please try again."
        )
      );
    } finally {
      setActionLoading(null);
      setCancel(null);
    }
  };

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, bookingsData] = await Promise.all([
        fetchMyEvents(),
        fetchOrganiserBookings().catch(() => []),
      ]);

      setEvents(data);
      setBookings(bookingsData);
      setLiveEvents(
        Object.fromEntries(
          data.map((event) => [String(event.id), Boolean(event.is_live)])
        )
      );
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

  const handleToggleLive = async (e: React.MouseEvent, eventId: number) => {
    e.stopPropagation();

    const idKey = String(eventId);
    const currentStatus = Boolean(liveEvents[idKey]);
    const nextStatus = !currentStatus;

    setLiveEvents((prev) => ({ ...prev, [idKey]: nextStatus }));

    try {
      await liveEvent(eventId, nextStatus);
      setEvents((prev) =>
        prev.map((event) =>
          Number(event.id) === eventId
            ? { ...event, is_live: nextStatus }
            : event
        )
      );
      setNotice(nextStatus ? "Event is now live!" : "Event is no longer live.");
      window.setTimeout(() => setNotice(""), 3000);
    } catch (err: unknown) {
      setLiveEvents((prev) => ({ ...prev, [idKey]: currentStatus }));
      setError(
        getOrganiserErrorMessage(
          err,
          "Failed to update live status. Please try again."
        )
      );
    }
  };

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!organiserId) return;

    let active = true;

    getOrganiserEventDrafts(organiserId)
      .then((savedDrafts) => {
        if (active) {
          setDrafts(savedDrafts);
          setDraftsError("");
        }
      })
      .catch((draftError: unknown) => {
        if (active) {
          setDraftsError(
            draftError instanceof Error
              ? draftError.message
              : "Could not load saved drafts."
          );
        }
      })
      .finally(() => {
        if (active) setDraftsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [organiserId]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return events.filter((event) => {
      const effectiveStatus = resolveEventStatus(event);
      const matchesStatus = filter === "ALL" || effectiveStatus === filter;

      const matchesSearch =
        !query ||
        [
          event.name,
          event.city_name,
          event.category_name,
          event.location,
        ].some((value) => value?.toLocaleLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [events, filter, search]);

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));

  const pageEvents = filteredEvents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const closeFormModal = () => {
    setEditingEvent(null);
    setEditingDraft(null);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("create");

    setSearchParams(nextParams, { replace: true });
  };

  const handleEventSaved = async () => {
    const wasEditing = Boolean(editingEvent);

    closeFormModal();

    setNotice(
      wasEditing
        ? "Event updated and resubmitted for admin review."
        : "Event submitted for admin approval."
    );

    window.setTimeout(() => setNotice(""), 5000);

    await loadEvents();
  };

  const changeFilter = (next: EventStatusFilter) => {
    setFilter(next);
    setPage(1);
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setEditingDraft(null);
    setSearchParams({ create: "1" });
  };

  const saveDraft = async (draft: OrganiserEventDraft) => {
    if (!organiserId) {
      throw new Error("Your organiser account could not be identified.");
    }

    const savedDraft = { ...draft, organiserId };
    await saveOrganiserEventDraft(savedDraft);
    setDrafts((current) => [
      savedDraft,
      ...current.filter((item) => item.id !== savedDraft.id),
    ]);
    setNotice("Event draft saved on this device.");
    window.setTimeout(() => setNotice(""), 5000);
  };

  const removeDraft = async (draftId: string) => {
    try {
      await deleteOrganiserEventDraft(draftId);
      setDrafts((current) => current.filter((draft) => draft.id !== draftId));
      setDraftsError("");
    } catch (draftError: unknown) {
      setDraftsError(
        draftError instanceof Error
          ? draftError.message
          : "Could not delete this draft."
      );
    }
  };

  const submitDraft = async (draftId: string) => {
    try {
      await deleteOrganiserEventDraft(draftId);
      setDrafts((current) => current.filter((draft) => draft.id !== draftId));
    } catch {
      setDraftsError(
        "The event was submitted, but its saved draft could not be removed. You can delete it from saved drafts."
      );
    }
  };

  const openDraft = (draft: OrganiserEventDraft) => {
    setEditingEvent(null);
    setEditingDraft(draft);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("create");
    setSearchParams(nextParams, { replace: true });
  };

  const openEditModal = (event: OrganiserEvent) => {
    const effectiveStatus = resolveEventStatus(event);
    if (
      effectiveStatus === "PENDING" ||
      effectiveStatus === "CANCELLED" ||
      effectiveStatus === "COMPLETED"
    ) {
      return;
    }

    setSelectedEvent(null);
    setEditingEvent(event);
  };

  const openTicketManager = (event: OrganiserEvent) => {
    const effectiveStatus = resolveEventStatus(event);
    if (effectiveStatus === "CANCELLED" || effectiveStatus === "COMPLETED") {
      return;
    }

    setSelectedEvent(null);
    setTicketEventId(Number(event.id));
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
          type="button"
          className="org-primary-action"
          onClick={openCreateModal}
        >
          <Plus size={17} />
          Create event
        </button>
      </header>

      {notice && (
        <div className="org-success-toast" role="status">
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {(draftsLoading || draftsError || drafts.length > 0) && (
        <section
          className="org-saved-drafts"
          aria-labelledby="org-saved-drafts-title"
        >
          <div className="org-saved-drafts-heading">
            <div>
              <span className="org-eyebrow">NOT SUBMITTED</span>
              <h2 id="org-saved-drafts-title">Saved drafts</h2>
            </div>
            <span className="org-saved-drafts-count">{drafts.length}</span>
          </div>

          {draftsLoading && (
            <p className="org-drafts-message" role="status">
              Loading saved drafts...
            </p>
          )}

          {draftsError && (
            <p className="org-drafts-error" role="alert">
              {draftsError}
            </p>
          )}

          {!draftsLoading && drafts.length > 0 && (
            <div className="org-drafts-grid">
              {drafts.map((draft) => (
                <article className="org-draft-card" key={draft.id}>
                  <div>
                    <span className="org-draft-status">DRAFT</span>
                    <h3>{draft.formData.name.trim() || "Untitled event"}</h3>
                    <p>
                      Last saved{" "}
                      {new Date(draft.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="org-draft-actions">
                    <button
                      type="button"
                      className="org-draft-edit"
                      onClick={() => openDraft(draft)}
                    >
                      <FileEdit size={15} />
                      Edit & submit
                    </button>
                    <button
                      type="button"
                      className="org-draft-delete"
                      onClick={() => void removeDraft(draft.id)}
                      aria-label={`Delete ${draft.formData.name || "untitled event"} draft`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="org-event-toolbar">
        <div
          className="org-event-tabs"
          role="tablist"
          aria-label="Filter events by status"
        >
          {statuses.map((status) => {
            const count =
              status === "ALL"
                ? events.length
                : events.filter((ev) => resolveEventStatus(ev) === status).length;

            return (
              <button
                type="button"
                key={status}
                role="tab"
                aria-selected={filter === status}
                className={filter === status ? "active" : ""}
                onClick={() => changeFilter(status)}
              >
                {status === "ALL"
                  ? "All"
                  : status.charAt(0) + status.slice(1).toLowerCase()}

                <span>{count}</span>
              </button>
            );
          })}
        </div>

        <label className="org-event-search">
          <Search size={16} />

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
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

          <button
            type="button"
            className="org-button-secondary"
            onClick={() => void loadEvents()}
          >
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
              type="button"
              className="org-primary-action"
              onClick={openCreateModal}
            >
              <Plus size={16} />
              Create event
            </button>
          )}
        </div>
      )}

      {!loading && !error && pageEvents.length > 0 && (
        <>
          <div className="org-cards-grid">
            {pageEvents.map((event) => {
              const effectiveStatus = resolveEventStatus(event);

              const isPending = effectiveStatus === "PENDING";
              const isCancelled = effectiveStatus === "CANCELLED";
              const isRejected = effectiveStatus === "REJECTED";
              const isApproved = effectiveStatus === "APPROVED";
              const isCompleted = effectiveStatus === "COMPLETED";

              const isCardGrey = isPending || isCancelled || isRejected || isCompleted;

              const eventDateMatchesToday = isEventToday(event.event_date);
              const isCurrentlyLive = Boolean(liveEvents[String(event.id)]);

              const canGoLive =
                isApproved && !isCompleted && (eventDateMatchesToday || isCurrentlyLive);

              const canCancel = isApproved && !isCompleted;
              const canEditOrResubmit = (isApproved || isRejected) && !isCompleted;
              const canManageTickets = !isCancelled && !isCompleted;

              const totalCapacity = Number(event.capacity || (event as any).total_capacity || 0);
              const bookedTickets = bookedCountsMap[Number(event.id)] || 0;
              const percentageBooked = totalCapacity > 0
                ? Math.min(100, Math.round((bookedTickets / totalCapacity) * 100))
                : 0;

              const imageUrl =
                (event as any).image_url || (event as any).image;

              return (
                <article
                  className={`org-grid-card ${isCardGrey ? "is-disabled" : ""} ${isCompleted ? "is-completed" : ""}`}
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div
                    className={`org-card-media ${imageUrl ? "has-image" : ""}`}
                    style={
                      imageUrl
                        ? { backgroundImage: `url(${imageUrl})` }
                        : undefined
                    }
                  >
                    {imageUrl && <div className="org-card-media-overlay" />}

                    <div className="org-card-top-badges">
                      <span className="org-card-category-badge">
                        {event.category_name || "Event"}
                      </span>

                      <span
                        className={`org-card-status-pill ${effectiveStatus.toLowerCase()}`}
                      >
                        {effectiveStatus}
                      </span>
                    </div>

                    <p className="org-card-location">
                      <MapPin size={13} className="org-card-pin" />

                      <span>
                        {event.location ? `${event.location}, ` : ""}
                        {event.city_name || "City yet to be announced"}
                      </span>
                    </p>
                  </div>

                  <div className="org-card-content">
                    <div>
                      <span className="org-card-date">
                        {formatEventDate(event.event_date)}
                        {event.time
                          ? ` · ${formatEventTime(event.time)}`
                          : ""}
                      </span>

                      <h3 title={event.name}>{event.name}</h3>
                    </div>

                    {/* Booked / Capacity Indicator */}
                    <div className="org-card-capacity-track-container" style={{ margin: "4px 0 2px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#334155",
                          marginBottom: "5px",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#64748b", fontWeight: 600 }}>
                          <Users size={13} color="#5144ed" /> Booked:
                        </span>
                        <span>
                          <strong style={{ color: "#0f172a", fontWeight: 800 }}>{bookedTickets}</strong>
                          <span style={{ color: "#94a3b8", fontWeight: 600 }}> / {totalCapacity || "—"}</span>
                          <small style={{ color: "#5144ed", marginLeft: "6px", fontSize: "11px" }}>({percentageBooked}%)</small>
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          borderRadius: "999px",
                          background: "#f1f5f9",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percentageBooked}%`,
                            height: "100%",
                            borderRadius: "999px",
                            background: percentageBooked >= 90 ? "#ef4444" : "linear-gradient(90deg, #6366f1, #4f46e5)",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>

                    {effectiveStatus !== "CANCELLED" && (
                      <div
                        className="go-live-container"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="go-live-stack">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={Boolean(liveEvents[String(event.id)])}
                            disabled={!canGoLive}
                            className={`go-live-toggle ${
                              liveEvents[String(event.id)] && !isCompleted ? "is-live" : ""
                            } ${!canGoLive ? "btn-disabled" : ""}`}
                            onClick={(e) => {
                              if (canGoLive) {
                                handleToggleLive(e, Number(event.id));
                              }
                            }}
                          >
                            <span className="go-live-switch">
                              <span className="go-live-thumb" />
                            </span>
                            <span className="go-live-text">
                              {liveEvents[String(event.id)] && !isCompleted ? "Live" : "Go Live"}
                            </span>
                          </button>

                          {isCompleted ? (
                            <span className="go-live-inline-hint">
                              <Info size={11} /> Event has concluded
                            </span>
                          ) : !canGoLive && isApproved && !eventDateMatchesToday ? (
                            <span className="go-live-inline-hint">
                              <Info size={11} /> Unlocks on event day
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          className="cancel-action-btn"
                          disabled={
                            !canCancel || actionLoading === Number(event.id)
                          }
                          title={
                            isCompleted
                              ? "Event has already concluded"
                              : !canCancel
                              ? `Cannot cancel an event with status ${effectiveStatus}`
                              : "Cancel Event"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canCancel) {
                              setCancel({
                                eventId: Number(event.id),
                                eventName: event.name,
                                status: "CANCELLED",
                              });
                            }
                          }}
                        >
                          {actionLoading === Number(event.id) ? (
                            <Loader2 className="org-spin" size={13} />
                          ) : (
                            "Cancel Event"
                          )}
                        </button>
                      </div>
                    )}

                    <div className="org-card-footer">
                      <div>
                        <span className="org-card-price-label">
                          Ticket Price
                        </span>

                        <p className="org-card-price">
                          ₹
                          {Number(event.price || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="org-card-action-group">
                        <button
                          type="button"
                          className={`org-card-edit-btn ${isRejected ? "btn-resubmit" : ""}`}
                          disabled={!canEditOrResubmit}
                          title={
                            isCompleted
                              ? "Event is completed and cannot be edited"
                              : isRejected
                              ? "Edit details and re-submit for admin review"
                              : !canEditOrResubmit
                                ? `Cannot edit an event that is ${effectiveStatus.toLowerCase()}`
                                : "Edit event"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canEditOrResubmit) {
                              openEditModal(event);
                            }
                          }}
                        >
                          <Edit size={13} />
                          {isRejected ? "Edit & Re-submit" : "Edit"}
                        </button>

                        <button
                          type="button"
                          className="org-card-action-btn"
                          disabled={!canManageTickets}
                          title={
                            isCompleted
                              ? "Event is completed"
                              : isCancelled
                              ? "Cannot manage tickets for a cancelled event"
                              : "Manage Tickets"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canManageTickets) {
                              openTicketManager(event);
                            }
                          }}
                        >
                          <Tag size={13} />
                          Manage Tickets
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
                  type="button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft size={17} />
                </button>

                <span>
                  {page} / {pageCount}
                </span>

                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page === pageCount}
                  onClick={() => setPage((current) => current + 1)}
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
        draftToEdit={editingDraft}
        organiserId={organiserId}
        onDraftSaved={saveDraft}
        onDraftSubmitted={submitDraft}
      />

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          bookedCount={bookedCountsMap[Number(selectedEvent.id)] || 0}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => openEditModal(selectedEvent)}
          onManageTickets={() => openTicketManager(selectedEvent)}
        />
      )}

      {ticketEventId !== null && (
        <EventTicketManager
          eventId={ticketEventId}
          onClose={() => setTicketEventId(null)}
        />
      )}

      {cancel && (
        <div
          className="org-detail-backdrop"
          onClick={() => !actionLoading && setCancel(null)}
        >
          <div
            className="org-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3>Cancel Event</h3>
            <p>
              Are you sure you want to cancel <strong>{cancel.eventName}</strong>?
              Ticket holders and public viewers will no longer be able to book this event.
            </p>

            <div className="org-confirm-actions">
              <button
                type="button"
                className="org-button-secondary"
                disabled={actionLoading !== null}
                onClick={() => setCancel(null)}
              >
                Nevermind
              </button>
              <button
                type="button"
                className="org-button-danger"
                disabled={actionLoading !== null}
                onClick={confirmCancelEvent}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="org-spin" size={14} /> Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Event"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventDetailsModal({
  event,
  bookedCount = 0,
  onClose,
  onEdit,
  onManageTickets,
}: {
  event: OrganiserEvent;
  bookedCount?: number;
  onClose: () => void;
  onEdit: () => void;
  onManageTickets: () => void;
}) {
  const imageUrl = (event as any).image_url || (event as any).image;
  const instructions =
    (event as any).additional_instructions || (event as any).instructions;
  const ageGroup = (event as any).age_group || "All Ages";

  const effectiveStatus = resolveEventStatus(event);

  const isCancelled = effectiveStatus === "CANCELLED";
  const isRejected = effectiveStatus === "REJECTED";
  const isApproved = effectiveStatus === "APPROVED";
  const isCompleted = effectiveStatus === "COMPLETED";

  const canEditOrResubmit = (isApproved || isRejected) && !isCompleted;
  const canManageTickets = !isCancelled && !isCompleted;

  const totalCapacity = Number(event.capacity || (event as any).total_capacity || 0);
  const remainingSpots = Math.max(0, totalCapacity - bookedCount);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  const formatLanguages = () => {
    const raw = (event as any).languages;
    if (!raw) return "Not specified";
    if (Array.isArray(raw)) return raw.join(", ");
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch {
      // standard comma-separated text
    }
    return String(raw).replace(/[[\]"]/g, "");
  };

  const formatDuration = () => {
    const rawDur = (event as any).duration_hours ?? (event as any).duration;
    if (!rawDur) return "2 Hours";
    const num = Number(rawDur);
    return !isNaN(num)
      ? `${num} ${num === 1 ? "Hour" : "Hours"}`
      : String(rawDur);
  };

  const potentialRevenue =
    Number(event.price || 0) * Number(event.capacity || 0);

  return (
    <div
      className="org-detail-backdrop"
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
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
        onWheel={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          <div
            className="org-detail-cover"
            style={{ backgroundImage: `url(${imageUrl})` }}
          >
            <div className="org-detail-cover-overlay" />

            <button
              type="button"
              className="org-detail-cover-close-btn"
              onClick={onClose}
              aria-label="Close event details"
            >
              <X size={18} />
            </button>

            <div className="org-detail-cover-badges">
              <span className="org-detail-badge-cat">
                {event.category_name || "General"}
              </span>

              <span
                className={`org-status-badge ${effectiveStatus.toLowerCase()}`}
              >
                {effectiveStatus}
              </span>
            </div>
          </div>
        ) : (
          <header className="org-detail-header">
            <div className="org-detail-header-text">
              <div className="org-detail-meta-tags">
                <span className="org-detail-badge-cat">
                  {event.category_name || "General"}
                </span>

                <span
                  className={`org-status-badge ${effectiveStatus.toLowerCase()}`}
                >
                  {effectiveStatus}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="org-detail-close-btn"
              onClick={onClose}
              aria-label="Close event details"
            >
              <X size={18} />
            </button>
          </header>
        )}

        <div className="org-detail-content">
          <div>
            <h2 id="org-detail-title" className="org-detail-event-title">
              {event.name}
            </h2>

            <div className="org-detail-tags-strip">
              <span className="org-detail-tag-pill">
                <Globe2 size={13} /> {formatLanguages()}
              </span>

              <span className="org-detail-tag-pill">
                <UserCheck size={13} /> {ageGroup}
              </span>

              <span className="org-detail-tag-pill">
                <Clock size={13} /> {formatDuration()}
              </span>
            </div>
          </div>

          {effectiveStatus === "REJECTED" && (
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
              <span className="metric-label">Date &amp; Time</span>
              <span className="metric-value">
                {formatEventDate(event.event_date)}
              </span>
              <span className="metric-sub">
                {event.time ? formatEventTime(event.time) : "Time not set"}
              </span>
            </div>

            <div className="org-detail-metric-card">
              <span className="metric-label">Ticket Base Price</span>
              <span className="metric-value">
                ₹
                {Number(event.price || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="metric-sub">Starting price</span>
            </div>

            <div className="org-detail-metric-card">
              <span className="metric-label">Tickets Booked</span>
              <span className="metric-value">
                {bookedCount} / {totalCapacity || "—"}
              </span>
              <span className="metric-sub">
                {remainingSpots} {remainingSpots === 1 ? "spot" : "spots"} remaining
              </span>
            </div>

            <div className="org-detail-metric-card">
              <span className="metric-label metric-revenue-label">
                <TrendingUp size={12} /> Est. Revenue
              </span>
              <span className="metric-value metric-revenue-value">
                ₹{potentialRevenue.toLocaleString("en-IN")}
              </span>
              <span className="metric-sub">At 100% capacity</span>
            </div>
          </div>

          <div className="org-detail-section">
            <span className="org-detail-section-title">
              Venue &amp; Location
            </span>

            <div className="org-detail-location-card">
              <MapPin size={18} className="org-detail-location-icon" />

              <div>
                <p className="org-detail-venue">
                  {event.location || "Venue not set"}
                </p>

                <p className="org-detail-city">
                  {event.city_name || "City not specified"}
                </p>
              </div>
            </div>
          </div>

          <div className="org-detail-section">
            <span className="org-detail-section-title">Description</span>
            <p className="org-detail-description">
              {event.description?.trim() ||
                "No event description provided for this submission."}
            </p>
          </div>

          {instructions && (
            <div className="org-detail-section org-detail-instructions-box">
              <span className="org-detail-section-title org-detail-instructions-title">
                <Info size={15} className="org-detail-info-icon" />
                Instructions &amp; Venue Amenities
              </span>

              <p className="org-detail-instructions-text">{instructions}</p>
            </div>
          )}
        </div>

        <footer className="org-detail-footer">
          <div className="org-detail-footer-actions">
            {isApproved && event.slug ? (
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
                {isCompleted
                  ? "Event has concluded. Ticket sales are closed."
                  : event.status === "PENDING"
                  ? "Awaiting review by platform administrator."
                  : event.status === "REJECTED"
                    ? "Please review feedback, edit details, and re-submit."
                    : "Public ticket sales unavailable."}
              </span>
            )}
          </div>

          <div className="org-detail-footer-buttons">
            <button
              type="button"
              className="org-button-secondary org-detail-footer-btn"
              disabled={!canManageTickets}
              title={
                isCompleted
                  ? "Event has completed"
                  : isCancelled
                  ? "Cannot manage tickets for a cancelled event"
                  : "Manage Tickets"
              }
              onClick={() => {
                if (canManageTickets) {
                  onManageTickets();
                }
              }}
            >
              <Tag size={13} />
              Manage Tickets
            </button>

            <button
              type="button"
              className={`org-button-primary org-detail-footer-btn ${isRejected ? "btn-resubmit" : ""}`}
              disabled={!canEditOrResubmit}
              title={
                isCompleted
                  ? "Event is completed and cannot be edited"
                  : isRejected
                  ? "Edit details and re-submit for review"
                  : !canEditOrResubmit
                    ? `Cannot edit an event that is ${effectiveStatus.toLowerCase()}`
                    : "Edit Event"
              }
              onClick={onEdit}
            >
              <Edit size={14} />
              {isRejected ? "Edit & Re-submit" : "Edit Event"}
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