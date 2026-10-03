
import { useEffect, useMemo, useState } from "react";
import "./Users.css";
import { fetchAdminUsers } from "../../../services/adminService";
interface AdminUser {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
  account_status?: string;
  city?: string;
  city_name?: string;
}

function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAdminUsers();

      const list = Array.isArray(response)
        ? response
        : response?.users ??
          response?.data?.users ??
          response?.data ??
          [];

      if (!Array.isArray(list)) {
        throw new Error("Invalid users response");
      }

      setUsers(list);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const fullName =
        user.name ||
        `${user.first_name || ""} ${user.last_name || ""}`.trim();

      return (
        fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone || "").toLowerCase().includes(query) ||
        (user.role || "").toLowerCase().includes(query) ||
        (user.city || user.city_name || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [users, search]);

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <span className="users-subtitle">USER MANAGEMENT</span>
          <h1>Users</h1>
          <p>View all registered users on CityPass.</p>
        </div>
      </div>

      {error && (
        <div className="users-message users-error">
          <span>{error}</span>

          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="users-toolbar">
        <input
          type="text"
          className="users-search"
          placeholder="Search by name, email, phone, role or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="users-count">
          {filteredUsers.length}{" "}
          {filteredUsers.length === 1 ? "User" : "Users"}
        </div>
      </div>

      {loading ? (
        <div className="users-placeholder">
          Loading users...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="users-placeholder">
          {users.length === 0
            ? "No users found."
            : "No users match your search."}
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>City</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => {
                const fullName =
                  user.name ||
                  `${user.first_name || ""} ${
                    user.last_name || ""
                  }`.trim() ||
                  "—";

                const status =
                  user.status ||
                  user.account_status ||
                  "—";

                const city =
                  user.city ||
                  user.city_name ||
                  "—";

                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "—"}</td>
                    <td>
                      <span className="users-role">
                        {user.role || "USER"}
                      </span>
                    </td>
                    <td>{city}</td>
                    <td>
                      <span
                        className={`users-status ${
                          String(status).toLowerCase() ===
                          "active"
                            ? "active"
                            : String(status).toLowerCase() ===
                              "inactive"
                            ? "inactive"
                            : "unknown"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
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

export default Users;

