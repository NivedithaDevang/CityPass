
import { useEffect, useState, type FormEvent } from "react";
import {
  assignTicketTemplate,
  createCustomEventTicket,
  getEventTickets,
  getTicketTemplates,
  type EventTicket,
  type TicketTemplate,
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
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

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

        const [eventTickets, availableTemplates] = await Promise.all([
          getEventTickets(eventId),
          getTicketTemplates(eventId),
        ]);

        if (isMounted) {
          setTickets(eventTickets);
          setTemplates(availableTemplates);
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
    const [eventTickets, availableTemplates] = await Promise.all([
      getEventTickets(eventId),
      getTicketTemplates(eventId),
    ]);

    setTickets(eventTickets);
    setTemplates(availableTemplates);
  };

  const handleAssignTemplate = async () => {
    if (!selectedTemplate) {
      setError("Please select a ticket template.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await assignTicketTemplate(eventId, Number(selectedTemplate));

      setSuccess("Ticket template assigned successfully.");
      setSelectedTemplate("");

      await reloadTickets();
    } catch (err: unknown) {
      console.error("Failed to assign ticket:", err);

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
            "Unable to assign this ticket. It may already be assigned.",
        );
      } else {
        setError("Unable to assign this ticket. Please try again.");
      }
    } finally {
      setSaving(false);
    }
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

      await createCustomEventTicket(eventId, {
        name: name.trim(),
        description: description.trim(),
        price: ticketPrice,
      });

      setName("");
      setDescription("");
      setPrice("");

      setSuccess("Custom ticket created successfully.");

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
            "Unable to create the custom ticket.",
        );
      } else {
        setError("Unable to create the custom ticket. Please try again.");
      }
    } finally {
      setSaving(false);
    }
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
              Assign standard tickets or create custom tickets for this event.
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
                  No tickets assigned yet. Assign a standard ticket or create
                  a custom one below.
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ticket-manager-section">
              <h3>Assign a standard ticket</h3>
              <p>Choose from the admin ticket catalogue for this category.</p>

              {templates.length === 0 ? (
                <p className="ticket-empty">
                  No standard templates are available for this event category.
                </p>
              ) : (
                <>
                  <label htmlFor="ticket-template">
                    Select ticket template
                  </label>

                  <select
                    id="ticket-template"
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      setError("");
                      setSuccess("");
                    }}
                  >
                    <option value="">Select a ticket template</option>

                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} — ₹
                        {Number(template.price).toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="ticket-primary-btn"
                    onClick={handleAssignTemplate}
                    disabled={saving || !selectedTemplate}
                  >
                    {saving ? "Please wait..." : "Assign Ticket"}
                  </button>
                </>
              )}
            </div>

            <div className="ticket-manager-section">
              <h3>Create a custom ticket</h3>
              <p>Create a ticket specifically for this event.</p>

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
                  {saving ? "Saving..." : "Create Custom Ticket"}
                </button>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default EventTicketManager;
