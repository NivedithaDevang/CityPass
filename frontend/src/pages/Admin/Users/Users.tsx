import { useEffect, useMemo, useState } from "react";
import "./Users.css";
import {
  fetchAdminUserDetails,
  fetchAdminUsers,
} from "../../../services/adminService";
import { FaEye, FaTimes } from "react-icons/fa";

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
  city_id?: string;
  city_name?: string;
  dob?: string;
  gender?: string;
  created_at?: string | null;
  bookings?: string;
  last_deactivated?: string
}

interface AdminUserBooking {
  booking_id: number;
  event_id?: number;
  event_name?: string;
  event_slug?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  city_name?: string;
  category_name?: string;
  ticket_name?: string;
  number_of_tickets?: number;
  total_amount?: number | string;
  booking_date?: string;
  booking_status?: string;
  event_status?: string;
}

interface AdminOrganizerEvent {
  id: number;
  name: string;
  event_date?: string;
  status?: string;
  city_name?: string;
  category_name?: string;
  location?: string;
  booking_count?: number;
  confirmed_booking_count?: number;
  cancelled_booking_count?: number;
  bookings?: Array<{
    booking_id: number;
    customer_name?: string;
    customer_email?: string;
    booking_status?: string;
    booking_date?: string;
    ticket_name?: string;
    number_of_tickets?: number;
    total_amount?: number | string;
  }>;
}

interface AdminUserDetails extends Omit<AdminUser, "bookings" | "created_at"> {
  profile_image?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deactivated_at?: string | null;
  deactivation_reason?: string | null;
  bookings: AdminUserBooking[];
  booking_summary: {
    total: number;
    confirmed: number;
    cancelled: number;
  };
  organizer?: {
    id: number;
    stage_name?: string;
    email?: string;
    description?: string;
    status?: string;
    created_at?: string | null;
    deactivated_at?: string | null;
    approved_at?: string | null;
    request_history?: Array<{
      id: number;
      organization_name?: string;
      status?: string;
      created_at?: string | null;
      approved_at?: string | null;
      updated_at?: string | null;
      rejection_reason?: string | null;
      id_proof?: string;
      id_proof_file?: string | null;
    }>;
    event_summary: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      cancelled: number;
      completed: number;
    };
    events: AdminOrganizerEvent[];
  } | null;
}

type SortOption =
  | "id_desc"
  | "id_asc"
  | "name_asc"
  | "name_desc"
  | "role_asc"
  | "city_asc"
  | "status_asc";

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="user-modal-item">
      <span className="user-modal-label">{label}</span>
      <span className="user-modal-val">{value || "—"}</span>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("id_desc");

  // Selected User for View Modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUser) return;

    let cancelled = false;

    fetchAdminUserDetails(selectedUser.id)
      .then((details: AdminUserDetails) => {
        if (!cancelled) setUserDetails(details);
      })
      .catch((err: unknown) => {
        console.error("Failed to load user details:", err);
        if (!cancelled) {
          setDetailsError("Failed to load this user's details. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  const formatDateTime = (value?: string | null) => {
    if (!value) return "Not recorded";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date);
  };

  const formatEventDate = (value?: string) => {
    if (!value) return "Not specified";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
        }).format(date);
  };

  const formatMoney = (amount?: number | string) =>
    amount === undefined || amount === null
      ? "—"
      : `₹${Number(amount).toLocaleString("en-IN")}`;

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
    const load = async () => {
      await loadUsers();
    };
    void Promise.resolve().then(load);
  }, []);

  const openUserDetails = (user: AdminUser) => {
    setUserDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);
    setSelectedUser(user);
  };

  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    users.forEach((u) => {
      if (u.role) roles.add(u.role.trim().toUpperCase());
    });
    return Array.from(roles);
  }, [users]);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    users.forEach((u) => {
      if (u.city_name && u.city_name.trim() !== "—") {
        cities.add(u.city_name.trim());
      }
    });
    return Array.from(cities).sort();
  }, [users]);

  const processedUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = users.filter((user) => {
      const fullName = (
        user.name || `${user.first_name || ""} ${user.last_name || ""}`
      ).trim();
      const userRole = (user.role || "USER").trim().toUpperCase();
      const userStatus = (user.status || user.account_status || "ACTIVE")
        .trim()
        .toUpperCase();
      const userCity = (user.city_name || "").trim();

      const matchesSearch =
        !query ||
        fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phone || "").toLowerCase().includes(query) ||
        userRole.toLowerCase().includes(query) ||
        userCity.toLowerCase().includes(query);

      const matchesRole = roleFilter === "ALL" || userRole === roleFilter;
      const matchesCity =
        cityFilter === "ALL" ||
        userCity.toLowerCase() === cityFilter.toLowerCase();
      const matchesStatus =
        statusFilter === "ALL" || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesCity && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const nameA = (
        a.name || `${a.first_name || ""} ${a.last_name || ""}`
      )
        .trim()
        .toLowerCase();
      const nameB = (
        b.name || `${b.first_name || ""} ${b.last_name || ""}`
      )
        .trim()
        .toLowerCase();
      const roleA = (a.role || "USER").toLowerCase();
      const roleB = (b.role || "USER").toLowerCase();
      const cityA = (a.city_name || "").toLowerCase();
      const cityB = (b.city_name || "").toLowerCase();
      const statusA = (a.status || a.account_status || "").toLowerCase();
      const statusB = (b.status || b.account_status || "").toLowerCase();

      switch (sortBy) {
        case "id_desc":
          return Number(b.id) - Number(a.id);
        case "id_asc":
          return Number(a.id) - Number(b.id);
        case "name_asc":
          return nameA.localeCompare(nameB);
        case "name_desc":
          return nameB.localeCompare(nameA);
        case "role_asc":
          return roleA.localeCompare(roleB);
        case "city_asc":
          return cityA.localeCompare(cityB);
        case "status_asc":
          return statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });
  }, [users, search, roleFilter, cityFilter, statusFilter, sortBy]);

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

        <div className="users-filter-group">
          <select
            className="users-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort users"
          >
            <option value="id_desc">Sort: Newest (ID)</option>
            <option value="id_asc">Sort: Oldest (ID)</option>
            <option value="name_asc">Sort: Name (A–Z)</option>
            <option value="name_desc">Sort: Name (Z–A)</option>
            <option value="role_asc">Sort: Role</option>
            <option value="city_asc">Sort: City</option>
            <option value="status_asc">Sort: Status</option>
          </select>

          <select
            className="users-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="ALL">All Roles</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            className="users-filter-select"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            aria-label="Filter by city"
          >
            <option value="ALL">All Cities</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            className="users-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          {(roleFilter !== "ALL" ||
            cityFilter !== "ALL" ||
            statusFilter !== "ALL" ||
            search ||
            sortBy !== "id_desc") && (
            <button
              type="button"
              className="users-reset-btn"
              onClick={() => {
                setSearch("");
                setRoleFilter("ALL");
                setCityFilter("ALL");
                setStatusFilter("ALL");
                setSortBy("id_desc");
              }}
            >
              Reset
            </button>
          )}

          <div className="users-count">
            {processedUsers.length}{" "}
            {processedUsers.length === 1 ? "User" : "Users"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="users-placeholder">Loading users...</div>
      ) : processedUsers.length === 0 ? (
        <div className="users-placeholder">
          {users.length === 0 ? "No users found." : "No users match your filters."}
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
                <th style={{ textAlign: "center", width: "100px" }}>Details</th>
              </tr>
            </thead>

            <tbody>
              {processedUsers.map((user) => {
                const fullName =
                  user.name ||
                  `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                  "—";

                const status = user.status || user.account_status || "—";
                const city = user.city_name || "—";

                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "—"}</td>
                    <td>
                      <span className="users-role">{user.role || "USER"}</span>
                    </td>
                    <td>{city}</td>
                    <td>
                      <span
                        className={`users-status ${
                          String(status).toLowerCase() === "active"
                            ? "active"
                            : String(status).toLowerCase() === "inactive"
                            ? "inactive"
                            : "unknown"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="users-btn-view"
                        onClick={() => openUserDetails(user)}
                      >
                        <FaEye /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="user-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div
            className="user-modal-card user-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-modal-header">
              <div className="user-details-title">
                {userDetails?.profile_image ? (
                  <img
                    className="user-details-avatar"
                    src={userDetails.profile_image}
                    alt=""
                  />
                ) : (
                  <div className="user-details-avatar user-details-avatar-fallback">
                    {(userDetails?.name || selectedUser.name || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <h2>{userDetails?.name || selectedUser.name || "User Details"}</h2>
                  <span className="user-modal-id">
                    User ID: {selectedUser.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="user-modal-close"
                onClick={() => setSelectedUser(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="user-details-content">
              {detailsLoading ? (
                <div className="users-placeholder">Loading complete user history...</div>
              ) : detailsError ? (
                <div className="users-message users-error" role="alert">
                  {detailsError}
                </div>
              ) : userDetails ? (
                <>
                  <section className="user-details-section">
                    <h3>Profile & account</h3>
                    <div className="user-modal-grid">
                      <Detail label="Email address" value={userDetails.email} />
                      <Detail label="Phone number" value={userDetails.phone} />
                      <Detail label="Role" value={userDetails.role} />
                      <Detail label="Account status" value={userDetails.status} />
                      <Detail label="City" value={userDetails.city_name} />
                      <Detail label="Gender" value={userDetails.gender} />
                      <Detail label="Date of birth" value={userDetails.dob} />
                      <Detail label="Registered" value={formatDateTime(userDetails.created_at)} />
                      <Detail label="Last updated" value={formatDateTime(userDetails.updated_at)} />
                      <Detail label="Last deactivated" value={formatDateTime(userDetails.deactivated_at)} />
                      <Detail label="Deactivation reason" value={userDetails.deactivation_reason} />
                    </div>
                  </section>

                  <section className="user-details-section">
                    <div className="user-details-section-heading">
                      <h3>Event bookings</h3>
                      <span>
                        {userDetails.booking_summary.total} total ·{" "}
                        {userDetails.booking_summary.confirmed} confirmed ·{" "}
                        {userDetails.booking_summary.cancelled} cancelled
                      </span>
                    </div>
                    {userDetails.bookings.length === 0 ? (
                      <p className="user-details-empty">No bookings found.</p>
                    ) : (
                      <div className="user-details-record-list">
                        {userDetails.bookings.map((booking) => (
                          <article className="user-details-record" key={booking.booking_id}>
                            <div className="user-details-record-heading">
                              <strong>{booking.event_name || "Event unavailable"}</strong>
                              <span className={`user-details-status ${String(booking.booking_status || "").toLowerCase()}`}>
                                {booking.booking_status || "Unknown status"}
                              </span>
                            </div>
                            <div className="user-details-record-meta">
                              <span>Booking #{booking.booking_id}</span>
                              <span>{booking.ticket_name || "Ticket"} · {booking.number_of_tickets ?? 0} ticket(s)</span>
                              <span>{formatMoney(booking.total_amount)}</span>
                              <span>Booked {formatDateTime(booking.booking_date)}</span>
                              <span>Event {formatEventDate(booking.event_date)}{booking.event_time ? ` · ${booking.event_time}` : ""}</span>
                              <span>{[booking.location, booking.city_name].filter(Boolean).join(", ") || "Venue not specified"}</span>
                              {booking.event_status && <span>Event status: {booking.event_status}</span>}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  {userDetails.organizer && (
                    <section className="user-details-section">
                      <h3>Organiser account</h3>
                      <div className="user-modal-grid">
                        <Detail label="Stage name" value={userDetails.organizer.stage_name} />
                        <Detail label="Organiser email" value={userDetails.organizer.email} />
                        <Detail label="Organiser status" value={userDetails.organizer.status} />
                        <Detail label="Approved / organiser profile created" value={formatDateTime(userDetails.organizer.approved_at)} />
                        <Detail label="Organiser deactivated" value={formatDateTime(userDetails.organizer.deactivated_at)} />
                        <Detail label="Description" value={userDetails.organizer.description} />
                      </div>

                      <div className="user-details-summary">
                        {Object.entries(userDetails.organizer.event_summary).map(([label, value]) => (
                          <div key={label}>
                            <strong>{value}</strong>
                            <span>{label} events</span>
                          </div>
                        ))}
                      </div>

                      <h4>Organiser request history</h4>
                      {userDetails.organizer.request_history?.length ? (
                        <div className="user-details-record-list">
                          {userDetails.organizer.request_history.map((request) => (
                            <article className="user-details-record" key={request.id}>
                              <div className="user-details-record-heading">
                                <strong>{request.organization_name || "Organiser application"} · #{request.id}</strong>
                                <span className={`user-details-status ${String(request.status || "").toLowerCase()}`}>
                                  {request.status || "Unknown status"}
                                </span>
                              </div>
                              <div className="user-details-record-meta">
                                <span>Submitted {formatDateTime(request.created_at)}</span>
                                {request.approved_at && <span>Approved {formatDateTime(request.approved_at)}</span>}
                                {request.updated_at && <span>Updated {formatDateTime(request.updated_at)}</span>}
                                {request.rejection_reason && <span>Rejection reason: {request.rejection_reason}</span>}
                                {request.id_proof && <span>ID proof: {request.id_proof}</span>}
                                {request.id_proof_file && (
                                  <a href={request.id_proof_file} target="_blank" rel="noreferrer">
                                    View submitted ID document
                                  </a>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="user-details-empty">No organiser application history found.</p>
                      )}

                      <h4>Events & attendee bookings</h4>
                      {userDetails.organizer.events.length === 0 ? (
                        <p className="user-details-empty">No events created.</p>
                      ) : (
                        <div className="user-details-record-list">
                          {userDetails.organizer.events.map((event) => (
                            <article className="user-details-record" key={event.id}>
                              <div className="user-details-record-heading">
                                <strong>{event.name || "Untitled event"}</strong>
                                <span className={`user-details-status ${String(event.status || "").toLowerCase()}`}>
                                  {event.status || "Unknown status"}
                                </span>
                              </div>
                              <div className="user-details-record-meta">
                                <span>Event #{event.id}</span>
                                <span>{event.category_name || "Category not specified"} · {event.city_name || "City not specified"}</span>
                                <span>{event.location || "Venue not specified"}</span>
                                <span>Date: {formatEventDate(event.event_date)}</span>
                                <span>{event.booking_count ?? 0} bookings · {event.confirmed_booking_count ?? 0} confirmed · {event.cancelled_booking_count ?? 0} cancelled</span>
                              </div>
                              {event.bookings?.length ? (
                                <div className="user-details-attendees">
                                  {event.bookings.map((booking) => (
                                    <div key={booking.booking_id}>
                                      <span>{booking.customer_name || "Customer"} ({booking.customer_email || "No email"})</span>
                                      <span>{booking.booking_status || "Unknown"} · {booking.ticket_name || "Ticket"} · {booking.number_of_tickets ?? 0} ticket(s) · {formatMoney(booking.total_amount)}</span>
                                      <span>{formatDateTime(booking.booking_date)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="user-details-empty">No bookings for this event yet.</p>
                              )}
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  )}
                </>
              ) : null}
            </div>

            <div className="user-modal-footer">
              <button
                type="button"
                className="users-reset-btn"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;