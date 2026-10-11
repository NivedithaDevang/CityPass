import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { 
  CalendarDays, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  MapPin, 
  Search, 
  X,
  IndianRupee 
} from "lucide-react";
import { fetchAdminEventRequests, updateEventStatus } from "../../../services/adminService";
import "./Events.css";

interface EventRequest {
  id: number;
  organizer_id: number;
  organiser_name: string | null;
  name: string;
  description: string | null;
  location: string | null;
  event_date: string;
  time: string;
  city_name: string | null;
  category_name: string | null;
  price: number;
  capacity: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
}

type FilterStatus = "ALL" | EventRequest["status"];
type Decision = { event: EventRequest; status: "APPROVED" | "REJECTED" } | null;
const FILTERS: FilterStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"];
const PAGE_SIZE = 10;

const getErrorMessage = (error: unknown) => 
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || "An unexpected error occurred."
    : error instanceof Error ? error.message : "An unexpected error occurred.";

const formatDate = (date: string) => {
  if (!date) return "TBA";
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric", 
      month: "short", 
      year: "numeric",
    });
  } catch {
    return date;
  }
};

function Events() {
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [page, setPage] = useState(1);
  const [viewingRequest, setViewingRequest] = useState<EventRequest | null>(null);
  const [decision, setDecision] = useState<Decision>(null);

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

  const pendingCount = requests.filter((request) => request.status === "PENDING").length;

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return requests.filter((request) => {
      const matchesStatus = filter === "ALL" || request.status === filter;
      const matchesSearch = !query || [
        request.name, 
        request.organiser_name, 
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
      const updated = { ...event, status };
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
      {/* HEADER ROW */}
      <div className="event-requests-heading">
        <div>
          <span className="event-requests-eyebrow">CONTENT MODERATION</span>
          <h1>Event Requests</h1>
          <p>Review submitted events before they appear on CityPass.</p>
        </div>

        <div className="event-requests-pending">
          <span>{pendingCount}</span>
          <small>Pending review</small>
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
          {FILTERS.map((status) => (
            <button 
              key={status} 
              role="tab" 
              aria-selected={filter === status} 
              className={`tab-btn ${filter === status ? "active" : ""}`} 
              onClick={() => { setFilter(status); setPage(1); }}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              <span className="tab-count">
                {status === "ALL" ? requests.length : requests.filter((r) => r.status === status).length}
              </span>
            </button>
          ))}
        </div>

        <div className="event-requests-count">
          {filtered.length} {filtered.length === 1 ? "Request" : "Requests"}
        </div>
      </div>

      {/* TABLE SECTION */}
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
                const statusClass = request.status.toLowerCase();

                return (
                  <tr key={request.id}>
                    <td className="event-col-id">#{request.id}</td>
                    <td className="event-col-name">
                      <span className="event-name-text" title={request.name}>{request.name}</span>
                    </td>
                    <td className="event-col-organiser">
                      <span title={request.organiser_name || `Organiser #${request.organizer_id}`}>
                        {request.organiser_name || `Organiser #${request.organizer_id}`}
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
                        {Number(request.price).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${statusClass}`}>
                        {request.status}
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
                        {request.status === "PENDING" && (
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

      {/* DETAILS MODAL */}
      {viewingRequest && (
        <div 
          className="modal-backdrop" 
          onMouseDown={(click) => { if (click.target === click.currentTarget) setViewingRequest(null); }}
        >
          <section className="modal-card event-modal-card" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="modal-title-row">
                  <h3>{viewingRequest.name}</h3>
                  <span className={`status-pill status-${viewingRequest.status.toLowerCase()}`}>
                    {viewingRequest.status}
                  </span>
                </div>
                <span className="modal-subtext">Event ID: #{viewingRequest.id}</span>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setViewingRequest(null)} 
                aria-label="Close details"
              >
                <X size={16} />
              </button>
            </div>

            <div className="event-details-body">
              <div className="event-meta-grid">
                <div className="meta-tile">
                  <span className="meta-tile-label">Category</span>
                  <span className="meta-tile-value cat-tag">{viewingRequest.category_name || "Uncategorised"}</span>
                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">City</span>
                  <span className="meta-tile-value">{viewingRequest.city_name || "Not specified"}</span>

                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">Ticket Price</span>
                  <span className="meta-tile-value price-highlight">
                    ₹{Number(viewingRequest.price).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">Organiser</span>
                  <span className="meta-tile-value">{viewingRequest.organiser_name || `Organiser #${viewingRequest.organizer_id}`}</span>
                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">Capacity</span>
                  <span className="meta-tile-value">{viewingRequest.capacity} Attendees</span>
                </div>
                <div className="meta-tile full-width">
                  <span className="meta-tile-label">Venue Location</span>
                  <span className="meta-tile-value">{viewingRequest.location || "Location not specified"}</span>
                </div>
              </div>

              <div className="event-desc-section">
                <span className="meta-tile-label">Event Description</span>
                <div className="event-desc-box">
                  {viewingRequest.description ? (
                    <p>{viewingRequest.description}</p>
                  ) : (
                    <p className="desc-empty">No description provided for this event.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {viewingRequest.status === "PENDING" && (
                <div className="modal-pending-actions">
                  <button 
                    type="button"
                    className="btn-reject" 
                    onClick={() => { setViewingRequest(null); setDecision({ event: viewingRequest, status: "REJECTED" }); }}
                  >
                    <X size={13} /> Reject
                  </button>
                  <button 
                    type="button"
                    className="btn-approve" 
                    onClick={() => { setViewingRequest(null); setDecision({ event: viewingRequest, status: "APPROVED" }); }}
                  >
                    <Check size={13} /> Approve
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

      {/* CONFIRMATION DIALOG MODAL */}
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