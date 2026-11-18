import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import "./Cities.css";

import {
  fetchAdminCities,
  updateCityStatus,
  updateCity,
  addCity,
} from "../../../services/adminService";
import { FaImage } from "react-icons/fa6";

interface AdminCity {
  id: number;
  name: string;
  image?: string | null;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
  is_active?: boolean | number;
}

interface CityApiResponse {
  id: number;
  name: string;
  image?: string | null;
  description?: string | null;
  status?: string;
  is_active?: boolean | number;
}

const getCityStatus = (city: CityApiResponse): "ACTIVE" | "INACTIVE" => {
  if (city.status !== undefined && city.status !== null) {
    return String(city.status).toUpperCase() === "ACTIVE"
      ? "ACTIVE"
      : "INACTIVE";
  }

  return city.is_active === true || Number(city.is_active) === 1
    ? "ACTIVE"
    : "INACTIVE";
};

function Cities() {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCity, setAddingCity] = useState(false);
  const [savingCity, setSavingCity] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCity, setEditingCity] = useState<AdminCity | null>(null);

  // Status Confirmation Modal State
  const [statusConfirmCity, setStatusConfirmCity] = useState<{
    city: AdminCity;
    targetStatus: "ACTIVE" | "INACTIVE";
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Add City States
  const [cityName, setCityName] = useState("");
  const [cityDescription, setCityDescription] = useState("");
  const [cityImage, setCityImage] = useState<File | null>(null);
  const [cityImagePreview, setCityImagePreview] = useState("");

  // Edit City States
  const [editCityName, setEditCityName] = useState("");
  const [editCityDescription, setEditCityDescription] = useState("");
  const [editCityStatus, setEditCityStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editCityImage, setEditCityImage] = useState<File | null>(null);
  const [editCityImagePreview, setEditCityImagePreview] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Prevent background scroll when modals are open
  useEffect(() => {
    if (editingCity || statusConfirmCity) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [editingCity, statusConfirmCity]);

  useEffect(() => {
    if (!cityImagePreview) return;
    return () => {
      if (cityImagePreview.startsWith("blob:")) URL.revokeObjectURL(cityImagePreview);
    };
  }, [cityImagePreview]);

  useEffect(() => {
    if (!editCityImagePreview) return;
    return () => {
      if (editCityImagePreview.startsWith("blob:")) URL.revokeObjectURL(editCityImagePreview);
    };
  }, [editCityImagePreview]);

  const handleCityImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("City image must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setError(null);
    setCityImage(file);
    setCityImagePreview(URL.createObjectURL(file));
  };

  const handleEditCityImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("City image must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setError(null);
    setEditCityImage(file);
    setEditCityImagePreview(URL.createObjectURL(file));
  };

  const loadCities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAdminCities();

      const list = Array.isArray(response)
        ? response
        : response?.cities ??
          response?.data?.cities ??
          response?.data ??
          [];

      const formattedCities: AdminCity[] = list.map(
        (city: CityApiResponse) => ({
          ...city,
          status: getCityStatus(city),
        })
      );

      setCities(formattedCities);
    } catch (err) {
      console.error("Failed to fetch cities:", err);
      setError("Failed to load cities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCities();
  }, []);

  const filteredCities = useMemo(() => {
    return cities.filter((city) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        city.name.toLowerCase().includes(query) ||
        (city.description || "").toLowerCase().includes(query);

      const matchesFilter = filter === "ALL" || city.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [cities, search, filter]);

  // Prompt Confirmation Popup
  const promptStatusUpdate = (city: AdminCity) => {
    const targetStatus = city.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusConfirmCity({ city, targetStatus });
  };

  // Execute Status Update after Confirmation
  const executeStatusUpdate = async () => {
    if (!statusConfirmCity) return;

    const { city, targetStatus } = statusConfirmCity;

    try {
      setUpdatingStatus(true);
      setError(null);
      setSuccess(null);

      await updateCityStatus(city.id, targetStatus);

      setCities((previous) =>
        previous.map((item) =>
          item.id === city.id
            ? {
                ...item,
                status: targetStatus,
                is_active: targetStatus === "ACTIVE" ? 1 : 0,
              }
            : item
        )
      );

      setSuccess(
        `City "${city.name}" ${
          targetStatus === "ACTIVE" ? "activated" : "deactivated"
        } successfully.`
      );
      setStatusConfirmCity(null);
    } catch (err: any) {
      console.error("Failed to update city status:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update city status. Please try again."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEditCity = (city: AdminCity) => {
    setEditingCity(city);
    setEditCityName(city.name);
    setEditCityDescription(city.description || "");
    setEditCityStatus(city.status);
    setEditCityImage(null);
    setEditCityImagePreview(city.image || "");
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingCity(null);
    setEditCityName("");
    setEditCityDescription("");
    setEditCityStatus("ACTIVE");
    setEditCityImage(null);
    setEditCityImagePreview("");
  };

  const handleUpdateCity = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingCity) return;

    if (!editCityName.trim()) {
      setError("City name is required.");
      return;
    }

    try {
      setSavingCity(true);
      setError(null);
      setSuccess(null);

      const payload: {
        name: string;
        description: string;
        is_active: boolean;
        image?: File | null;
      } = {
        name: editCityName.trim(),
        description: editCityDescription.trim(),
        is_active: editCityStatus === "ACTIVE",
      };

      if (editCityImage) {
        payload.image = editCityImage;
      }

      await updateCity(editingCity.id, payload);

      handleCancelEdit();
      await loadCities();
      setSuccess("City updated successfully.");
    } catch (err: any) {
      console.error("Failed to update city:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update city. Please try again."
      );
    } finally {
      setSavingCity(false);
    }
  };

  const handleAddCity = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!cityName.trim()) {
      setError("City name is required.");
      return;
    }

    try {
      setAddingCity(true);
      setError(null);
      setSuccess(null);

      await addCity(cityName.trim(), cityDescription.trim(), cityImage);

      setCityName("");
      setCityDescription("");
      setCityImage(null);
      setCityImagePreview("");
      setShowAddForm(false);

      await loadCities();
      setSuccess("City added successfully and set to ACTIVE.");
    } catch (err: any) {
      console.error("Failed to add city:", err);
      setError(
        err?.response?.data?.message ||
          "City already exists. Please enter a new city name."
      );
    } finally {
      setAddingCity(false);
    }
  };

  return (
    <div className="cities-container">
      <div className="cities-header">
        <div>
          <span className="cities-subtitle">LOCATION MANAGEMENT</span>
          <h1>Cities</h1>
          <p>Manage cities available on CityPass.</p>
        </div>

        <button
          type="button"
          className="add-city-btn"
          onClick={() => {
            setShowAddForm((previous) => !previous);
            setError(null);
            setSuccess(null);
          }}
        >
          {showAddForm ? "Cancel" : "+ Add City"}
        </button>
      </div>

      {error && (
        <div className="cities-message cities-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="cities-message cities-success">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)}>
            Dismiss
          </button>
        </div>
      )}

      {showAddForm && (
        <form className="city-form" onSubmit={handleAddCity}>
          <h2>Add New City</h2>

          <div className="city-form-group">
            <label htmlFor="cityName">City Name</label>
            <input
              id="cityName"
              type="text"
              placeholder="Enter city name"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              required
            />
          </div>

          <div className="city-form-group">
            <label htmlFor="cityImage">City Image</label>
            <input
              id="cityImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCityImageChange}
            />
            {cityImagePreview && (
              <div className="city-image-preview">
                <img src={cityImagePreview} alt="City preview" />
                <span>{cityImage?.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCityImage(null);
                    setCityImagePreview("");
                    const input = document.getElementById(
                      "cityImage"
                    ) as HTMLInputElement | null;
                    if (input) input.value = "";
                  }}
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          <div className="city-form-group">
            <label htmlFor="cityDescription">Description</label>
            <textarea
              id="cityDescription"
              placeholder="Enter city description"
              value={cityDescription}
              onChange={(e) => setCityDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="city-form-group">
            <label>Status</label>
            <input type="text" value="ACTIVE" disabled />
          </div>

          <button
            type="submit"
            className="add-city-btn"
            disabled={addingCity}
          >
            {addingCity ? "Adding City..." : "Add City"}
          </button>
        </form>
      )}

      <div className="cities-toolbar">
        <input
          type="text"
          className="cities-search"
          placeholder="Search by city name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="cities-filters">
          {["ALL", "ACTIVE", "INACTIVE"].map((item) => (
            <button
              type="button"
              key={item}
              className={`city-filter-btn ${filter === item ? "active" : ""}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="cities-placeholder">Loading cities...</div>
      ) : filteredCities.length === 0 ? (
        <div className="cities-placeholder">
          {cities.length === 0
            ? "No cities found."
            : "No cities match your search or filter."}
        </div>
      ) : (
        <div className="cities-table-container">
          <table className="cities-table">
            <thead>
              <tr>
                <th style={{ width: "70px" }}>ID</th>
                <th style={{ width: "80px" }}>Image</th>
                <th style={{ width: "160px" }}>City</th>
                <th>Description</th>
                <th style={{ width: "120px" }}>Status</th>
                <th style={{ width: "220px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCities.map((city) => (
                <tr key={city.id}>
                  <td>{city.id}</td>
                  <td>
                    {city.image ? (
                      <img
                        src={city.image}
                        alt={city.name}
                        className="city-table-thumb"
                      />
                    ) : (
                      <div className="city-table-thumb-placeholder">
                        <FaImage />
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="city-table-name">{city.name}</span>
                  </td>
                  <td>
                    <span className="city-table-desc">
                      {city.description || "—"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`city-status ${
                        city.status === "ACTIVE" ? "active" : "inactive"
                      }`}
                    >
                      {city.status}
                    </span>
                  </td>
                  <td>
                    <div className="cities-table-actions">
                      <button
                        type="button"
                        className="city-edit-btn"
                        onClick={() => handleEditCity(city)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={
                          city.status === "ACTIVE"
                            ? "city-deactivate-btn"
                            : "city-activate-btn"
                        }
                        onClick={() => promptStatusUpdate(city)}
                      >
                        {city.status === "ACTIVE"
                          ? "Make Inactive"
                          : "Make Active"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit City Modal */}
      {editingCity && (
        <div className="city-modal-overlay" onClick={handleCancelEdit} role="dialog" aria-modal="true">
          <div
            className="city-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="city-modal-header">
              <h2>Edit City: {editingCity.name}</h2>
              <button
                type="button"
                className="city-modal-close"
                onClick={handleCancelEdit}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateCity}>
              <div className="city-form-group">
                <label htmlFor="edit-name">City Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editCityName}
                  onChange={(e) => setEditCityName(e.target.value)}
                  required
                />
              </div>

              <div className="city-form-group">
                <label htmlFor="editCityImage">City Image</label>
                <input
                  id="editCityImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleEditCityImageChange}
                />
                {editCityImagePreview && (
                  <div className="city-image-preview">
                    <img src={editCityImagePreview} alt="City preview" />
                    <span>
                      {editCityImage ? editCityImage.name : "Current Image"}
                    </span>
                    {editCityImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditCityImage(null);
                          setEditCityImagePreview(editingCity.image || "");
                          const input = document.getElementById(
                            "editCityImage"
                          ) as HTMLInputElement | null;
                          if (input) input.value = "";
                        }}
                      >
                        Revert
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="city-form-group">
                <label htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  value={editCityDescription}
                  onChange={(e) => setEditCityDescription(e.target.value)}
                  rows={3}
                  placeholder="Enter city description"
                />
              </div>

              <div className="city-form-group">
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  value={editCityStatus}
                  onChange={(e) =>
                    setEditCityStatus(e.target.value as "ACTIVE" | "INACTIVE")
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="city-edit-actions">
                <button
                  type="button"
                  className="city-cancel-btn"
                  onClick={handleCancelEdit}
                  disabled={savingCity}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="city-save-btn"
                  disabled={savingCity}
                >
                  {savingCity ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Make Active / Make Inactive */}
      {statusConfirmCity && (
        <div
          className="city-modal-overlay"
          onClick={() => {
            if (!updatingStatus) setStatusConfirmCity(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="city-modal-content"
            style={{ padding: "10px 20px 20px 20px", maxWidth: "420px", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="city-modal-header" style={{ justifyContent: "center" }}>
              <h2>
                {statusConfirmCity.targetStatus === "INACTIVE"
                  ? "Deactivate City"
                  : "Activate City"}
              </h2>
            </div>

            <p style={{ margin: "1rem 0", color: "#475569", lineHeight: "1.5" }}>
              Are you sure you want to mark{" "}
              <strong>"{statusConfirmCity.city.name}"</strong> as{" "}
              <strong
                style={{
                  color:
                    statusConfirmCity.targetStatus === "ACTIVE"
                      ? "#15803d"
                      : "#b91c1c",
                }}
              >
                {statusConfirmCity.targetStatus}
              </strong>
              ?
              {statusConfirmCity.targetStatus === "INACTIVE"
                ? " Users and organisers will not be able to select or host events in this city while it is inactive."
                : " This city will immediately become selectable for users and event listings."}
            </p>

            <div className="city-edit-actions" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="city-cancel-btn"
                onClick={() => setStatusConfirmCity(null)}
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                className="city-save-btn"
                style={{
                  backgroundColor:
                    statusConfirmCity.targetStatus === "INACTIVE"
                      ? "#dc2626"
                      : "#16a34a",
                }}
                onClick={executeStatusUpdate}
                disabled={updatingStatus}
              >
                {updatingStatus
                  ? "Updating..."
                  : statusConfirmCity.targetStatus === "INACTIVE"
                  ? "Yes, Make Inactive"
                  : "Yes, Make Active"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cities;