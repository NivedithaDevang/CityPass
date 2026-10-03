import { useEffect, useState, useMemo } from "react";
import "./OrganiserRequests.css";
import { 
  fetchAdminOrganiserRequests, 
  updateOrganizerStatus 
} from "../../../services/adminService";
import { 
  FaBuilding, 
  FaLocationDot, 
  FaCheck, 
  FaXmark, 
  FaTag, 
  FaEye 
} from "react-icons/fa6";
import { MdOutlineSearch } from "react-icons/md";

interface OrganiserRequest {
  id: number;
  organization_name: string;
  description: string;
  status: string;
  category?: string;
  city?: string;
  pan_card?: string;
  email?: string;
  phone?: string;
}

const REJECTION_REASONS = [
  "Incomplete or misleading information",
  "Invalid identification / PAN card",
  "Duplicate or fraudulent request",
  "Violates platform terms and conditions",
  "Other"
];

function OrganiserRequests() {
  const [requests, setRequests] = useState<OrganiserRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Detail Modal State
  const [viewingRequest, setViewingRequest] = useState<OrganiserRequest | null>(null);

  // Rejection Modal State
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminOrganiserRequests();
      const list = Array.isArray(res) ? res : res?.requests || res?.data || [];
      setRequests(list);
    } catch (err: any) {
      setError("Failed to load organizer requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusUpdate = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(id);
      await updateOrganizerStatus(id, status);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      closeRejectModal();
      if (viewingRequest?.id === id) {
        setViewingRequest((prev) => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      setError(`Failed to set status to ${status}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id: number) => {
    setRejectingId(id);
    setSelectedReason(REJECTION_REASONS[0]);
    setCustomReason("");
  };

  const closeRejectModal = () => {
    setRejectingId(null);
    setSelectedReason(REJECTION_REASONS[0]);
    setCustomReason("");
  };

  const confirmRejection = () => {
    if (!rejectingId) return;
    handleStatusUpdate(rejectingId, "REJECTED");
  };

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const orgName = (r.organization_name || "").toLowerCase();
      const city = (r.city || "").toLowerCase();
      const category = (r.category || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const pan = (r.pan_card || "").toLowerCase();
      const query = search.trim().toLowerCase();

      const matchSearch =
        !query ||
        orgName.includes(query) ||
        city.includes(query) ||
        category.includes(query) ||
        email.includes(query) ||
        pan.includes(query);

      const itemStatus = (r.status || "").trim().toUpperCase();
      const matchFilter = filter === "ALL" || itemStatus === filter;

      return matchSearch && matchFilter;
    });
  }, [requests, search, filter]);

  return (
    <div className="req-container">
      <div className="req-header-row">
        <div>          
          <span className="req-subhead">REVIEW APPLICATIONS</span>
          <h1>Organiser Requests</h1>
        </div>

        <div className="req-toolbar">
          <div className="req-search">
            <MdOutlineSearch />
            <input
              type="text"
              placeholder="Search org, city, email, PAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="req-tabs">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${filter === tab ? "active" : ""}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="req-error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="req-placeholder">Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="req-placeholder">No matching requests found.</div>
      ) : (
        <div className="req-list-grid">
          {filtered.map((req) => {
            const statusUpper = (req.status || "PENDING").trim().toUpperCase();

            return (
              <article key={req.id} className="req-item-card">
                <div className="req-item-top">
                  <div className="req-org-meta">
                    <div className="req-icon-box">
                      <FaBuilding />
                    </div>
                    <div>
                      <h3>{req.organization_name || "Unnamed Organization"}</h3>
                      <div className="req-tags">
                        {req.category && (
                          <span><FaTag /> {req.category}</span>
                        )}
                        <span><FaLocationDot /> {req.city || "All Cities"}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`status-pill status-${statusUpper.toLowerCase()}`}>
                    {statusUpper}
                  </span>
                </div>

                <p className="req-desc">
                  {req.description || "No description provided."}
                </p>

                <div className="req-card-actions">
                  <button 
                    type="button"
                    className="btn-view"
                    onClick={() => setViewingRequest(req)}
                  >
                    <FaEye /> Details
                  </button>

                  {statusUpper === "PENDING" && (
                    <div className="action-buttons">
                      <button
                        className="btn-reject"
                        disabled={actionLoading === req.id}
                        onClick={() => openRejectModal(req.id)}
                      >
                        <FaXmark /> Reject
                      </button>
                      <button
                        className="btn-approve"
                        disabled={actionLoading === req.id}
                        onClick={() => handleStatusUpdate(req.id, "APPROVED")}
                      >
                        <FaCheck /> {actionLoading === req.id ? "Approving..." : "Approve"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {viewingRequest && (
        <div className="modal-backdrop" onClick={() => setViewingRequest(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewingRequest.organization_name}</h3>
              <button className="modal-close-btn" onClick={() => setViewingRequest(null)}>
                <FaXmark />
              </button>
            </div>

            <div className="details-grid">
              <div>
                <strong>Status:</strong>{" "}
                <span className={`status-pill status-${viewingRequest.status.toLowerCase()}`}>
                  {viewingRequest.status}
                </span>
              </div>
              <div><strong>Category:</strong> {viewingRequest.category || "N/A"}</div>
              <div><strong>City:</strong> {viewingRequest.city || "N/A"}</div>
              <div><strong>PAN Card:</strong> {viewingRequest.pan_card || "N/A"}</div>
              <div><strong>Email:</strong> {viewingRequest.email || "N/A"}</div>
              <div><strong>Phone:</strong> {viewingRequest.phone || "N/A"}</div>
            </div>

            <div className="details-desc-box">
              <strong>Description:</strong>
              <p>{viewingRequest.description}</p>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setViewingRequest(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectingId !== null && (
        <div className="modal-backdrop" onClick={closeRejectModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Application</h3>
              <button className="modal-close-btn" onClick={closeRejectModal}>
                <FaXmark />
              </button>
            </div>

            <p className="modal-subtitle">
              Select or provide a reason for rejecting this organizer request:
            </p>

            <div className="reason-options">
              {REJECTION_REASONS.map((reason) => (
                <label key={reason} className="radio-label">
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {selectedReason === "Other" && (
              <textarea
                className="custom-reason-input"
                placeholder="Type specific reason here..."
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={closeRejectModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-reject"
                disabled={actionLoading === rejectingId}
                onClick={confirmRejection}
              >
                {actionLoading === rejectingId ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganiserRequests;