import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Eye, Loader2, MapPin, Search, X } from "lucide-react";
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

const getErrorMessage = (error: unknown) => axios.isAxiosError<{ message?: string }>(error)
  ? error.response?.data?.message || "An unexpected error occurred."
  : error instanceof Error ? error.message : "An unexpected error occurred.";

const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
  day: "numeric", month: "short", year: "numeric",
});

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
      .catch((loadError: unknown) => { if (active) setError(getErrorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const pendingCount = requests.filter((request) => request.status === "PENDING").length;
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return requests.filter((request) => {
      const matchesStatus = filter === "ALL" || request.status === filter;
      const matchesSearch = !query || [request.name, request.organiser_name, request.city_name, request.category_name, request.location]
        .some((value) => value?.toLocaleLowerCase().includes(query));
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
      <header className="event-requests-heading">
        <div><span className="event-requests-eyebrow">CONTENT MODERATION</span><h1>Event Requests</h1><p>Review submitted events before they appear on CityPass.</p></div>
        <div className="event-requests-pending"><span>{pendingCount}</span><small>Pending review</small></div>
      </header>

      {notice && <div className="event-requests-notice" role="status"><Check size={16} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}
      {error && <div className="event-requests-error" role="alert"><span>{error}</span><button className="event-error-retry" onClick={() => void loadRequests()}>Retry</button><button onClick={() => setError(null)} aria-label="Dismiss"><X size={15} /></button></div>}

      <section className="event-requests-panel">
        <div className="event-requests-toolbar">
          <div className="event-request-tabs" role="tablist" aria-label="Filter event requests">
            {FILTERS.map((status) => <button key={status} role="tab" aria-selected={filter === status} className={filter === status ? "active" : ""} onClick={() => { setFilter(status); setPage(1); }}>
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              <span>{status === "ALL" ? requests.length : requests.filter((request) => request.status === status).length}</span>
            </button>)}
          </div>
          <label className="event-request-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search event, organiser, city..." aria-label="Search event requests" /></label>
        </div>

        {loading ? <div className="event-requests-state"><Loader2 className="event-requests-spin" size={24} /><span>Loading event requests...</span></div>
          : pagedRequests.length === 0 ? <div className="event-requests-state event-requests-empty"><CalendarDays size={31} /><strong>{requests.length ? "No matching event requests" : "No event requests yet"}</strong><span>{requests.length ? "Try another status or search term." : "New organiser submissions will appear here for review."}</span></div>
            : <div className="event-request-list">{pagedRequests.map((request) => <article className="event-request-row" key={request.id}>
              <div className="event-request-main">
                <div className="event-request-title-line"><h2>{request.name}</h2><span className={`event-request-status ${request.status.toLowerCase()}`}>{request.status}</span></div>
                <div className="event-request-meta"><span><CalendarDays size={14} />{formatDate(request.event_date)} · {request.time}</span><span><MapPin size={14} />{request.location || "Location not specified"}, {request.city_name || "City not specified"}</span></div>
                <div className="event-request-tags"><span>{request.category_name || "Uncategorised"}</span><span>By {request.organiser_name || `Organiser #${request.organizer_id}`}</span><span>₹{Number(request.price).toLocaleString("en-IN")}</span><span>Capacity {request.capacity}</span></div>
              </div>
              <div className="event-request-actions">
                <button className="event-request-view" onClick={() => setViewingRequest(request)}><Eye size={15} /> Details</button>
                {request.status === "PENDING" && <>
                  <button className="event-request-reject" disabled={actionLoading === request.id} onClick={() => setDecision({ event: request, status: "REJECTED" })}><X size={15} /> Reject</button>
                  <button className="event-request-approve" disabled={actionLoading === request.id} onClick={() => setDecision({ event: request, status: "APPROVED" })}><Check size={15} /> Approve</button>
                </>}
              </div>
            </article>)}</div>}

        {!loading && filtered.length > PAGE_SIZE && <footer className="event-request-pagination"><span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span><div><button aria-label="Previous page" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={17} /></button><span>{page} / {pageCount}</span><button aria-label="Next page" disabled={page === pageCount} onClick={() => setPage(page + 1)}><ChevronRight size={17} /></button></div></footer>}
      </section>

      {viewingRequest && <div className="event-request-backdrop" onMouseDown={(click) => { if (click.target === click.currentTarget) setViewingRequest(null); }}>
        <section className="event-request-modal" role="dialog" aria-modal="true" aria-labelledby="event-request-detail-title">
          <header><div><span className="event-requests-eyebrow">SUBMISSION DETAILS</span><h2 id="event-request-detail-title">{viewingRequest.name}</h2></div><button onClick={() => setViewingRequest(null)} aria-label="Close details"><X size={18} /></button></header>
          <div className="event-request-detail-content">
            <div className="event-request-detail-status"><span className={`event-request-status ${viewingRequest.status.toLowerCase()}`}>{viewingRequest.status}</span><span>Submitted by {viewingRequest.organiser_name || `Organiser #${viewingRequest.organizer_id}`}</span></div>
            <p className="event-request-description">{viewingRequest.description || "No description provided."}</p>
            <dl className="event-request-detail-grid">
              <div><dt>Date</dt><dd>{formatDate(viewingRequest.event_date)} · {viewingRequest.time}</dd></div><div><dt>Location</dt><dd>{viewingRequest.location || "Not specified"}</dd></div>
              <div><dt>City</dt><dd>{viewingRequest.city_name || "Not specified"}</dd></div><div><dt>Category</dt><dd>{viewingRequest.category_name || "Not specified"}</dd></div>
              <div><dt>Ticket price</dt><dd>₹{Number(viewingRequest.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</dd></div><div><dt>Capacity</dt><dd>{viewingRequest.capacity}</dd></div>
            </dl>
            {viewingRequest.status === "PENDING" && <div className="event-request-detail-actions"><button className="event-request-reject" onClick={() => { setViewingRequest(null); setDecision({ event: viewingRequest, status: "REJECTED" }); }}><X size={15} /> Reject</button><button className="event-request-approve" onClick={() => { setViewingRequest(null); setDecision({ event: viewingRequest, status: "APPROVED" }); }}><Check size={15} /> Approve</button></div>}
          </div>
        </section>
      </div>}

      {decision && <div className="event-request-backdrop" onMouseDown={(click) => { if (click.target === click.currentTarget && !actionLoading) setDecision(null); }}>
        <section className="event-request-confirm" role="dialog" aria-modal="true" aria-labelledby="event-request-confirm-title">
          <span className={`event-confirm-icon ${decision.status.toLowerCase()}`}>{decision.status === "APPROVED" ? <Check size={20} /> : <X size={20} />}</span>
          <h2 id="event-request-confirm-title">{decision.status === "APPROVED" ? "Approve this event?" : "Reject this event?"}</h2>
          <p><strong>{decision.event.name}</strong> will be marked {decision.status.toLowerCase()}. {decision.status === "APPROVED" ? "It will become visible to CityPass users." : "The organiser will see the rejected status."}</p>
          <p className="event-confirm-api-note">The current status API does not save a rejection reason.</p>
          <div><button className="event-request-view" disabled={actionLoading !== null} onClick={() => setDecision(null)}>Cancel</button><button className={decision.status === "APPROVED" ? "event-request-approve" : "event-request-reject"} disabled={actionLoading !== null} onClick={() => void confirmDecision()}>{actionLoading !== null ? "Updating..." : `Confirm ${decision.status === "APPROVED" ? "approval" : "rejection"}`}</button></div>
        </section>
      </div>}
    </div>
  );
}

export default Events;