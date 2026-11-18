import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { 
  CalendarDays, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Search, 
  X, 
  IndianRupee,
  Clock,
  MapPin,
  Users,
  Languages,
  ShieldAlert,
  Globe,
  Radio,
  FileText,
  Sparkles,
  Maximize2,
  Building2,
  Calendar,
  Ticket
} from "lucide-react";
import { fetchAdminEventRequests, updateEventStatus } from "../../../services/adminService";
import "./Events.css";

export interface EventRequest {
  id: number;
  organizer_id?: number;
  city_id?: number;
  category_id?: number;
  category_name?: string | null;
  city_name?: string | null;
  organiser_stage_name?: string | null;
  organiser_user_name?: string | null;
  organiser_name?: string | null;
  name: string;
  description?: string | null;
  instructions?: string | null;
  additional_instructions?: string | null;
  location?: string | null;
  event_date?: string | null;
  date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  time?: string | null;
  price?: string | number;
  capacity?: number;
  age_group?: string | null;
  duration?: string | null;
  duration_hours?: string | null;
  languages?: string[] | string | null;
  image_url?: string | null;
  poster_url?: string | null;
  banner_image?: string | null;
  image?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  is_live?: boolean | number;
  is_active?: boolean;
  ticket_categories?: Array<{
    id: number;
    name: string;
    description?: string | null;
    price: number | string;
  }>;
}

type FilterStatus = "ALL" | EventRequest["status"];
type Decision = { event: EventRequest; status: "APPROVED" | "REJECTED" } | null;
const FILTERS: FilterStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"];
const PAGE_SIZE = 10;

const getErrorMessage = (error: unknown) => 
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || "An unexpected error occurred."
    : error instanceof Error ? error.message : "An unexpected error occurred.";

// Accurate past date check without timezone shifting
const isEventPast = (dateValue?: string | null, timeValue?: string | null): boolean => {
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

// Resolves past events into COMPLETED while preserving explicit cancellations or rejections
const resolveEventStatus = (request: EventRequest): EventRequest["status"] => {
  const rawStatus = (request.status || "").trim().toUpperCase();

  if (rawStatus === "CANCELLED") return "CANCELLED";
  if (rawStatus === "REJECTED") return "REJECTED";

  const eventDate =
    request.end_date || request.event_date || request.date || request.start_date;

  if (isEventPast(eventDate, request.time)) {
    return "COMPLETED";
  }

  if (
    rawStatus === "PENDING" ||
    rawStatus === "PENDING_APPROVAL" ||
    rawStatus === "SUBMITTED" ||
    rawStatus === "UNDER_REVIEW"
  ) {
    return "PENDING";
  }

  if (rawStatus === "APPROVED") return "APPROVED";
  if (rawStatus === "COMPLETED") return "COMPLETED";

  return "PENDING";
};

const formatDateDisplay = (dateStr?: string | null): string => {
  if (!dateStr) return "Date TBA";
  const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
  const date = new Date(clean);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatTimeDisplay = (timeStr?: string | null): string => {
  if (!timeStr) return "Time TBA";
  const raw = timeStr.trim();
  if (/[ap]m/i.test(raw)) return raw;
  if (raw.includes(":")) {
    const [h, m] = raw.split(":");
    const hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    }
  }
  return raw;
};

const parseLanguages = (langData?: string[] | string | null): string[] => {
  if (!langData) return [];
  if (Array.isArray(langData)) return langData;
  try {
    const parsed = JSON.parse(langData);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // raw comma-separated fallback
  }
  return langData.split(",").map((l) => l.trim()).filter(Boolean);
};

function Events() {
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [page, setPage] = useState(1);
  const [viewingRequest, setViewingRequest] = useState<EventRequest | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAdminEventRequests();
      setRequests(Array.isArray(response?.events) ? response.events : []);
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchAdminEventRequests()
      .then((response) => {
        if (active) setRequests(Array.isArray(response?.events) ? response.events : []);
      })
      .catch((loadError: unknown) => { 
        if (active) setError(getErrorMessage(loadError)); 
      })
      .finally(() => { 
        if (active) setLoading(false); 
      });
    return () => { active = false; };
  }, []);

  // Filter based on effective status (moving past events to COMPLETED)
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return requests.filter((request) => {
      const effectiveStatus = resolveEventStatus(request);
      const matchesStatus = filter === "ALL" || effectiveStatus === filter;
      const matchesSearch = !query || [
        request.name, 
        request.organiser_name, 
        request.organiser_stage_name,
        request.organiser_user_name,
        request.city_name, 
        request.category_name, 
        request.location
      ].some((value) => value?.toLocaleLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [requests, filter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedRequests = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirmDecision = async () => {
    if (!decision) return;
    const { event, status } = decision;
    try {
      setActionLoading(event.id);
      setError(null);
      await updateEventStatus(event.id, status);
      const updated: EventRequest = { ...event, status };
      setRequests((current) => current.map((item) => item.id === event.id ? updated : item));
      setViewingRequest((current) => current?.id === event.id ? updated : current);
      setNotice(status === "APPROVED" ? "Event approved and published." : "Event rejected.");
      setDecision(null);
      window.setTimeout(() => setNotice(""), 5000);
    } catch (actionError: unknown) {
      setError(getErrorMessage(actionError));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-event-requests">
      {/* HEADER */}
      <div className="event-requests-heading">
        <div>
          <span className="event-requests-eyebrow">CONTENT MODERATION</span>
          <h1>Event Requests</h1>
          <p>Review submitted events before they appear on CityPass.</p>
        </div>
      </div>

      {notice && (
        <div className="event-requests-notice" role="status">
          <Check size={16} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      {error && (
        <div className="event-requests-error" role="alert">
          <span>{error}</span>
          <button className="event-error-retry" onClick={() => void loadRequests()}>Retry</button>
          <button onClick={() => setError(null)} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="event-requests-toolbar-row">
        <div className="event-request-search">
          <Search size={16} />
          <input 
            value={search} 
            onChange={(event) => { setSearch(event.target.value); setPage(1); }} 
            placeholder="Search event, organiser, city..." 
            aria-label="Search event requests" 
          />
        </div>

        <div className="event-request-tabs" role="tablist" aria-label="Filter event requests">
          {FILTERS.map((status) => {
            const count =
              status === "ALL"
                ? requests.length
                : requests.filter((r) => resolveEventStatus(r) === status).length;

            return (
              <button 
                key={status} 
                role="tab" 
                aria-selected={filter === status} 
                className={`tab-btn ${filter === status ? "active" : ""}`} 
                onClick={() => { setFilter(status); setPage(1); }}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="event-requests-count">
          {filtered.length} {filtered.length === 1 ? "Request" : "Requests"}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="event-requests-state">
          <p>Loading event requests...</p>
        </div>
      ) : pagedRequests.length === 0 ? (
        <div className="event-requests-state">
          <CalendarDays size={32} />
          <strong>{requests.length ? "No matching event requests" : "No event requests yet"}</strong>
          <span>{requests.length ? "Try another status or search term." : "New organiser submissions will appear here for review."}</span>
        </div>
      ) : (
        <div className="event-table-container">
          <table className="event-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Organiser</th>
                <th>Category</th>
                <th>City</th>
                <th>Location</th>
                <th>Price</th>
                <th>Status</th>
                <th className="event-col-actions-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRequests.map((request) => {
                const effectiveStatus = resolveEventStatus(request);
                const statusClass = effectiveStatus.toLowerCase();
                const displayOrganiser = 
                  request.organiser_stage_name || 
                  request.organiser_name || 
                  request.organiser_user_name || 
                  `Organiser #${request.organizer_id || "—"}`;

                return (
                  <tr key={request.id}>
                    <td className="event-col-id">#{request.id}</td>
                    <td className="event-col-name">
                      <span className="event-name-text" title={request.name}>{request.name}</span>
                    </td>
                    <td className="event-col-organiser">
                      <span title={displayOrganiser}>
                        {displayOrganiser}
                      </span>
                    </td>
                    <td>
                      <span className="event-cat-badge">
                        {request.category_name || "Uncategorised"}
                      </span>
                    </td>
                    <td className="event-col-city">{request.city_name || "—"}</td>
                    <td className="event-col-location" title={request.location || "Location not provided"}>
                      {request.location || "Location not provided"}
                    </td>
                    <td>
                      <span className="event-price-val">
                        <IndianRupee size={12} />
                        {Number(request.price || 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${statusClass}`}>
                        {effectiveStatus}
                      </span>
                    </td>
                    <td className="event-col-actions">
                      <div className="event-table-actions">
                        <button 
                          type="button"
                          className="btn-view" 
                          onClick={() => setViewingRequest(request)}
                        >
                          <Eye size={13} /> View
                        </button>
                        {effectiveStatus === "PENDING" && (
                          <>
                            <button 
                              type="button"
                              className="btn-approve" 
                              disabled={actionLoading === request.id} 
                              onClick={() => setDecision({ event: request, status: "APPROVED" })}
                            >
                              <Check size={13} /> {actionLoading === request.id ? "..." : "Approve"}
                            </button>
                            <button 
                              type="button"
                              className="btn-reject" 
                              disabled={actionLoading === request.id} 
                              onClick={() => setDecision({ event: request, status: "REJECTED" })}
                            >
                              <X size={13} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length > PAGE_SIZE && (
            <footer className="event-request-pagination">
              <span>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="pagination-controls">
                <button 
                  aria-label="Previous page" 
                  disabled={page === 1} 
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span>{page} / {pageCount}</span>
                <button 
                  aria-label="Next page" 
                  disabled={page === pageCount} 
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </footer>
          )}
        </div>
      )}

      {/* MODERN REDESIGNED EVENT DETAILS MODAL */}
      {viewingRequest && (
        <div 
          className="modal-backdrop" 
          onMouseDown={(click) => { if (click.target === click.currentTarget) setViewingRequest(null); }}
        >
          <section 
            className="modal-card event-modal-card-modern" 
            role="dialog" 
            aria-modal="true"
          >
            {/* HERO BANNER */}
            {(() => {
              const imgSource = viewingRequest.image_url || viewingRequest.poster_url || viewingRequest.image || viewingRequest.banner_image;
              const displayOrganiser = viewingRequest.organiser_stage_name || viewingRequest.organiser_name || viewingRequest.organiser_user_name || "Organiser";
              const modalStatus = resolveEventStatus(viewingRequest);
              
              return (
                <div className="ev-hero-banner">
                  {imgSource ? (
                    <img src={imgSource} alt={viewingRequest.name} className="ev-hero-bg" />
                  ) : (
                    <div className="ev-hero-bg-fallback" />
                  )}
                  <div className="ev-hero-gradient" />

                  <button 
                    className="ev-modal-close" 
                    onClick={() => setViewingRequest(null)}
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>

                  <div className="ev-hero-content">
                    <div 
                      className="ev-hero-poster-box" 
                      onClick={() => imgSource && setPreviewImage(imgSource)}
                      title="Click to view full image"
                    >
                      {imgSource ? (
                        <>
                          <img src={imgSource} alt={viewingRequest.name} className="ev-hero-poster-img" />
                          <div className="ev-poster-zoom"><Maximize2 size={13} /> View</div>
                        </>
                      ) : (
                        <div className="ev-poster-none"><Sparkles size={24} /></div>
                      )}
                    </div>

                    <div className="ev-hero-meta">
                      <div className="ev-hero-pill-strip">
                        <span className="ev-cat-pill">{viewingRequest.category_name || "Event"}</span>
                        <span className={`status-pill status-${modalStatus.toLowerCase()}`}>
                          {modalStatus}
                        </span>
                        {Boolean(viewingRequest.is_live) && modalStatus !== "COMPLETED" && (
                          <span className="ev-live-pill"><Radio size={12} /> LIVE</span>
                        )}
                      </div>

                      <h2 className="ev-hero-title">{viewingRequest.name}</h2>

                      <div className="ev-hero-substrip">
                        <span className="ev-sub-item">
                          <Building2 size={14} /> {displayOrganiser}
                        </span>
                        <span className="ev-sub-dot">•</span>
                        <span className="ev-sub-item">
                          <Calendar size={14} /> {formatDateDisplay(viewingRequest.event_date)}
                        </span>
                        <span className="ev-sub-dot">•</span>
                        <span className="ev-sub-item">
                          <Clock size={14} /> {formatTimeDisplay(viewingRequest.time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SCROLLABLE BODY */}
            <div className="ev-body-content">
              {/* PRIMARY METRICS GRID */}
              <div className="ev-metrics-grid">
                <div className="ev-metric-card">
                  <div className="ev-metric-icon emerald"><IndianRupee size={16} /></div>
                  <div className="ev-metric-details">
                    <span className="ev-metric-label">Starting Price</span>
                    <strong className="ev-metric-value price">
                      ₹{Number(viewingRequest.price || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                <div className="ev-metric-card">
                  <div className="ev-metric-icon purple"><Users size={16} /></div>
                  <div className="ev-metric-details">
                    <span className="ev-metric-label">Capacity</span>
                    <strong className="ev-metric-value">
                      {viewingRequest.capacity ? `${viewingRequest.capacity.toLocaleString()} Seats` : "Open Limit"}
                    </strong>
                  </div>
                </div>

                <div className="ev-metric-card">
                  <div className="ev-metric-icon indigo"><Clock size={16} /></div>
                  <div className="ev-metric-details">
                    <span className="ev-metric-label">Duration</span>
                    <strong className="ev-metric-value">
                      {viewingRequest.duration_hours ? `${viewingRequest.duration_hours} Hours` : "2 Hours (Est.)"}
                    </strong>
                  </div>
                </div>

                <div className="ev-metric-card">
                  <div className="ev-metric-icon amber"><ShieldAlert size={16} /></div>
                  <div className="ev-metric-details">
                    <span className="ev-metric-label">Age Limit</span>
                    <strong className="ev-metric-value">{viewingRequest.age_group || "All Ages"}</strong>
                  </div>
                </div>

                <div className="ev-metric-card">
                  <div className="ev-metric-icon blue"><Globe size={16} /></div>
                  <div className="ev-metric-details">
                    <span className="ev-metric-label">City</span>
                    <strong className="ev-metric-value">{viewingRequest.city_name || "All Cities"}</strong>
                  </div>
                </div>

                <div className="ev-metric-card">
                  <div className="ev-metric-icon slate"><Languages size={16} /></div>
                  <div className="ev-metric-details">
                    <span className="ev-metric-label">Languages</span>
                    <div className="ev-tag-row">
                      {parseLanguages(viewingRequest.languages).length > 0 ? (
                        parseLanguages(viewingRequest.languages).map((l) => (
                          <span key={l} className="ev-lang-tag">{l}</span>
                        ))
                      ) : (
                        <span className="ev-lang-tag">English</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* LOCATION TILE */}
              <div className="ev-info-card">
                <div className="ev-card-header">
                  <div className="ev-card-icon"><MapPin size={16} /></div>
                  <h4>Venue & Location</h4>
                </div>
                <p className="ev-card-body">{viewingRequest.location || "Venue TBA"}</p>
              </div>

              {/* DESCRIPTION */}
              <div className="ev-info-card">
                <div className="ev-card-header">
                  <div className="ev-card-icon"><FileText size={16} /></div>
                  <h4>About the Event</h4>
                </div>
                <div className="ev-card-body whitespace">
                  {viewingRequest.description || "No description provided for this event."}
                </div>
              </div>

              {/* TICKET CATEGORIES */}
              <div className="ev-info-card">
                <div className="ev-card-header">
                  <div className="ev-card-icon"><Ticket size={16} /></div>
                  <h4>Ticket Categories</h4>
                </div>
                {viewingRequest.ticket_categories?.length ? (
                  <div className="ev-ticket-grid">
                    {viewingRequest.ticket_categories.map((ticket) => (
                      <div className="ev-ticket-card" key={ticket.id}>
                        <div>
                          <strong>{ticket.name}</strong>
                          {ticket.description && <p>{ticket.description}</p>}
                        </div>
                        <span>₹{Number(ticket.price || 0).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="ev-card-body">No ticket categories submitted.</p>
                )}
              </div>

              {/* INSTRUCTIONS / AMENITIES */}
              {(viewingRequest.additional_instructions || viewingRequest.instructions) && (
                <div className="ev-info-card highlight">
                  <div className="ev-card-header">
                    <div className="ev-card-icon warning"><ShieldAlert size={16} /></div>
                    <h4>Instructions & Amenities</h4>
                  </div>
                  <div className="ev-card-body whitespace">
                    {viewingRequest.additional_instructions || viewingRequest.instructions}
                  </div>
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="modal-footer">
              {resolveEventStatus(viewingRequest) === "PENDING" && (
                <div className="modal-pending-actions">
                  <button 
                    type="button" 
                    className="btn-reject"
                    onClick={() => {
                      const req = viewingRequest;
                      setViewingRequest(null);
                      setDecision({ event: req, status: "REJECTED" });
                    }}
                  >
                    <X size={14} /> Reject Event
                  </button>
                  <button 
                    type="button" 
                    className="btn-approve"
                    onClick={() => {
                      const req = viewingRequest;
                      setViewingRequest(null);
                      setDecision({ event: req, status: "APPROVED" });
                    }}
                  >
                    <Check size={14} /> Approve & Publish
                  </button>
                </div>
              )}
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setViewingRequest(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      {/* FULL-SCREEN IMAGE LIGHTBOX PREVIEW */}
      {previewImage && (
        <div 
          className="modal-backdrop"
          onClick={() => setPreviewImage(null)}
          style={{ 
            zIndex: 9999, 
            backgroundColor: "rgba(0, 0, 0, 0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: "relative", 
              maxWidth: "90vw", 
              maxHeight: "90vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              aria-label="Close image preview"
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <X size={20} />
            </button>
            <img 
              src={previewImage} 
              alt="Expanded preview" 
              style={{ 
                maxWidth: "100%", 
                maxHeight: "85vh", 
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
              }}
            />
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {decision && (
        <div 
          className="modal-backdrop" 
          onMouseDown={(click) => { if (click.target === click.currentTarget && !actionLoading) setDecision(null); }}
        >
          <section className="modal-card event-confirm-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3>{decision.status === "APPROVED" ? "Approve Event" : "Reject Event"}</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setDecision(null)}
                disabled={actionLoading !== null}
              >
                <X size={16} />
              </button>
            </div>

            <p className="modal-subtitle">
              Are you sure you want to mark <strong>{decision.event.name}</strong> as{" "}
              <span className={`status-pill status-${decision.status.toLowerCase()}`}>{decision.status}</span>?{" "}
              {decision.status === "APPROVED" 
                ? "This event will immediately appear on CityPass for users to book." 
                : "The organiser will see that their event request was rejected."}
            </p>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-cancel" 
                disabled={actionLoading !== null} 
                onClick={() => setDecision(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={decision.status === "APPROVED" ? "btn-approve" : "btn-confirm-reject"} 
                disabled={actionLoading !== null} 
                onClick={() => void confirmDecision()}
              >
                {actionLoading !== null ? "Updating..." : `Confirm ${decision.status === "APPROVED" ? "Approval" : "Rejection"}`}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Events;