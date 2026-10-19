
import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  createCustomEventTicket,
  deleteEventTicket,
  getEventTickets,
  updateEventTicket,
  type EventTicket,
} from "../../services/eventTicketService";
import "./EventTicketManager.css";

interface EventTicketManagerProps {
  eventId: number;
  onClose?: () => void;
}

const EventTicketManager = ({
  eventId,
  onClose,
}: EventTicketManagerProps) => {
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTickets = async () => {
      try {
        setLoading(true);
        setError("");

        const eventTickets = await getEventTickets(eventId);

        if (isMounted) {
          setTickets(eventTickets);
        }
      } catch (err) {
        console.error("Failed to load event tickets:", err);

        if (isMounted) {
          setError("Unable to load tickets. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadTickets();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const reloadTickets = async () => {
    setTickets(await getEventTickets(eventId));
  };

  const handleCreateCustomTicket = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a ticket name.");
      return;
    }

    const ticketPrice = Number(price);

    if (
      price.trim() === "" ||
      !Number.isFinite(ticketPrice) ||
      ticketPrice < 0
    ) {
      setError("Enter a valid ticket price.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const ticketData = {
        name: name.trim(),
        description: description.trim(),
        price: ticketPrice,
      };

      if (editingTicket) {
        await updateEventTicket(eventId, editingTicket.id, ticketData);
      } else {
        await createCustomEventTicket(eventId, ticketData);
      }

      const wasEditing = Boolean(editingTicket);
      setEditingTicket(null);
      setName("");
      setDescription("");
      setPrice("");

      setSuccess(wasEditing ? "Ticket updated successfully." : "Ticket added successfully.");

      await reloadTickets();
    } catch (err: unknown) {
      console.error("Failed to create custom ticket:", err);

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const response = (
          err as {
            response?: { data?: { message?: string } };
          }
        ).response;

        setError(
          response?.data?.message ||
            "Unable to save the ticket.",
        );
      } else {
        setError("Unable to save the ticket. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditTicket = (ticket: EventTicket) => {
    setEditingTicket(ticket);
    setName(ticket.name);
    setDescription(ticket.description || "");
    setPrice(String(ticket.price));
    setError("");
    setSuccess("");
  };

  const handleDeleteTicket = async (ticket: EventTicket) => {
    if (!window.confirm(`Remove "${ticket.name}" from this event?`)) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await deleteEventTicket(eventId, ticket.id);
      setTickets((current) => current.filter((item) => item.id !== ticket.id));
      if (editingTicket?.id === ticket.id) {
        setEditingTicket(null);
        setName("");
        setDescription("");
        setPrice("");
      }
      setSuccess("Ticket removed successfully.");
    } catch (err: unknown) {
      console.error("Failed to remove event ticket:", err);
      const response =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
          : undefined;
      setError(response?.data?.message || "Unable to remove this ticket. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditingTicket(null);
    setName("");
    setDescription("");
    setPrice("");
    setError("");
  };

  return (
    <div
      className="event-ticket-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        className="event-ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-manager-title"
      >
        <div className="ticket-manager-header">
          <div>
            <h2 id="ticket-manager-title">Manage Event Tickets</h2>
            <p>
              Create and manage ticket categories for this event.
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              className="ticket-close-btn"
              onClick={onClose}
              aria-label="Close ticket manager"
            >
              ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="ticket-loading">
            <span className="ticket-spinner" />
            <p>Loading tickets...</p>
          </div>
        ) : (
          <>
            {error && (
              <p className="ticket-message error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="ticket-message success" role="status">
                {success}
              </p>
            )}

            <div className="ticket-manager-section">
              <h3>Tickets assigned to this event</h3>

              {tickets.length === 0 ? (
                <p className="ticket-empty">
                  No tickets created yet. Add ticket categories for this event below.
                </p>
              ) : (
                <div className="event-ticket-list">
                  {tickets.map((ticket) => (
                    <div className="event-ticket-item" key={ticket.id}>
                      <div>
                        <h4>{ticket.name}</h4>
                        <p>
                          {ticket.description || "No description provided."}
                        </p>
                      </div>

                      <strong>
                        ₹{Number(ticket.price).toFixed(2)}
                      </strong>
                      <div className="event-ticket-actions">
                        <button
                          type="button"
                          onClick={() => handleEditTicket(ticket)}
                          disabled={saving}
                          aria-label={`Edit ${ticket.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteTicket(ticket)}
                          disabled={saving}
                          aria-label={`Remove ${ticket.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ticket-manager-section">
              <h3>{editingTicket ? "Edit ticket category" : "Add a ticket category"}</h3>
              <p>Ticket categories are managed by the organiser of this event.</p>

              <form onSubmit={handleCreateCustomTicket}>
                <label htmlFor="custom-ticket-name">Ticket name</label>
                <input
                  id="custom-ticket-name"
                  type="text"
                  value={name}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Example: VIP Pass"
                  required
                />

                <label htmlFor="custom-ticket-description">
                  Description
                </label>
                <textarea
                  id="custom-ticket-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this ticket include?"
                  rows={3}
                />

                <label htmlFor="custom-ticket-price">Price (₹)</label>
                <input
                  id="custom-ticket-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Example: 499"
                  required
                />

                <button
                  type="submit"
                  className="ticket-primary-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingTicket ? "Save Changes" : "Add Ticket"}
                </button>
                {editingTicket && (
                  <button
                    type="button"
                    className="ticket-secondary-btn"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel editing
                  </button>
                )}
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default EventTicketManager;
