import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import "./Cities.css";

import {
  fetchAdminCities,
  updateCityStatus,
  updateCity,
  addCity,
} from "../../../services/adminService";

interface AdminCity {
  id: number;
  name: string;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
  is_active?: boolean | number;
}

interface CityApiResponse {
  id: number;
  name: string;
  description?: string | null;
  status?: string;
  is_active?: boolean | number;
}

const getCityStatus = (
  city: CityApiResponse
): "ACTIVE" | "INACTIVE" => {
  if (
    city.status !== undefined &&
    city.status !== null
  ) {
    return String(city.status).toUpperCase() === "ACTIVE"
      ? "ACTIVE"
      : "INACTIVE";
  }

  return city.is_active === true ||
    Number(city.is_active) === 1
    ? "ACTIVE"
    : "INACTIVE";
};

function Cities() {
  const [cities, setCities] = useState<AdminCity[]>([]);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [addingCity, setAddingCity] = useState(false);

  const [savingCity, setSavingCity] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);

  const [editingCityId, setEditingCityId] = useState<number | null>(null);

  const [cityName, setCityName] = useState("");

  const [cityDescription, setCityDescription] = useState("");

  const [editCityName, setEditCityName] = useState("");

  const [editCityDescription, setEditCityDescription] = useState("");

  const [editCityStatus, setEditCityStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("ALL");

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

      if (!Array.isArray(list)) {
        throw new Error(
          "Invalid cities response"
        );
      }

      const formattedCities: AdminCity[] =
        list.map(
          (city: CityApiResponse) => ({
            ...city,
            status: getCityStatus(city),
          })
        );

      setCities(formattedCities);
    } catch (err) {
      console.error(
        "Failed to fetch cities:",
        err
      );

      setError(
        "Failed to load cities. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCities();
  }, []);

  const filteredCities = useMemo(() => {
    return cities.filter((city) => {
      const query =
        search.trim().toLowerCase();

      const matchesSearch =
        city.name
          .toLowerCase()
          .includes(query) ||
        (city.description || "")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "ALL" ||
        city.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [cities, search, filter]);

  const handleStatusUpdate = async (
    cityId: number,
    status: "ACTIVE" | "INACTIVE"
  ) => {
    try {
      setActionLoading(cityId);
      setError(null);
      setSuccess(null);

      await updateCityStatus(
        cityId,
        status
      );

      setCities((previous) =>
        previous.map((city) =>
          city.id === cityId
            ? {
                ...city,
                status,
                is_active:
                  status === "ACTIVE"
                    ? 1
                    : 0,
              }
            : city
        )
      );

      setSuccess(
        `City ${
          status === "ACTIVE"
            ? "activated"
            : "deactivated"
        } successfully.`
      );
    } catch (err) {
      console.error(
        "Failed to update city status:",
        err
      );

      setError(
        "Failed to update city status. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCity = (
    city: AdminCity
  ) => {
    setEditingCityId(city.id);

    setEditCityName(city.name);

    setEditCityDescription(
      city.description || ""
    );

    setEditCityStatus(city.status);

    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingCityId(null);

    setEditCityName("");
    setEditCityDescription("");
    setEditCityStatus("ACTIVE");

    setError(null);
  };
  const handleUpdateCity = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (editingCityId === null) {
      return;
    }

    if (!editCityName.trim()) {
      setError(
        "City name is required."
      );
      return;
    }

    try {
      setSavingCity(true);
      setError(null);
      setSuccess(null);

      await updateCity(
        editingCityId,
        {
          name: editCityName.trim(),
          description:
            editCityDescription.trim(),
          is_active:
            editCityStatus === "ACTIVE",
        }
      );

      setCities((previous) =>
        previous.map((city) =>
          city.id === editingCityId
            ? {
                ...city,
                name:
                  editCityName.trim(),

                description:
                  editCityDescription.trim(),

                status:
                  editCityStatus,

                is_active:
                  editCityStatus === "ACTIVE"
                    ? 1
                    : 0,
              }
            : city
        )
      );

      handleCancelEdit();

      setSuccess(
        "City updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update city:",
        err
      );

      setError(
        "Failed to update city. Please try again."
      );
    } finally {
      setSavingCity(false);
    }
  };

  const handleAddCity = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!cityName.trim()) {
      setError(
        "City name is required."
      );
      return;
    }

    try {
      setAddingCity(true);
      setError(null);
      setSuccess(null);

      await addCity(
        cityName.trim(),
        cityDescription.trim()
      );

      setCityName("");
      setCityDescription("");

      setShowAddForm(false);

      await loadCities();

      setSuccess(
        "City added successfully and set to ACTIVE."
      );
    } catch (err) {
      console.error(
        "Failed to add city:",
        err
      );

      setError(
        "Failed to add city. Please check the details and try again."
      );
    } finally {
      setAddingCity(false);
    }
  };

  return (
    <div className="cities-container">
      <div className="cities-header">

        <div>
          <span className="cities-subtitle">
            LOCATION MANAGEMENT
          </span>

          <h1>Cities</h1>

          <p>
            Manage cities available on
            CityPass.
          </p>
        </div>

        <button
          type="button"
          className="add-city-btn"
          onClick={() => {
            setShowAddForm(
              (previous) => !previous
            );

            setError(null);
            setSuccess(null);
          }}
        >
          {showAddForm
            ? "Cancel"
            : "+ Add City"}
        </button>

      </div>

      {error && (
        <div className="cities-message cities-error">

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError(null)
            }
          >
            Dismiss
          </button>

        </div>
      )}

      {success && (
        <div className="cities-message cities-success">

          <span>{success}</span>

          <button
            type="button"
            onClick={() =>
              setSuccess(null)
            }
          >
            Dismiss
          </button>

        </div>
      )}

      {showAddForm && (
        <form
          className="city-form"
          onSubmit={handleAddCity}
        >

          <h2>Add New City</h2>

          <div className="city-form-group">

            <label htmlFor="cityName">
              City Name
            </label>

            <input
              id="cityName"
              type="text"
              placeholder="Enter city name"
              value={cityName}
              onChange={(e) =>
                setCityName(
                  e.target.value
                )
              }
              required
            />

          </div>

          <div className="city-form-group">

            <label htmlFor="cityDescription">
              Description
            </label>

            <textarea
              id="cityDescription"
              placeholder="Enter city description"
              value={cityDescription}
              onChange={(e) =>
                setCityDescription(
                  e.target.value
                )
              }
              rows={3}
            />

          </div>

          <div className="city-form-group">

            <label>
              Status
            </label>

            <input
              type="text"
              value="ACTIVE"
              disabled
            />

          </div>

          <button
            type="submit"
            className="add-city-btn"
            disabled={addingCity}
          >
            {addingCity
              ? "Adding City..."
              : "Add City"}
          </button>

        </form>
      )}
      <div className="cities-toolbar">

        <input
          type="text"
          className="cities-search"
          placeholder="Search by city name or description..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <div className="cities-filters">

          {[
            "ALL",
            "ACTIVE",
            "INACTIVE",
          ].map((item) => (

            <button
              type="button"
              key={item}
              className={`city-filter-btn ${
                filter === item
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setFilter(item)
              }
            >
              {item}
            </button>

          ))}

        </div>

      </div>

      {loading ? (

        <div className="cities-placeholder">
          Loading cities...
        </div>

      ) : filteredCities.length === 0 ? (

        <div className="cities-placeholder">

          {cities.length === 0
            ? "No cities found."
            : "No cities match your search or filter."}

        </div>

      ) : (

        <div className="cities-grid">

          {filteredCities.map(
            (city) => (

              <article
                className="city-card"
                key={city.id}
              >
                {editingCityId ===
                city.id ? (

                  <form
                    className="city-edit-form"
                    onSubmit={
                      handleUpdateCity
                    }
                  >

                    <div className="city-card-header">

                      <h3>
                        Edit City
                      </h3>

                      <span
                        className={`city-status ${
                          editCityStatus ===
                          "ACTIVE"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {editCityStatus}
                      </span>

                    </div>

                    <div className="city-edit-group">

                      <label
                        htmlFor={`edit-name-${city.id}`}
                      >
                        City Name
                      </label>

                      <input
                        id={`edit-name-${city.id}`}
                        type="text"
                        value={
                          editCityName
                        }
                        onChange={(e) =>
                          setEditCityName(
                            e.target.value
                          )
                        }
                        required
                      />

                    </div>

                    <div className="city-edit-group">

                      <label
                        htmlFor={`edit-description-${city.id}`}
                      >
                        Description
                      </label>

                      <textarea
                        id={`edit-description-${city.id}`}
                        value={
                          editCityDescription
                        }
                        onChange={(e) =>
                          setEditCityDescription(
                            e.target.value
                          )
                        }
                        rows={4}
                        placeholder="Enter city description"
                      />

                    </div>

                    <div className="city-edit-group">

                      <label
                        htmlFor={`edit-status-${city.id}`}
                      >
                        Status
                      </label>

                      <select
                        id={`edit-status-${city.id}`}
                        value={
                          editCityStatus
                        }
                        onChange={(e) =>
                          setEditCityStatus(
                            e.target.value as
                              | "ACTIVE"
                              | "INACTIVE"
                          )
                        }
                      >

                        <option value="ACTIVE">
                          ACTIVE
                        </option>

                        <option value="INACTIVE">
                          INACTIVE
                        </option>

                      </select>

                    </div>

                    <div className="city-edit-actions">

                      <button
                        type="button"
                        className="city-cancel-btn"
                        onClick={
                          handleCancelEdit
                        }
                        disabled={
                          savingCity
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="city-save-btn"
                        disabled={
                          savingCity
                        }
                      >
                        {savingCity
                          ? "Saving..."
                          : "Save Changes"}
                      </button>

                    </div>

                  </form>

                ) : (

                  <>

                    <div className="city-card-header">

                      <div>
                        <h3>
                          {city.name}
                        </h3>
                      </div>

                      <span
                        className={`city-status ${
                          city.status ===
                          "ACTIVE"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {city.status}
                      </span>

                    </div>

                    <p className="city-description">

                      {city.description ||
                        "No description provided."}

                    </p>

                    <div className="city-card-footer">

                      <button
                        type="button"
                        className="city-edit-btn"
                        onClick={() =>
                          handleEditCity(
                            city
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className={
                          city.status ===
                          "ACTIVE"
                            ? "city-deactivate-btn"
                            : "city-activate-btn"
                        }
                        disabled={
                          actionLoading ===
                          city.id
                        }
                        onClick={() =>
                          handleStatusUpdate(
                            city.id,
                            city.status ===
                              "ACTIVE"
                              ? "INACTIVE"
                              : "ACTIVE"
                          )
                        }
                      >
                        {actionLoading ===
                        city.id
                          ? "Updating..."
                          : city.status ===
                            "ACTIVE"
                          ? "Make Inactive"
                          : "Make Active"}
                      </button>

                    </div>

                  </>

                )}

              </article>

            )
          )}

        </div>

      )}

    </div>
  );
}

export default Cities;