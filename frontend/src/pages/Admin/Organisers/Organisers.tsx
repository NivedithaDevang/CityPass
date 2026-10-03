
import { useEffect, useMemo, useState } from "react";
import "./Organisers.css";
import { fetchAdminOrganisers } from "../../../services/adminService";
interface AdminOrganisers {
  id: number;
  organization_name?: string;
  email: string;
  description: string;
  city?: string;
  city_name?: string;
}

function Organisers() {
  const [organisers, setOrganisers] = useState<AdminOrganisers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadOrganisers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAdminOrganisers();

      const list = Array.isArray(response)
        ? response
        : response?.organisers ??
          response?.data?.organisers ??
          response?.data ??
          [];

      if (!Array.isArray(list)) {
        throw new Error("Invalid organisers response");
      }

      setOrganisers(list);
    } catch (err) {
      console.error("Failed to fetch organisers:", err);
      setError("Failed to load organisers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrganisers();
  }, []);

  const filteredOrganisers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return organisers;
    }

    return organisers.filter((organiser) => {
      const fullName =
        organiser.organization_name?.trim();

      return (
        fullName?.toLowerCase().includes(query) ||
        organiser.email.toLowerCase().includes(query) ||
        (organiser.description || "").toLowerCase().includes(query) ||
        (organiser.city || organiser.city_name || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [organisers, search]);

  return (
    <div className="organisers-container">
      <div className="organisers-header">
        <div>
          <span className="organisers-subtitle">ORGANISER MANAGEMENT</span>
          <h1>Organisers</h1>
          <p>View all registered organisers on CityPass.</p>
        </div>
      </div>

      {error && (
        <div className="organisers-message organisers-error">
          <span>{error}</span>

          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="organisers-toolbar">
        <input
          type="text"
          className="organisers-search"
          placeholder="Search by name, email, phone, role or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="organisers-count">
          {filteredOrganisers.length}{" "}
          {filteredOrganisers.length === 1 ? "Organiser" : "Organisers"}
        </div>
      </div>

      {loading ? (
        <div className="organisers-placeholder">
          Loading organisers...
        </div>
      ) : filteredOrganisers.length === 0 ? (
        <div className="organisers-placeholder">
          {organisers.length === 0
            ? "No organisers found."
            : "No organisers match your search."}
        </div>
      ) : (
        <div className="organisers-table-container">
          <table className="organisers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Description</th>
                <th>City</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrganisers.map((organiser) => {
                const fullName =
                  organiser.organization_name?.trim() ||
                  "—";

                const city =
                  organiser.city ||
                  organiser.city_name ||
                  "—";

                return (
                  <tr key={organiser.id}>
                    <td>{organiser.id}</td>
                    <td>{fullName}</td>
                    <td>{organiser.email}</td>
                    <td>
                      <span className="organisers-description">
                        {organiser.description || "No description provided"}
                      </span>
                    </td>
                    <td>{city}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Organisers;

