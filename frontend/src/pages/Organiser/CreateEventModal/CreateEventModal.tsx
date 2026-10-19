import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";

import {
  createOrganiserEvent,
  fetchOrganiserCategories,
  fetchOrganiserCities,
  getOrganiserErrorMessage,
  patchOrganiserEvent,
  type OrganiserEvent,
  type OrganiserLookupOption,
} from "../../../services/organiserService";
import { createCustomEventTicket } from "../../../services/eventTicketService";
import "./CreateEventModal.css";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSaved: (savedEvent: OrganiserEvent) => void;
  eventToEdit?: OrganiserEvent | null;
}

export interface TicketDraft {
  id?: number;
  name: string;
  description: string;
  price: string;
}

interface FormState {
  name: string;
  description: string;
  instructions: string;
  location: string;
  city_id: string;
  category_id: string;
  event_date: string;
  time: string;
  price: number | "";
  capacity: string;
  age_restriction: string;
  duration: string;
}

const initialFormState: FormState = {
  name: "",
  description: "",
  instructions: "",
  location: "",
  city_id: "",
  category_id: "",
  event_date: "",
  time: "",
  price: "",
  capacity: "",
  age_restriction: "All Ages",
  duration: "2 Hours",
};

const defaultInitialTickets: TicketDraft[] = [
  { name: "General Admission", description: "Standard entry pass", price: "" },
];

const AVAILABLE_LANGUAGES = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Punjabi",
  "Gujarati",
];

const AGE_RESTRICTIONS = ["All Ages", "3+", "7+", "12+", "16+", "18+", "21+"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export const CreateEventModal = ({
  isOpen,
  onClose,
  onEventSaved,
  eventToEdit,
}: CreateEventModalProps) => {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "English",
  ]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Dynamic ticket categories created alongside the event
  const [tickets, setTickets] = useState<TicketDraft[]>(defaultInitialTickets);

  const [cities, setCities] = useState<OrganiserLookupOption[]>([]);
  const [categories, setCategories] = useState<OrganiserLookupOption[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(eventToEdit);

  useEffect(() => {
    if (!isOpen) return;

    if (eventToEdit) {
      setFormData({
        name: eventToEdit.name || "",
        description: eventToEdit.description || "",
        instructions:
          (eventToEdit as any).additional_instructions ||
          (eventToEdit as any).instructions ||
          "",
        location: eventToEdit.location || "",
        city_id: String((eventToEdit as any).city_id || ""),
        category_id: String((eventToEdit as any).category_id || ""),
        event_date: eventToEdit.event_date ? eventToEdit.event_date.slice(0, 10) : "",
        time: eventToEdit.time ? eventToEdit.time.slice(0, 5) : "",
        price: eventToEdit.price !== undefined && eventToEdit.price !== null ? Number(eventToEdit.price) : "",
        capacity:
          eventToEdit.capacity !== undefined && eventToEdit.capacity !== null
            ? String(eventToEdit.capacity)
            : "",
        age_restriction:
          (eventToEdit as any).age_group ||
          (eventToEdit as any).age_restriction ||
          "All Ages",
        duration:
          (eventToEdit as any).duration_hours !== undefined &&
          (eventToEdit as any).duration_hours !== null
            ? `${(eventToEdit as any).duration_hours} Hours`
            : (eventToEdit as any).duration || "2 Hours",
      });

      const langs = (eventToEdit as any).languages;
      if (Array.isArray(langs)) {
        setSelectedLanguages(langs);
      } else if (typeof langs === "string") {
        try {
          const parsed = JSON.parse(langs);
          setSelectedLanguages(Array.isArray(parsed) ? parsed : [langs]);
        } catch {
          setSelectedLanguages(langs.split(",").map((l) => l.trim()));
        }
      }

      const existingImg = (eventToEdit as any).image_url || (eventToEdit as any).image;
      if (existingImg) setImagePreview(existingImg);
    } else {
      setFormData(initialFormState);
      setSelectedLanguages(["English"]);
      setImage(null);
      setImagePreview("");
      setTickets([
        { name: "", description: "", price: "" },
      ]);
    }
    setIsLightboxOpen(false);
  }, [isOpen, eventToEdit]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setError(null);
    setLoadingOptions(true);

    Promise.all([fetchOrganiserCities(), fetchOrganiserCategories()])
      .then(([cityOptions, categoryOptions]) => {
        if (!active) return;
        setCities(cityOptions.filter((option) => option.is_active !== false));
        setCategories(categoryOptions.filter((option) => option.is_active !== false));
      })
      .catch((lookupError: unknown) => {
        if (active) {
          setError(getOrganiserErrorMessage(lookupError, "Unable to load form data."));
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
      setSelectedLanguages(["English"]);
      setImage(null);
      setImagePreview("");
      setTickets(defaultInitialTickets);
      setError(null);
      setIsLightboxOpen(false);
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
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleCapacityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const cleanNumeric = event.target.value.replace(/\D/g, "");
    setError(null);
    setFormData((current) => ({
      ...current,
      capacity: cleanNumeric,
    }));
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
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

  // Ticket categories management inside the modal
  const handleAddTicket = () => {
    setTickets((prev) => [
      ...prev,
      { name: "", description: "", price: "" },
    ]);
  };

  const handleRemoveTicket = (index: number) => {
    if (tickets.length === 1) {
      return setError("At least one ticket category is required.");
    }
    setTickets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTicketChange = (
    index: number,
    field: keyof TicketDraft,
    value: string
  ) => {
    setError(null);
    setTickets((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedCapacity = Number(formData.capacity);
    if (!formData.capacity.trim() || isNaN(parsedCapacity) || parsedCapacity < 1) {
      return setError("Capacity must be at least 1 attendee.");
    }

    if (selectedLanguages.length === 0) {
      return setError("Please select at least one language for the event.");
    }

    // Validate tickets if creating new event
    if (!isEditMode) {
      if (tickets.length === 0) {
        return setError("Please add at least one ticket category.");
      }

      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i];
        if (!t.name.trim()) {
          return setError(`Ticket category #${i + 1} needs a name.`);
        }
        const parsedP = Number(t.price);
        if (t.price.trim() === "" || isNaN(parsedP) || parsedP < 0) {
          return setError(`Ticket category "${t.name}" needs a valid price (₹).`);
        }
      }
    }

    const languagesPayload = JSON.stringify(selectedLanguages);

    if (!isEditMode) {
      if (!formData.name.trim()) return setError("Event name is required.");
      if (!formData.city_id || !formData.category_id)
        return setError("Choose a city and category.");
      if (!formData.event_date || !formData.time)
        return setError("Date and time are required.");
      if (!image) return setError("Please upload an event image.");

      // Calculate lowest ticket price as event base starting price
      const validPrices = tickets.map((t) => Number(t.price)).filter((p) => !isNaN(p));
      const minStartingPrice = validPrices.length ? Math.min(...validPrices) : 0;

      try {
        setSubmitting(true);

        const createdEvent = await createOrganiserEvent({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          instructions: formData.instructions.trim() || undefined,
          additional_instructions: formData.instructions.trim() || undefined,
          languages: languagesPayload,
          age_restriction: formData.age_restriction,
          age_group: formData.age_restriction,
          duration: formData.duration.trim() || "2 Hours",
          duration_hours: formData.duration.trim() || "2 Hours",
          location: formData.location.trim() || undefined,
          city_id: Number(formData.city_id),
          category_id: Number(formData.category_id),
          event_date: formData.event_date,
          time: formData.time,
          price: minStartingPrice,
          capacity: parsedCapacity,
          image,
        } as any);

        const newEventId = Number(createdEvent.id || (createdEvent as any).event?.id);

        // Assign ticket categories directly to the created event
        if (newEventId) {
          await Promise.all(
            tickets.map((t) =>
              createCustomEventTicket(newEventId, {
                name: t.name.trim(),
                description: t.description.trim(),
                price: Number(t.price),
              })
            )
          );
        }

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

    // Edit flow
    if (!eventToEdit) return;
    const patchPayload: Record<string, any> = {};

    if (formData.name.trim() !== (eventToEdit.name || "").trim()) {
      patchPayload.name = formData.name.trim();
    }
    if (formData.description.trim() !== (eventToEdit.description || "").trim()) {
      patchPayload.description = formData.description.trim();
    }
    if (formData.location.trim() !== (eventToEdit.location || "").trim()) {
      patchPayload.location = formData.location.trim();
    }
    if (formData.city_id && Number(formData.city_id) !== Number((eventToEdit as any).city_id)) {
      patchPayload.city_id = Number(formData.city_id);
    }
    if (formData.category_id && Number(formData.category_id) !== Number((eventToEdit as any).category_id)) {
      patchPayload.category_id = Number(formData.category_id);
    }
    if (formData.event_date && formData.event_date !== (eventToEdit.event_date || "").slice(0, 10)) {
      patchPayload.event_date = formData.event_date;
    }
    if (formData.time && formData.time !== (eventToEdit.time || "").slice(0, 5)) {
      patchPayload.time = formData.time;
    }
    if (parsedCapacity !== Number(eventToEdit.capacity)) {
      patchPayload.capacity = parsedCapacity;
    }
    if (image instanceof File) {
      patchPayload.image = image;
    }

    const originalInstructions = (
      (eventToEdit as any).additional_instructions ||
      (eventToEdit as any).instructions ||
      ""
    ).trim();
    if (formData.instructions.trim() !== originalInstructions) {
      patchPayload.additional_instructions = formData.instructions.trim();
      patchPayload.instructions = formData.instructions.trim();
    }

    const originalAge = (
      (eventToEdit as any).age_group ||
      (eventToEdit as any).age_restriction ||
      "All Ages"
    ).trim();
    if (formData.age_restriction !== originalAge) {
      patchPayload.age_group = formData.age_restriction;
      patchPayload.age_restriction = formData.age_restriction;
    }

    const originalDuration = String(
      (eventToEdit as any).duration_hours !== undefined && (eventToEdit as any).duration_hours !== null
        ? `${(eventToEdit as any).duration_hours} Hours`
        : (eventToEdit as any).duration || ""
    ).trim();
    if (formData.duration.trim() !== originalDuration) {
      patchPayload.duration_hours = formData.duration.trim();
      patchPayload.duration = formData.duration.trim();
    }

    const currentLanguagesStr = typeof (eventToEdit as any).languages === "string"
      ? (eventToEdit as any).languages
      : JSON.stringify((eventToEdit as any).languages || []);
    if (languagesPayload !== currentLanguagesStr) {
      patchPayload.languages = languagesPayload;
    }

    patchPayload.status = "PENDING";
    patchPayload.is_live = false;
    patchPayload.rejection_reason = null;

    try {
      setSubmitting(true);
      const updatedEvent = await patchOrganiserEvent(eventToEdit.id, patchPayload);
      onEventSaved(updatedEvent);
      requestClose();
    } catch (patchError: unknown) {
      setError(
        getOrganiserErrorMessage(patchError, "Could not submit event for review. Please try again.")
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
                {isEditMode ? "EDIT & RESUBMIT" : "NEW LISTING"}
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

          <form onSubmit={handleSubmit} className="org-modal-form" noValidate>
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
                placeholder="What should guests know about this event?"
              />
            </label>

            <label className="org-form-field org-form-wide" htmlFor="event-instructions">
              <span>Instructions, Amenities & Guidelines</span>
              <textarea
                id="event-instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={3}
                placeholder="e.g. Free parking available, AC hall, Bring physical ID proof, Wheelchair accessible, Outside food strictly prohibited."
              />
            </label>

            <div className="org-form-field org-form-wide">
              <span>Languages</span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem 1rem",
                  marginTop: "0.4rem",
                }}
              >
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const isChecked = selectedLanguages.includes(lang);
                  return (
                    <label
                      key={lang}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleLanguage(lang)}
                      />
                      {lang}
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="org-form-field" htmlFor="event-age">
              <span>Age restriction</span>
              <select
                id="event-age"
                name="age_restriction"
                value={formData.age_restriction}
                onChange={handleChange}
              >
                {AGE_RESTRICTIONS.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </label>

            <label className="org-form-field" htmlFor="event-duration">
              <span>Duration</span>
              <input
                id="event-duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 2 Hours, 90 Mins, Full Day"
              />
            </label>

            <label className="org-form-field" htmlFor="event-city">
              <span>City</span>
              <select
                id="event-city"
                name="city_id"
                value={formData.city_id}
                onChange={handleChange}
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
              />
            </label>

            <label className="org-form-field org-form-wide" htmlFor="event-capacity">
              <span>Total attendee capacity</span>
              <input
                id="event-capacity"
                name="capacity"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Enter attendee limit across all categories (e.g. 100)"
                value={formData.capacity}
                onChange={handleCapacityChange}
              />
            </label>

            {/* Ticket Categories Configuration */}
            {!isEditMode && (
              <div className="org-form-field org-form-wide org-ticket-builder">
                <div className="org-ticket-builder-header">
                  <div>
                    <span className="org-ticket-builder-title">Ticket categories</span>
                    <small>Create ticket tiers for this event (e.g. Early Bird, VIP, General)</small>
                  </div>

                  <button
                    type="button"
                    className="org-add-ticket-btn"
                    onClick={handleAddTicket}
                  >
                    <Plus size={15} /> Add category
                  </button>
                </div>

                <div className="org-ticket-builder-list">
                  {tickets.map((ticket, index) => (
                    <div key={index} className="org-ticket-builder-item">
                      <div className="org-ticket-row-top">
                        <input
                          type="text"
                          placeholder="Category name (e.g. VIP Pass)"
                          value={ticket.name}
                          onChange={(e) =>
                            handleTicketChange(index, "name", e.target.value)
                          }
                          className="org-ticket-name-input"
                        />

                        <div className="org-ticket-price-input-wrapper">
                          <span className="currency-prefix">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Price"
                            value={ticket.price}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9.]/g, "");
                              handleTicketChange(index, "price", clean);
                            }}
                            className="org-ticket-price-input"
                          />
                        </div>

                        {tickets.length > 1 && (
                          <button
                            type="button"
                            className="org-ticket-delete-btn"
                            onClick={() => handleRemoveTicket(index)}
                            aria-label="Remove ticket category"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Short description / perks (e.g. Front row seat + welcome drink)"
                        value={ticket.description}
                        onChange={(e) =>
                          handleTicketChange(index, "description", e.target.value)
                        }
                        className="org-ticket-desc-input"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="org-modal-footer org-form-wide">
              <p>
                {isEditMode
                  ? "Editing this event will reset its status to pending and require admin approval before it can go live."
                  : "New events and their ticket tiers are submitted as pending for admin approval."}
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
                      {isEditMode ? "Submitting for review..." : "Submitting event & tickets..."}
                    </>
                  ) : isEditMode ? (
                    "Submit for review"
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