import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ImagePlus, Loader2, Plus, Ticket, Trash2, X } from "lucide-react";

import {
  createOrganiserEvent,
  fetchOrganiserCategories,
  fetchOrganiserCities,
  getOrganiserErrorMessage,
  patchOrganiserEvent,
  type OrganiserEvent,
  type OrganiserLookupOption,
} from "../../../services/organiserService";
import axios from "axios";
import { API_BASE_URL } from "../../../config/config";

import "./CreateEventModal.css";

interface AdminTicketTemplate {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  status?: string;
}

export interface SelectedTicketTier {
  id?: number | string;
  name: string;
  price: number;
  type: "ADMIN" | "CUSTOM";
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSaved: (savedEvent: OrganiserEvent) => void;
  eventToEdit?: OrganiserEvent | null;
}

interface FormState {
  name: string;
  description: string;
  location: string;
  city_id: string;
  category_id: string;
  event_date: string;
  time: string;
  price: number;
  capacity: number;
}

const initialFormState: FormState = {
  name: "",
  description: "",
  location: "",
  city_id: "",
  category_id: "",
  event_date: "",
  time: "",
  price: 0,
  capacity: 50,
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export const CreateEventModal = ({
  isOpen,
  onClose,
  onEventSaved,
  eventToEdit,
}: CreateEventModalProps) => {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [cities, setCities] = useState<OrganiserLookupOption[]>([]);
  const [categories, setCategories] = useState<OrganiserLookupOption[]>([]);
  const [adminTickets, setAdminTickets] = useState<AdminTicketTemplate[]>([]);

  const [ticketMode, setTicketMode] = useState<"NONE" | "ADMIN" | "CUSTOM">("NONE");
  const [selectedAdminTicketIds, setSelectedAdminTicketIds] = useState<number[]>([]);
  const [customTiers, setCustomTiers] = useState<Array<{ name: string; price: number }>>([]);
  const [newCustomTierName, setNewCustomTierName] = useState("");
  const [newCustomTierPrice, setNewCustomTierPrice] = useState<number>(0);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(eventToEdit);

  const selectedCategoryName = useMemo(() => {
    const found = categories.find((c) => String(c.id) === String(formData.category_id));
    return found ? found.name.toLowerCase() : "";
  }, [categories, formData.category_id]);

  const availableAdminTickets = useMemo(() => {
    if (!selectedCategoryName) return [];
    return adminTickets.filter(
      (ticket) =>
        ticket.status !== "DELETED" &&
        ticket.category.trim().toLowerCase() === selectedCategoryName
    );
  }, [adminTickets, selectedCategoryName]);

  useEffect(() => {
    if (!isOpen) return;

    if (eventToEdit) {
      setFormData({
        name: eventToEdit.name || "",
        description: eventToEdit.description || "",
        location: eventToEdit.location || "",
        city_id: String((eventToEdit as any).city_id || ""),
        category_id: String((eventToEdit as any).category_id || ""),
        event_date: eventToEdit.event_date ? eventToEdit.event_date.slice(0, 10) : "",
        time: eventToEdit.time ? eventToEdit.time.slice(0, 5) : "",
        price: Number(eventToEdit.price) || 0,
        capacity: Number(eventToEdit.capacity) || 50,
      });

      const existingTiers = (eventToEdit as any).ticket_tiers;
      if (Array.isArray(existingTiers) && existingTiers.length > 0) {
        setTicketMode("CUSTOM");
        setCustomTiers(existingTiers);
      } else if ((eventToEdit as any).ticket_category_name) {
        setTicketMode("CUSTOM");
        setCustomTiers([
          {
            name: (eventToEdit as any).ticket_category_name,
            price: Number(eventToEdit.price) || 0,
          },
        ]);
      } else {
        setTicketMode("NONE");
        setCustomTiers([]);
      }

      const existingImg = (eventToEdit as any).image_url || (eventToEdit as any).image;
      if (existingImg) setImagePreview(existingImg);
    } else {
      setFormData(initialFormState);
      setImage(null);
      setImagePreview("");
      setTicketMode("NONE");
      setSelectedAdminTicketIds([]);
      setCustomTiers([]);
    }
    setIsLightboxOpen(false);
  }, [isOpen, eventToEdit]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setError(null);
    setLoadingOptions(true);

    const fetchTickets = async (): Promise<AdminTicketTemplate[]> => {
      try {
        const res = await axios.get(`${API_BASE_URL}/v1/tickets`);
        return res.data?.tickets || [];
      } catch {
        return [];
      }
    };

    Promise.all([fetchOrganiserCities(), fetchOrganiserCategories(), fetchTickets()])
      .then(([cityOptions, categoryOptions, ticketTemplates]) => {
        if (!active) return;
        setCities(cityOptions.filter((option) => option.is_active !== false));
        setCategories(categoryOptions.filter((option) => option.is_active !== false));
        setAdminTickets(ticketTemplates.filter((t) => t.status !== "DELETED"));
      })
      .catch((lookupError: unknown) => {
        if (active) {
          setError(
            getOrganiserErrorMessage(lookupError, "Unable to load form data.")
          );
        }
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedAdminTicketIds((prev) =>
      prev.filter((id) => availableAdminTickets.some((t) => t.id === id))
    );
  }, [availableAdminTickets]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!isOpen) return null;

  const requestClose = () => {
    if (!submitting) {
      setFormData(initialFormState);
      setImage(null);
      setImagePreview("");
      setError(null);
      setIsLightboxOpen(false);
      setTicketMode("NONE");
      setSelectedAdminTicketIds([]);
      setCustomTiers([]);
      onClose();
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    setError(null);
    setFormData((current) => ({
      ...current,
      [name]:
        type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  const handleToggleAdminTicket = (ticket: AdminTicketTemplate) => {
    setSelectedAdminTicketIds((prev) => {
      const exists = prev.includes(ticket.id);
      const next = exists ? prev.filter((id) => id !== ticket.id) : [...prev, ticket.id];

      const chosenTiers = adminTickets.filter((t) => next.includes(t.id));
      if (chosenTiers.length > 0) {
        const lowestPrice = Math.min(...chosenTiers.map((t) => Number(t.price)));
        setFormData((fd) => ({ ...fd, price: lowestPrice }));
      }
      return next;
    });
  };

  const handleAddCustomTier = () => {
    if (!newCustomTierName.trim()) {
      setError("Please provide a name for the custom tier.");
      return;
    }
    setCustomTiers((prev) => [
      ...prev,
      { name: newCustomTierName.trim(), price: Number(newCustomTierPrice) || 0 },
    ]);
    if (formData.price === 0 || Number(newCustomTierPrice) < formData.price) {
      setFormData((fd) => ({ ...fd, price: Number(newCustomTierPrice) || 0 }));
    }
    setNewCustomTierName("");
    setNewCustomTierPrice(0);
  };

  const handleRemoveCustomTier = (index: number) => {
    setCustomTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const getFinalTicketTiers = (): SelectedTicketTier[] => {
    if (ticketMode === "ADMIN") {
      return adminTickets
        .filter((t) => selectedAdminTicketIds.includes(t.id))
        .map((t) => ({ id: t.id, name: t.name, price: Number(t.price), type: "ADMIN" }));
    }
    if (ticketMode === "CUSTOM") {
      return customTiers.map((c, i) => ({ id: `custom-${i}`, name: c.name, price: c.price, type: "CUSTOM" }));
    }
    return [{ name: "General Admission", price: Number(formData.price), type: "ADMIN" }];
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    if (!allowedImageTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Event image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setImage(null);
    setImagePreview("");
    setIsLightboxOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (ticketMode === "ADMIN" && selectedAdminTicketIds.length === 0) {
      return setError("Please choose at least one admin ticket tier.");
    }
    if (ticketMode === "CUSTOM" && customTiers.length === 0) {
      return setError("Please add at least one custom ticket tier.");
    }

    const compiledTiers = getFinalTicketTiers();
    const primaryTierName = compiledTiers.map((t) => t.name).join(", ");

    if (!isEditMode) {
      if (!formData.name.trim()) return setError("Event name is required.");
      if (!formData.city_id || !formData.category_id) return setError("Choose a city and category.");
      if (!formData.event_date || !formData.time) return setError("Date and time are required.");
      if (formData.capacity < 1) return setError("Capacity must be at least 1.");
      if (!image) return setError("Please upload an event image.");

      try {
        setSubmitting(true);
        const createdEvent = await createOrganiserEvent({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
          city_id: Number(formData.city_id),
          category_id: Number(formData.category_id),
          event_date: formData.event_date,
          time: formData.time,
          price: Number(formData.price),
          capacity: Number(formData.capacity),
          ticket_category_name: primaryTierName,
          ticket_tiers: JSON.stringify(compiledTiers),
          image,
        } as any);

        onEventSaved(createdEvent);
        requestClose();
      } catch (submitError: unknown) {
        setError(
          getOrganiserErrorMessage(submitError, "Could not submit event. Please try again.")
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!eventToEdit) return;
    const patchPayload: Record<string, any> = {};

    if (formData.name.trim() !== (eventToEdit.name || "").trim()) patchPayload.name = formData.name.trim();
    if (formData.description.trim() !== (eventToEdit.description || "").trim()) patchPayload.description = formData.description.trim();
    if (formData.location.trim() !== (eventToEdit.location || "").trim()) patchPayload.location = formData.location.trim();
    if (formData.city_id && Number(formData.city_id) !== Number((eventToEdit as any).city_id)) patchPayload.city_id = Number(formData.city_id);
    if (formData.category_id && Number(formData.category_id) !== Number((eventToEdit as any).category_id)) patchPayload.category_id = Number(formData.category_id);
    if (formData.event_date && formData.event_date !== (eventToEdit.event_date || "").slice(0, 10)) patchPayload.event_date = formData.event_date;
    if (formData.time && formData.time !== (eventToEdit.time || "").slice(0, 5)) patchPayload.time = formData.time;
    if (Number(formData.price) !== Number(eventToEdit.price)) patchPayload.price = Number(formData.price);
    if (Number(formData.capacity) !== Number(eventToEdit.capacity)) patchPayload.capacity = Number(formData.capacity);
    if (image instanceof File) patchPayload.image = image;

    patchPayload.ticket_category_name = primaryTierName;
    patchPayload.ticket_tiers = JSON.stringify(compiledTiers);

    try {
      setSubmitting(true);
      const updatedEvent = await patchOrganiserEvent(eventToEdit.id, patchPayload);
      onEventSaved(updatedEvent);
      requestClose();
    } catch (patchError: unknown) {
      setError(
        getOrganiserErrorMessage(patchError, "Could not update event details. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="org-modal-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) requestClose();
        }}
      >
        <section
          className="org-create-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="org-create-title"
        >
          <header className="org-modal-header">
            <div>
              <span className="org-modal-eyebrow">
                {isEditMode ? "EDIT EVENT" : "NEW LISTING"}
              </span>
              <h3 id="org-create-title">
                {isEditMode ? "Edit event details" : "Create an event"}
              </h3>
            </div>

            <button
              type="button"
              className="org-modal-close"
              onClick={requestClose}
              disabled={submitting}
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="org-modal-form">
            {error && (
              <div className="org-form-error" role="alert">
                {error}
              </div>
            )}

            <div className="org-form-field org-form-wide">
              <span>Event image</span>
              {!imagePreview ? (
                <label htmlFor="event-image" className="org-event-image-upload">
                  <ImagePlus size={28} />
                  <strong>Upload event image</strong>
                  <small>JPG, PNG or WebP · Max 5 MB</small>
                  <input
                    id="event-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              ) : (
                <div className="org-event-image-preview">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="org-clickable-preview"
                    title="Click to view full image"
                    onClick={() => setIsLightboxOpen(true)}
                  />

                  <div className="org-event-image-preview-actions">
                    <label htmlFor="event-image-change" className="org-image-change-btn">
                      Change image
                    </label>
                    <button
                      type="button"
                      className="org-image-remove-btn"
                      onClick={() => {
                        setImage(null);
                        setImagePreview("");
                      }}
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>

                  <input
                    id="event-image-change"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    hidden
                  />
                </div>
              )}
            </div>

            <label className="org-form-field org-form-wide" htmlFor="event-name">
              <span>Event name</span>
              <input
                id="event-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={120}
                required
                placeholder="Give your event a name"
              />
            </label>

            <label className="org-form-field org-form-wide" htmlFor="event-description">
              <span>Description</span>
              <textarea
                id="event-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="What should guests know?"
              />
            </label>

            <label className="org-form-field" htmlFor="event-city">
              <span>City</span>
              <select
                id="event-city"
                name="city_id"
                value={formData.city_id}
                onChange={handleChange}
                required
                disabled={loadingOptions}
              >
                <option value="">
                  {loadingOptions ? "Loading..." : "Select a city"}
                </option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="org-form-field" htmlFor="event-category">
              <span>Category</span>
              <select
                id="event-category"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                disabled={loadingOptions}
              >
                <option value="">
                  {loadingOptions ? "Loading..." : "Select a category"}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="org-form-field org-form-wide" htmlFor="event-location">
              <span>Venue or location</span>
              <input
                id="event-location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Venue, address, or neighbourhood"
              />
            </label>

            <label className="org-form-field" htmlFor="event-date">
              <span>Date</span>
              <input
                id="event-date"
                name="event_date"
                type="date"
                value={formData.event_date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="org-form-field" htmlFor="event-time">
              <span>Start time</span>
              <input
                id="event-time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </label>

            <div className="org-form-field org-form-wide org-tier-section">
              <div className="org-tier-header">
                <Ticket size={16} />
                <span>Ticket Category & Tiers</span>
              </div>

              <div className="org-tier-radios">
                <label className="org-tier-radio-label">
                  <input
                    type="radio"
                    name="tierMode"
                    checked={ticketMode === "NONE"}
                    onChange={() => {
                      setTicketMode("NONE");
                      setSelectedAdminTicketIds([]);
                      setCustomTiers([]);
                    }}
                  />
                  No category (General Admission)
                </label>

                <label className="org-tier-radio-label">
                  <input
                    type="radio"
                    name="tierMode"
                    checked={ticketMode === "ADMIN"}
                    onChange={() => setTicketMode("ADMIN")}
                  />
                  Admin ticket tiers {selectedCategoryName ? `(${selectedCategoryName})` : ""}
                </label>

                <label className="org-tier-radio-label">
                  <input
                    type="radio"
                    name="tierMode"
                    checked={ticketMode === "CUSTOM"}
                    onChange={() => setTicketMode("CUSTOM")}
                  />
                  Custom tiers
                </label>
              </div>

              {ticketMode === "ADMIN" && (
                <div className="org-tier-list">
                  {!formData.category_id ? (
                    <p className="org-tier-hint">
                      👉 Select an event category above to see matching ticket tiers.
                    </p>
                  ) : availableAdminTickets.length === 0 ? (
                    <p className="org-tier-error">
                      No admin tiers configured for the <strong>{selectedCategoryName}</strong> category yet.
                    </p>
                  ) : (
                    availableAdminTickets.map((t) => {
                      const isSelected = selectedAdminTicketIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          className={`org-tier-card ${isSelected ? "selected" : ""}`}
                          onClick={() => handleToggleAdminTicket(t)}
                        >
                          <div className="org-tier-card-left">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ pointerEvents: "none" }}
                            />
                            <div className="org-tier-details">
                              <strong>{t.name}</strong>
                              {t.description && <p>{t.description}</p>}
                            </div>
                          </div>
                          <span className="org-tier-price">₹{Number(t.price).toLocaleString()}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {ticketMode === "CUSTOM" && (
                <div className="org-custom-builder">
                  <div className="org-custom-inputs">
                    <input
                      type="text"
                      placeholder="Tier name (e.g. VIP, Early Bird)"
                      value={newCustomTierName}
                      onChange={(e) => setNewCustomTierName(e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Price (₹)"
                      value={newCustomTierPrice || ""}
                      onChange={(e) => setNewCustomTierPrice(Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="org-custom-add-btn"
                      onClick={handleAddCustomTier}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>

                  {customTiers.map((tier, idx) => (
                    <div key={idx} className="org-custom-item">
                      <span>{tier.name}</span>
                      <div className="org-custom-item-actions">
                        <strong>₹{tier.price.toLocaleString()}</strong>
                        <button
                          type="button"
                          className="org-custom-remove-btn"
                          onClick={() => handleRemoveCustomTier(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="org-form-field" htmlFor="event-price">
              <span>Starting / base ticket price (₹)</span>
              <input
                id="event-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </label>

            <label className="org-form-field" htmlFor="event-capacity">
              <span>Capacity</span>
              <input
                id="event-capacity"
                name="capacity"
                type="number"
                min="1"
                step="1"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </label>

            <div className="org-modal-footer org-form-wide">
              <p>
                {isEditMode
                  ? "Edits may re-require admin approval."
                  : "New events are submitted as pending for admin approval."}
              </p>

              <div>
                <button
                  type="button"
                  className="org-button-secondary"
                  onClick={requestClose}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="org-button-primary"
                  disabled={submitting || loadingOptions}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="org-spin" />
                      {isEditMode ? "Saving changes..." : "Submitting..."}
                    </>
                  ) : isEditMode ? (
                    "Save changes"
                  ) : (
                    "Submit for approval"
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>

      {isLightboxOpen && (
        <div
          className="org-image-lightbox-backdrop"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="org-image-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="org-image-lightbox-close"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close image preview"
            >
              <X size={20} />
            </button>
            <img src={imagePreview} alt="Full event preview" />
          </div>
        </div>
      )}
    </>
  );
};