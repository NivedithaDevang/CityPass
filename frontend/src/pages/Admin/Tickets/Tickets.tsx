import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./Tickets.css";

import {
  fetchAdminTickets,
  addAdminTicket,
  deleteAdminTicket,
} from "../../../services/adminService";

import { 
  FaTrashCan, 
  FaPlus, 
  FaXmark, 
  FaEye,
  FaIndianRupeeSign 
} from "react-icons/fa6";
import { MdOutlineSearch } from "react-icons/md";

interface AdminTicket {
  id: number;
  name: string;
  description?: string;
  price: number;
  status: "ACTIVE" | "DELETED";
  category: string;
}

interface TicketApiResponse {
  id: number;
  name: string;
  description?: string;
  price?: number;
  status?: string;
  category?: string;
}

const CATEGORY_OPTIONS = [
  "Music",
  "Comedy",
  "Sports",
  "Food",
  "Art",
  "Adventure",
  "Entertainment",
];

function Tickets() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [addingTicket, setAddingTicket] = useState(false);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Add Ticket Modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [ticketName, setTicketName] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPrice, setTicketPrice] = useState<number | "">("");
  const [ticketCategory, setTicketCategory] = useState("Music");

  // View Ticket Details Modal
  const [viewingTicket, setViewingTicket] = useState<AdminTicket | null>(null);

  // Delete Confirmation Modal
  const [deletingTicket, setDeletingTicket] = useState<AdminTicket | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAdminTickets();

      const list = Array.isArray(response)
        ? response
        : response?.tickets ??
          response?.data?.tickets ??
          response?.data ??
          [];

      if (!Array.isArray(list)) {
        throw new Error("Invalid tickets response format");
      }

      const formattedTickets: AdminTicket[] = list.map(
        (ticket: TicketApiResponse) => ({
          id: ticket.id,
          name: ticket.name,
          description: ticket.description || "",
          price: Number(ticket.price) || 0,
          status:
            String(ticket.status).toUpperCase() === "DELETED"
              ? "DELETED"
              : "ACTIVE",
          category: ticket.category || "General",
        })
      );

      setTickets(formattedTickets);
    } catch (err: any) {
      console.error("Failed to fetch tickets:", err);
      const message =
        err?.response?.data?.message ||
        "Failed to load tickets. Please check backend connection.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchSearch =
        !query ||
        ticket.name.toLowerCase().includes(query) ||
        ticket.category.toLowerCase().includes(query) ||
        (ticket.description || "").toLowerCase().includes(query);

      const matchFilter =
        filter === "ALL" ||
        ticket.category.toUpperCase() === filter.toUpperCase();

      return matchSearch && matchFilter;
    });
  }, [tickets, search, filter]);

  const confirmDeleteTicket = async () => {
    if (!deletingTicket) return;

    try {
      setActionLoading(deletingTicket.id);
      setError(null);
      setSuccess(null);

      await deleteAdminTicket(deletingTicket.id);

      setTickets((previous) =>
        previous.filter((t) => t.id !== deletingTicket.id)
      );

      setSuccess("Ticket deleted successfully.");
      setDeletingTicket(null);
      if (viewingTicket?.id === deletingTicket.id) {
        setViewingTicket(null);
      }
    } catch (err: any) {
      console.error("Failed to delete ticket:", err);
      const message =
        err?.response?.data?.message || "Failed to delete ticket.";
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddTicket = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!ticketName.trim()) {
      setError("Ticket name is required.");
      return;
    }

    if (ticketPrice === "" || Number(ticketPrice) < 0) {
      setError("Please provide a valid ticket price.");
      return;
    }

    try {
      setAddingTicket(true);
      setError(null);
      setSuccess(null);

      await addAdminTicket({
        name: ticketName.trim(),
        description: ticketDescription.trim(),
        price: Number(ticketPrice),
        category: ticketCategory,
      });

      // Reset Form State
      setTicketName("");
      setTicketDescription("");
      setTicketPrice("");
      setTicketCategory("Music");
      setShowAddForm(false);

      await loadTickets();
      setSuccess("Ticket added successfully.");
    } catch (err: any) {
      console.error("Failed to add ticket:", err);
      const serverMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add ticket.";
      setError(serverMessage);
    } finally {
      setAddingTicket(false);
    }
  };

  return (
    <div className="ticket-page-container">
      {/* HEADER ROW */}
      <div className="ticket-header-row">
        <div>
          <span className="ticket-subhead">TICKET MANAGEMENT</span>
          <h1>Tickets</h1>
          <p className="ticket-header-desc">
            Manage ticket types, pricing tiers, categories, and descriptions.
          </p>
        </div>

        <div className="ticket-toolbar">
          <div className="ticket-search">
            <MdOutlineSearch />
            <input
              type="text"
              placeholder="Search ticket, category, perks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ticket-tabs">
            {["ALL", "Music", "Comedy", "Sports", "Food", "Art"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${filter.toUpperCase() === tab.toUpperCase() ? "active" : ""}`}
                onClick={() => setFilter(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-create-ticket"
            onClick={() => {
              setShowAddForm(true);
              setError(null);
              setSuccess(null);
            }}
          >
            <FaPlus /> Add Ticket
          </button>
        </div>
      </div>

      {error && (
        <div className="ticket-banner ticket-banner-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="ticket-banner ticket-banner-success">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="ticket-placeholder">Loading tickets...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="ticket-placeholder">
          {tickets.length === 0
            ? "No tickets found."
            : "No tickets match your search or filter."}
        </div>
      ) : (
        <div className="ticket-table-container">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="ticket-col-id">#{ticket.id}</td>
                  <td className="ticket-col-name">{ticket.name}</td>
                  <td>
                    <span className="ticket-cat-badge">{ticket.category}</span>
                  </td>
                  <td>
                    <span className="ticket-table-price">
                      <FaIndianRupeeSign className="rupee-icon" />
                      {ticket.price.toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td>
                    <div className="ticket-table-actions">
                      <button
                        type="button"
                        className="btn-view"
                        onClick={() => setViewingTicket(ticket)}
                      >
                        <FaEye /> View
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        disabled={actionLoading === ticket.id}
                        onClick={() => setDeletingTicket(ticket)}
                      >
                        <FaTrashCan /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW TICKET DETAILS MODAL */}
      {viewingTicket && (
        <div className="modal-backdrop" onClick={() => setViewingTicket(null)}>
          <div className="modal-card ticket-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="modal-title-row">
                  <h3>{viewingTicket.name}</h3>
                  <span className="ticket-cat-badge">{viewingTicket.category}</span>
                </div>
                <span className="modal-subtext">Tier ID: #{viewingTicket.id}</span>
              </div>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setViewingTicket(null)}
              >
                <FaXmark />
              </button>
            </div>

            <div className="ticket-details-body">
              <div className="ticket-meta-grid">
                <div className="meta-tile">
                  <span className="meta-tile-label">Category</span>
                  <span className="meta-tile-value cat-tag">{viewingTicket.category}</span>
                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">Base Price</span>
                  <span className="meta-tile-value price-highlight">
                    <FaIndianRupeeSign /> {viewingTicket.price.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">Status</span>
                  <span className={`status-pill status-${viewingTicket.status.toLowerCase()}`}>
                    {viewingTicket.status}
                  </span>
                </div>
                <div className="meta-tile">
                  <span className="meta-tile-label">Tier Type</span>
                  <span className="meta-tile-value">Standard Pass</span>
                </div>
              </div>

              <div className="ticket-desc-section">
                <span className="meta-tile-label">Description & Perks</span>
                <div className="ticket-desc-box">
                  {viewingTicket.description ? (
                    <p>{viewingTicket.description}</p>
                  ) : (
                    <p className="desc-empty">No description or perks provided for this pass.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-danger-link"
                onClick={() => {
                  const target = viewingTicket;
                  setViewingTicket(null);
                  setDeletingTicket(target);
                }}
              >
                <FaTrashCan /> Delete Tier
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setViewingTicket(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {showAddForm && (
        <div className="modal-backdrop" onClick={() => setShowAddForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Ticket Tier</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setShowAddForm(false)}
              >
                <FaXmark />
              </button>
            </div>

            <form onSubmit={handleAddTicket} className="modal-form-body">
              <div className="input-group">
                <label htmlFor="ticketName">Ticket Name</label>
                <input
                  id="ticketName"
                  type="text"
                  placeholder="e.g. VIP Pass, Early Bird"
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value)}
                  required
                />
              </div>

              <div className="input-row-2">
                <div className="input-group">
                  <label htmlFor="ticketCategory">Category</label>
                  <select
                    id="ticketCategory"
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="ticketPrice">Price (₹)</label>
                  <input
                    id="ticketPrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 499"
                    value={ticketPrice}
                    onChange={(e) =>
                      setTicketPrice(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="ticketDescription">Description / Perks</label>
                <textarea
                  id="ticketDescription"
                  placeholder="Includes backstage pass, drinks, front row..."
                  rows={3}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-ticket"
                  disabled={addingTicket}
                >
                  {addingTicket ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTicket && (
        <div className="modal-backdrop" onClick={() => setDeletingTicket(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Ticket Tier</h3>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setDeletingTicket(null)}
              >
                <FaXmark />
              </button>
            </div>

            <p className="modal-subtitle">
              Are you sure you want to delete <strong>{deletingTicket.name}</strong>? This tier will no longer be available for purchase.
            </p>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeletingTicket(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-delete"
                disabled={actionLoading === deletingTicket.id}
                onClick={confirmDeleteTicket}
              >
                {actionLoading === deletingTicket.id ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tickets;