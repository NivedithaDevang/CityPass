import { useEffect, useState, useMemo } from "react";
import "./OrganiserRequests.css";
import { 
  fetchAdminOrganiserRequests, 
  updateOrganizerStatus 
} from "../../../services/adminService";
import { 
  FaCheck, 
  FaXmark, 
  FaEye,
  FaArrowUpRightFromSquare,
  FaFileLines
} from "react-icons/fa6";
import { MdOutlineSearch } from "react-icons/md";
import { API_BASE_URL } from "../../../config/config";

interface OrganiserRequest {
  name: string | undefined;
  id: number;
  organization_name: string;
  description: string;
  status: string;
  category?: string;
  city?: string;
  id_proof_type?: string;
  id_proof?: string;
  id_proof_url?: string;
  id_proof_file?: string;
  email?: string;
  phone?: string;
}

const REJECTION_REASONS = [
  "Incomplete or misleading information",
  "Invalid identification / ID document",
  "Duplicate or fraudulent request",
  "Violates platform terms and conditions",
  "Other"
];

function OrganiserRequests() {
  const [requests, setRequests] = useState<OrganiserRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Detail Modal State
  const [viewingRequest, setViewingRequest] = useState<OrganiserRequest | null>(null);

  // Approval Modal State
  const [approvingRequest, setApprovingRequest] = useState<OrganiserRequest | null>(null);

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

  const handleStatusUpdate = async (
    id: number, 
    status: "APPROVED" | "REJECTED", 
    reason?: string
  ) => {
    try {
      setActionLoading(id);
      await updateOrganizerStatus(id, status, reason);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      closeRejectModal();
      setApprovingRequest(null);
      if (viewingRequest?.id === id) {
        setViewingRequest((prev) => (prev ? { ...prev, status } : null));
      }
      setNotice(
        status === "APPROVED"
          ? "Organizer request approved successfully."
          : "Organizer request rejected."
      );
      window.setTimeout(() => setNotice(""), 5000);
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

    const finalReason =
      selectedReason === "Other" ? customReason.trim() : selectedReason;

    if (selectedReason === "Other" && !finalReason) {
      setError("Please specify a rejection reason.");
      return;
    }

    handleStatusUpdate(rejectingId, "REJECTED", finalReason);
  };

  const confirmApproval = () => {
    if (!approvingRequest) return;
    handleStatusUpdate(approvingRequest.id, "APPROVED");
  };

  // Helper to resolve the attached document URL (Cloudinary https URL or server path)
  const getDocumentUrl = (req?: OrganiserRequest | null): string => {
    if (!req) return "";
    const rawUrl = req.id_proof_url || req.id_proof_file;
    if (!rawUrl) return "";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }
    return `${API_BASE_URL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
  };

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const orgName = (r.organization_name || "").toLowerCase();
      const city = (r.city || "").toLowerCase();
      const category = (r.category || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const id_proof = (r.id_proof || "").toLowerCase();
      const query = search.trim().toLowerCase();

      const matchSearch =
        !query ||
        orgName.includes(query) ||
        city.includes(query) ||
        category.includes(query) ||
        email.includes(query) ||
        id_proof.includes(query);

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
          <p className="req-header-desc">Review and manage organizer verification applications.</p>
        </div>

        <div className="req-toolbar">
          <div className="req-search">
            <MdOutlineSearch />
            <input
              type="text"
              placeholder="Search org, city, email, ID..."
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

          <div className="req-count">
            {filtered.length} {filtered.length === 1 ? "Request" : "Requests"}
          </div>
        </div>
      </div>

      {notice && (
        <div className="req-notice-banner">
          <span>{notice}</span>
          <button 
            className="req-close-button"
            onClick={() => setNotice("")}
          >
            <FaXmark />
          </button>
        </div>
      )}

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
        <div className="req-table-container">
          <table className="req-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Organization</th>
                <th>City</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const statusUpper = (req.status || "PENDING").trim().toUpperCase();

                return (
                  <tr key={req.id}>
                    <td>{req.id}</td>
                    <td className="req-col-org">
                      <span className="req-org-title">{req.organization_name || "—"}</span>
                    </td>
                    <td>{req.city || "—"}</td>
                    <td>
                      <span className={`status-pill status-${statusUpper.toLowerCase()}`}>
                        {statusUpper}
                      </span>
                    </td>
                    <td>
                      <div className="req-table-actions">
                        <button 
                          type="button"
                          className="btn-view"
                          onClick={() => setViewingRequest(req)}
                        >
                          <FaEye /> View
                        </button>

                        {statusUpper === "PENDING" && (
                          <>
                            <button
                              type="button"
                              className="btn-approve"
                              disabled={actionLoading === req.id}
                              onClick={() => setApprovingRequest(req)}
                            >
                              <FaCheck /> {actionLoading === req.id ? "..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              className="btn-reject"
                              disabled={actionLoading === req.id}
                              onClick={() => openRejectModal(req.id)}
                            >
                              <FaXmark /> Reject
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
        </div>
      )}

      {/* Details Modal */}
      {viewingRequest && (
        <div className="modal-backdrop" onClick={() => setViewingRequest(null)}>
          <div className="modal-card admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="modal-title-row">
                  <h3>{viewingRequest.organization_name}</h3>
                  <span className={`status-pill status-${viewingRequest.status.toLowerCase()}`}>
                    {viewingRequest.status}
                  </span>
                </div>
                <span className="modal-subtext">Application ID: #{viewingRequest.id}</span>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setViewingRequest(null)}
                aria-label="Close modal"
              >
                <FaXmark />
              </button>
            </div>

            <div className="admin-details-body">
              <div className="admin-meta-grid">
                <div className="meta-tile">
                  <span className="meta-tile-label">Full Name</span>
                  <span className="meta-tile-value">{viewingRequest.name || viewingRequest.email}</span>
                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">City</span>
                  <span className="meta-tile-value">{viewingRequest.city || "All Cities"}</span>
                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">Organisation Name</span>
                  <span className="meta-tile-value">{viewingRequest.organization_name || "Organisation name not provided"}</span>
                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">Phone Number</span>
                  <span className="meta-tile-value">{viewingRequest.phone || "—"}</span>
                </div>
                <div className="meta-tile full-width">
                  <span className="meta-tile-label">Primary Email</span>
                  <span className="meta-tile-value email-val">{viewingRequest.email || "—"}</span>
                </div>

                {/* ID Details & Document View */}
                <div className="meta-tile full-width">
                  <span className="meta-tile-label">
                    {viewingRequest.id_proof_type ? `${viewingRequest.id_proof_type.toUpperCase()} Proof & Document` : "ID Proof"}
                  </span>
                  
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
                    <span className="meta-tile-value mono-val">
                      {viewingRequest.id_proof || "N/A"}
                    </span>

                    {getDocumentUrl(viewingRequest) ? (
                      <a
                        href={getDocumentUrl(viewingRequest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          backgroundColor: "#3b82f6",
                          color: "#ffffff",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          textDecoration: "none",
                          transition: "background 0.2s",
                        }}
                      >
                        <FaFileLines />
                        <span>View ID Document</span>
                        <FaArrowUpRightFromSquare size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                        No document file attached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="admin-desc-section">
                <span className="meta-tile-label">Organization Description</span>
                <div className="admin-desc-box">
                  {viewingRequest.description ? (
                    <p>{viewingRequest.description}</p>
                  ) : (
                    <p className="desc-empty">No organization overview provided.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {viewingRequest.status.toUpperCase() === "PENDING" && (
                <div className="modal-pending-actions">
                  <button
                    type="button"
                    className="btn-reject"
                    disabled={actionLoading === viewingRequest.id}
                    onClick={() => {
                      const id = viewingRequest.id;
                      setViewingRequest(null);
                      openRejectModal(id);
                    }}
                  >
                    <FaXmark /> Reject
                  </button>
                  <button
                    type="button"
                    className="btn-approve"
                    disabled={actionLoading === viewingRequest.id}
                    onClick={() => {
                      const req = viewingRequest;
                      setViewingRequest(null);
                      setApprovingRequest(req);
                    }}
                  >
                    <FaCheck /> Approve
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
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approvingRequest && (
        <div 
          className="modal-backdrop" 
          onClick={() => { if (!actionLoading) setApprovingRequest(null); }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve Application</h3>
              <button 
                className="modal-close-btn" 
                onClick={() => setApprovingRequest(null)}
                disabled={actionLoading !== null}
              >
                <FaXmark />
              </button>
            </div>

            <p className="modal-subtitle">
              Are you sure you want to approve <strong>{approvingRequest.organization_name}</strong>?
              <br /><br />
              This will verify their organizer status and allow them to publish events and host bookings on CityPass.
            </p>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-cancel" 
                disabled={actionLoading !== null}
                onClick={() => setApprovingRequest(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-approve"
                disabled={actionLoading === approvingRequest.id}
                onClick={confirmApproval}
              >
                <FaCheck /> {actionLoading === approvingRequest.id ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
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