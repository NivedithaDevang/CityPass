import { useEffect, useMemo, useRef, useState } from "react";
import "./Users.css";
import {
  fetchAdminUserDetails,
  fetchAdminUsers,
} from "../../../services/adminService";
import { 
  FaEye, 
  FaTimes, 
  FaChevronDown, 
  FaChevronUp, 
  FaUsers, 
  FaTicketAlt, 
  FaMapMarkerAlt, 
  FaEnvelope,
  FaPhone,
  FaCheck
} from "react-icons/fa";

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
  last_deactivated?: string;
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
  original_tickets?: number;
  cancelled_tickets?: number;
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
    original_tickets?: number;
    cancelled_tickets?: number;
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

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  width?: string;
}

function CustomDropdown({ value, options, onChange, width }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div 
      className="users-custom-dropdown" 
      ref={dropdownRef} 
      style={{ width: width || "auto" }}
    >
      <button
        type="button"
        className={`users-dropdown-trigger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="users-dropdown-trigger-text">{selected?.label}</span>
        <FaChevronDown className={`users-dropdown-chevron ${isOpen ? "rotate" : ""}`} />
      </button>

      {isOpen && (
        <ul className="users-dropdown-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`users-dropdown-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="users-dropdown-item-label">{option.label}</span>
                {isSelected && <FaCheck className="users-dropdown-item-check" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const formatDateDisplay = (dateStr?: string | null): string => {
  if (!dateStr) return "—";

  if (dateStr.includes("T") || dateStr.includes("Z")) {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    }
  }

  const clean = dateStr.split(" ")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const localDate = new Date(year, month, day);

    if (!Number.isNaN(localDate.getTime())) {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(localDate);
    }
  }

  return dateStr;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
};

const formatMoney = (amount?: number | string) =>
  amount === undefined || amount === null
    ? "₹0"
    : `₹${Number(amount).toLocaleString("en-IN")}`;

function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("id_desc");

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [showAllBookings, setShowAllBookings] = useState(true);
  const [expandedEventAttendees, setExpandedEventAttendees] = useState<Record<number, boolean>>({});

  const toggleEventAttendees = (eventId: number) => {
    setExpandedEventAttendees((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  useEffect(() => {
    if (!selectedUser) {
      setShowAllBookings(true);
      setExpandedEventAttendees({});
      return;
    }

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

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAdminUsers();
      const list = Array.isArray(response)
        ? response
        : response?.users ?? response?.data?.users ?? response?.data ?? [];

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

  const openUserDetails = (user: AdminUser) => {
    setUserDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);
    setShowAllBookings(true);
    setExpandedEventAttendees({});
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

  const sortOptions: DropdownOption[] = [
    { value: "id_desc", label: "Sort: Newest (ID)" },
    { value: "id_asc", label: "Sort: Oldest (ID)" },
    { value: "name_asc", label: "Sort: Name (A–Z)" },
    { value: "name_desc", label: "Sort: Name (Z–A)" },
  ];

  const roleOptions: DropdownOption[] = useMemo(
    () => [{ value: "ALL", label: "All Roles" }, ...availableRoles.map((r) => ({ value: r, label: r }))],
    [availableRoles]
  );

  const cityOptions: DropdownOption[] = useMemo(
    () => [{ value: "ALL", label: "All Cities" }, ...availableCities.map((c) => ({ value: c, label: c }))],
    [availableCities]
  );

  const statusOptions: DropdownOption[] = [
    { value: "ALL", label: "All Status" },
    { value: "ACTIVE", label: "ACTIVE" },
    { value: "INACTIVE", label: "INACTIVE" },
  ];

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
      const nameA = (a.name || `${a.first_name || ""} ${a.last_name || ""}`).trim().toLowerCase();
      const nameB = (b.name || `${b.first_name || ""} ${b.last_name || ""}`).trim().toLowerCase();
      switch (sortBy) {
        case "id_desc":
          return Number(b.id) - Number(a.id);
        case "id_asc":
          return Number(a.id) - Number(b.id);
        case "name_asc":
          return nameA.localeCompare(nameB);
        case "name_desc":
          return nameB.localeCompare(nameA);
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
          <button type="button" onClick={() => setError(null)}>Dismiss</button>
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
          <CustomDropdown
            value={sortBy}
            options={sortOptions}
            onChange={(val) => setSortBy(val as SortOption)}
          />

          <CustomDropdown
            value={roleFilter}
            options={roleOptions}
            onChange={(val) => setRoleFilter(val)}
          />

          <CustomDropdown
            value={cityFilter}
            options={cityOptions}
            onChange={(val) => setCityFilter(val)}
          />

          <CustomDropdown
            value={statusFilter}
            options={statusOptions}
            onChange={(val) => setStatusFilter(val)}
          />

          <div className="users-count">
            {processedUsers.length} {processedUsers.length === 1 ? "User" : "Users"}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="users-placeholder">Loading users...</div>
      ) : processedUsers.length === 0 ? (
        <div className="users-placeholder">No users match your filters.</div>
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
                  user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "—";
                const status = user.status || user.account_status || "ACTIVE";

                return (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td><strong>{fullName}</strong></td>
                    <td>{user.email}</td>
                    <td>{user.phone || "—"}</td>
                    <td><span className="users-role">{user.role || "USER"}</span></td>
                    <td>{user.city_name || "—"}</td>
                    <td>
                      <span className={`users-status ${status.toLowerCase()}`}>
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

      {/* DETAILED USER MODAL */}
      {selectedUser && (
        <div className="user-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div
            className="user-modal-card user-details-modal"
            style={{ maxWidth: "800px", borderRadius: "14px", padding: "0" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div 
              style={{ 
                padding: "1.2rem 1.6rem", 
                borderBottom: "1px solid #e2e8f0", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                backgroundColor: "#f8fafc",
                borderRadius: "14px 14px 0 0"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                {userDetails?.profile_image ? (
                  <img
                    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                    src={userDetails.profile_image}
                    alt=""
                  />
                ) : (
                  <div 
                    style={{ 
                      width: "48px", 
                      height: "48px", 
                      borderRadius: "50%", 
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)", 
                      color: "#fff", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: "1.25rem", 
                      fontWeight: 700 
                    }}
                  >
                    {(userDetails?.name || selectedUser.name || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>
                    {userDetails?.name || selectedUser.name || "User Details"}
                  </h2>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>User ID: #{selectedUser.id}</span>
                    <span style={{ fontSize: "0.75rem", background: "#e2e8f0", padding: "1px 6px", borderRadius: "4px", color: "#334155", fontWeight: 600 }}>
                      {userDetails?.role || selectedUser.role || "USER"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "6px" }}
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div style={{ padding: "1.4rem 1.6rem", maxHeight: "78vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {detailsLoading ? (
                <div className="users-placeholder">Loading user records...</div>
              ) : detailsError ? (
                <div className="users-message users-error">{detailsError}</div>
              ) : userDetails ? (
                <>
                  {/* PROFILE DETAILS */}
                  <div>
                    <h3 style={{ fontSize: "0.9rem", color: "#475569", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Profile & Account
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem", background: "#f8fafc", padding: "1.1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Email Address</span>
                        <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaEnvelope size={12} color="#94a3b8" /> {userDetails.email}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Phone Number</span>
                        <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaPhone size={12} color="#94a3b8" /> {userDetails.phone || "—"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Account Status</span>
                        <div style={{ marginTop: "2px" }}>
                          <span className={`users-status ${(userDetails.status || "ACTIVE").toLowerCase()}`}>
                            {userDetails.status || "ACTIVE"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>City</span>
                        <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
                          {userDetails.city_name || "—"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Date of Birth</span>
                        <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
                          {formatDateDisplay(userDetails.dob)}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Gender</span>
                        <div style={{ fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
                          {userDetails.gender || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EVENT BOOKINGS SECTION */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "0.9rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Event Bookings ({userDetails.bookings.length})
                        </h3>
                      </div>

                      {userDetails.bookings.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllBookings((prev) => !prev)}
                          style={{
                            background: "#fff",
                            border: "1px solid #cbd5e1",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontWeight: 600,
                            color: "#334155"
                          }}
                        >
                          <FaTicketAlt size={10} />
                          {showAllBookings ? "Hide Bookings" : "View Bookings"}
                          {showAllBookings ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                        </button>
                      )}
                    </div>

                    {userDetails.bookings.length === 0 ? (
                      <div style={{ padding: "1.2rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "0.85rem" }}>
                        No bookings found for this user.
                      </div>
                    ) : showAllBookings ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {userDetails.bookings.map((booking) => {
                          const isFullyCancelled = booking.booking_status?.toUpperCase() === "CANCELLED";
                          const activeTickets = isFullyCancelled ? 0 : Number(booking.number_of_tickets ?? 0);
                          const originalTickets = Number(booking.original_tickets ?? booking.number_of_tickets ?? 1);
                          const cancelledTickets = Number(
                            booking.cancelled_tickets !== undefined
                              ? booking.cancelled_tickets
                              : isFullyCancelled
                                ? Number(booking.number_of_tickets ?? 1)
                                : Math.max(0, originalTickets - activeTickets)
                          );
                          const totalBooked = originalTickets;

                          return (
                            <div 
                              key={booking.booking_id}
                              style={{
                                background: isFullyCancelled ? "#fafafa" : "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                padding: "0.9rem 1.1rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.55rem"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                                <div>
                                  <strong style={{ fontSize: "1rem", color: isFullyCancelled ? "#64748b" : "#0f172a" }}>
                                    {booking.event_name || "Event unavailable"}
                                  </strong>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "1px" }}>
                                    Booking #{booking.booking_id} • {booking.ticket_name || "General Admission"}
                                  </div>
                                </div>

                                <span 
                                  style={{
                                    fontSize: "0.72rem",
                                    padding: "2px 8px",
                                    borderRadius: "999px",
                                    fontWeight: 700,
                                    background: isFullyCancelled ? "#fef2f2" : cancelledTickets > 0 ? "#fffbeb" : "#f0fdf4",
                                    color: isFullyCancelled ? "#dc2626" : cancelledTickets > 0 ? "#b45309" : "#16a34a",
                                    border: isFullyCancelled ? "1px solid #fecaca" : cancelledTickets > 0 ? "1px solid #fde68a" : "1px solid #bbf7d0"
                                  }}
                                >
                                  {isFullyCancelled ? "CANCELLED" : cancelledTickets > 0 ? "PARTIALLY CANCELLED" : booking.booking_status || "CONFIRMED"}
                                </span>
                              </div>

                              <div 
                                style={{ 
                                  display: "flex", 
                                  alignItems: "center", 
                                  flexWrap: "wrap", 
                                  gap: "12px", 
                                  background: "#f8fafc", 
                                  padding: "0.65rem 0.9rem", 
                                  borderRadius: "6px",
                                  fontSize: "0.82rem",
                                  border: "1px solid #f1f5f9"
                                }}
                              >
                                <div>
                                  <span style={{ color: "#64748b", marginRight: "4px" }}>Total Booked:</span>
                                  <strong>{totalBooked} {totalBooked === 1 ? "Ticket" : "Tickets"}</strong>
                                </div>

                                <div style={{ color: cancelledTickets > 0 ? "#b91c1c" : "#64748b" }}>
                                  <span style={{ marginRight: "4px" }}>Cancelled:</span>
                                  <strong style={{ background: cancelledTickets > 0 ? "#fee2e2" : "transparent", padding: cancelledTickets > 0 ? "1px 6px" : "0", borderRadius: "4px" }}>
                                    {cancelledTickets} {cancelledTickets === 1 ? "Ticket" : "Tickets"}
                                  </strong>
                                </div>

                                <div>
                                  <span style={{ color: "#64748b", marginRight: "4px" }}>Active / Remaining:</span>
                                  <strong style={{ color: activeTickets > 0 ? "#15803d" : "#94a3b8" }}>
                                    {activeTickets} {activeTickets === 1 ? "Ticket" : "Tickets"}
                                  </strong>
                                </div>

                                <div style={{ marginLeft: "auto" }}>
                                  <span style={{ color: "#64748b", marginRight: "4px" }}>Paid:</span>
                                  <strong style={{ color: "#0f172a" }}>{formatMoney(booking.total_amount)}</strong>
                                </div>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "0.4rem" }}>
                                <span><FaMapMarkerAlt size={10} /> {[booking.location, booking.city_name].filter(Boolean).join(", ") || "Venue TBA"}</span>
                                <span>Scheduled: {formatDateDisplay(booking.event_date)} {booking.event_time ? `• ${booking.event_time}` : ""}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  {/* ORGANISER SECTION (IF APPLICABLE) */}
                  {userDetails.organizer && (
                    <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "1.2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                        <h3 style={{ margin: 0, fontSize: "0.9rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Organiser Profile & Events
                        </h3>
                        <span style={{ fontSize: "0.72rem", background: "#fef3c7", color: "#92400e", padding: "2px 7px", borderRadius: "4px", fontWeight: 600 }}>
                          {userDetails.organizer.status || "ACTIVE"}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.65rem", background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "0.9rem", fontSize: "0.82rem" }}>
                        <div>
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>STAGE / BRAND NAME</span>
                          <div style={{ fontWeight: 600 }}>{userDetails.organizer.stage_name || "—"}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>CONTACT EMAIL</span>
                          <div style={{ fontWeight: 600 }}>{userDetails.organizer.email || "—"}</div>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.7rem", color: "#64748b" }}>APPROVED ON</span>
                          <div style={{ fontWeight: 600 }}>{formatDateTime(userDetails.organizer.approved_at)}</div>
                        </div>
                      </div>

                      {/* EVENTS & ATTENDEES */}
                      <h4 style={{ fontSize: "0.82rem", color: "#475569", margin: "0.8rem 0 0.5rem 0", textTransform: "uppercase" }}>
                        Created Events & Attendees
                      </h4>
                      {userDetails.organizer.events.length === 0 ? (
                        <div style={{ padding: "0.9rem", textAlign: "center", background: "#fafafa", borderRadius: "8px", color: "#64748b", fontSize: "0.82rem" }}>
                          No public events created.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                          {userDetails.organizer.events.map((event) => {
                            const isAttendeesOpen = Boolean(expandedEventAttendees[event.id]);
                            const attendeeCount = event.bookings?.length ?? 0;

                            return (
                              <div key={event.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.85rem 1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                                  <div>
                                    <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{event.name}</strong>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "1px" }}>
                                      {event.category_name} • {event.city_name} • {formatDateDisplay(event.event_date)}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => toggleEventAttendees(event.id)}
                                    style={{
                                      background: "#f1f5f9",
                                      border: "1px solid #cbd5e1",
                                      padding: "3px 9px",
                                      borderRadius: "6px",
                                      fontSize: "0.76rem",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      fontWeight: 600
                                    }}
                                  >
                                    <FaUsers size={11} />
                                    {isAttendeesOpen ? "Hide Attendees" : `View Attendees (${attendeeCount})`}
                                    {isAttendeesOpen ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                                  </button>
                                </div>

                                {isAttendeesOpen && (
                                  <div style={{ marginTop: "8px", borderTop: "1px dashed #cbd5e1", paddingTop: "8px" }}>
                                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                                      Booked Attendees ({attendeeCount}):
                                    </div>
                                    {event.bookings?.length ? (
                                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                        {event.bookings.map((booking) => (
                                          <div 
                                            key={booking.booking_id}
                                            style={{
                                              padding: "5px 8px",
                                              background: "#f8fafc",
                                              borderRadius: "6px",
                                              border: "1px solid #e2e8f0",
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              fontSize: "0.78rem"
                                            }}
                                          >
                                            <div>
                                              <strong>{booking.customer_name || "Customer"}</strong>{" "}
                                              <span style={{ color: "#64748b" }}>({booking.customer_email})</span>
                                              <div style={{ color: "#475569", fontSize: "0.73rem" }}>
                                                Tier: {booking.ticket_name} • {booking.number_of_tickets} Ticket(s) • Paid {formatMoney(booking.total_amount)}
                                              </div>
                                            </div>
                                            <span style={{ fontSize: "0.7rem", padding: "1px 5px", borderRadius: "4px", background: booking.booking_status === "CANCELLED" ? "#fee2e2" : "#dcfce7", color: booking.booking_status === "CANCELLED" ? "#b91c1c" : "#15803d", fontWeight: 600 }}>
                                              {booking.booking_status || "CONFIRMED"}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>No bookings registered for this event yet.</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </>
              ) : null}
            </div>

            {/* MODAL FOOTER */}
            <div style={{ padding: "0.85rem 1.6rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: "0 0 14px 14px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="users-reset-btn"
                onClick={() => setSelectedUser(null)}
                style={{ padding: "6px 16px", fontSize: "0.85rem" }}
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