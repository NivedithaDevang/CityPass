import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import {
  fetchOrganiserBookings,
  getOrganiserErrorMessage,
  type OrganiserBooking,
} from "../../../services/organiserService";
import "./OrganiserAttendees.css";

const PAGE_SIZE = 10;

const formatDate = (value: string) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const formatAmount = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const normaliseStatus = (status: string | null) =>
  (status || "UNKNOWN").toUpperCase();

interface FilterDropdownOption {
  value: string;
  label: string;
}

interface CustomFilterDropdownProps {
  label: string;
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
}

function CustomFilterDropdown({
  label,
  value,
  options,
  onChange,
}: CustomFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="org-custom-dropdown-container" ref={containerRef}>
      <span className="org-dropdown-label">{label}</span>

      <button
        type="button"
        className={`org-dropdown-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="org-dropdown-trigger-text">
          {selectedOption ? selectedOption.label : `Select ${label}`}
        </span>
        <ChevronDown
          size={15}
          className={`org-dropdown-chevron ${isOpen ? "rotate" : ""}`}
        />
      </button>

      {isOpen && (
        <ul className="org-dropdown-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={`org-dropdown-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="org-dropdown-item-text">{option.label}</span>
                {isSelected && (
                  <Check size={14} className="org-dropdown-check" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OrganiserAttendees() {
  const [bookings, setBookings] = useState<OrganiserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      setBookings(await fetchOrganiserBookings());
    } catch (loadError: unknown) {
      setError(
        getOrganiserErrorMessage(
          loadError,
          "Could not load bookings for your events."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetchOrganiserBookings()
      .then((data) => {
        if (active) setBookings(data);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            getOrganiserErrorMessage(
              loadError,
              "Could not load bookings for your events."
            )
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const eventDropdownOptions: FilterDropdownOption[] = useMemo(() => {
    const unique = new Map<number, string>();
    bookings.forEach((booking) =>
      unique.set(booking.event_id, booking.event_name)
    );

    const sortedEvents = [...unique.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, name]) => ({
        value: String(id),
        label: name,
      }));

    return [{ value: "ALL", label: "All events" }, ...sortedEvents];
  }, [bookings]);

  const statusDropdownOptions: FilterDropdownOption[] = useMemo(() => {
    const statuses = [
      ...new Set(
        bookings.map((booking) => normaliseStatus(booking.booking_status))
      ),
    ].sort();

    const formattedStatuses = statuses.map((status) => ({
      value: status,
      label: status.charAt(0) + status.slice(1).toLowerCase(),
    }));

    return [{ value: "ALL", label: "All statuses" }, ...formattedStatuses];
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return bookings.filter((booking) => {
      const matchesEvent =
        eventFilter === "ALL" || String(booking.event_id) === eventFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        normaliseStatus(booking.booking_status) === statusFilter;

      const matchesSearch =
        !query ||
        [
          booking.user_name,
          booking.user_email,
          booking.event_name,
          String(booking.booking_id),
        ].some((value) => value?.toLocaleLowerCase().includes(query));

      return matchesEvent && matchesStatus && matchesSearch;
    });
  }, [bookings, eventFilter, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));

  const pageBookings = filteredBookings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const totalTickets = filteredBookings.reduce(
    (sum, booking) => sum + Number(booking.number_of_tickets || 0),
    0
  );

  const totalAmount = filteredBookings.reduce(
    (sum, booking) => sum + Number(booking.total_amount || 0),
    0
  );

  const clearFilters = () => {
    setSearch("");
    setEventFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
  };

  return (
    <div className="organiser-attendees">
      <header className="org-page-heading org-attendees-heading">
        <div>
          <span className="org-eyebrow">GUEST MANAGEMENT</span>
          <h1>Bookings & attendees</h1>
          <p>Bookings for events owned by your organiser account.</p>
        </div>

        <div className="org-attendee-count">
          <Users size={17} />
          <span>{loading ? "—" : bookings.length}</span>
          <small>bookings</small>
        </div>
      </header>

      {error && (
        <div className="org-attendees-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => void loadBookings()}>Retry</button>
        </div>
      )}

      <section className="org-attendee-summary" aria-label="Booking summary">
        <div>
          <small>Bookings shown</small>
          <strong>{loading ? "—" : filteredBookings.length}</strong>
        </div>

        <div>
          <small>Tickets booked</small>
          <strong>{loading ? "—" : totalTickets}</strong>
        </div>

        <div>
          <small>Booking amount</small>
          <strong>{loading ? "—" : formatAmount(totalAmount)}</strong>
        </div>
      </section>

      <section className="org-attendee-panel">
        <div className="org-attendee-toolbar">
          <label className="org-attendee-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search attendee, email, event..."
              aria-label="Search attendees"
            />
          </label>

          <div className="org-attendee-filters">
            <CustomFilterDropdown
              label="Event"
              value={eventFilter}
              options={eventDropdownOptions}
              onChange={(val) => {
                setEventFilter(val);
                setPage(1);
              }}
            />

            <CustomFilterDropdown
              label="Status"
              value={statusFilter}
              options={statusDropdownOptions}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="org-attendees-state">
            <Loader2 size={25} className="org-attendees-spin" />
            <span>Loading attendee bookings...</span>
          </div>
        ) : !error && pageBookings.length === 0 ? (
          <div className="org-attendees-state org-attendees-empty">
            <Users size={32} />
            <strong>
              {bookings.length ? "No matching bookings" : "No bookings yet"}
            </strong>
            <span>
              {bookings.length
                ? "Adjust your search or filters."
                : "When guests book tickets to your events, they will appear here."}
            </span>
            {bookings.length > 0 && (
              <button onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        ) : (
          !error && (
            <>
              <div className="org-attendee-table-wrap">
                <table className="org-attendee-table">
                  <thead>
                    <tr>
                      <th>Attendee</th>
                      <th>Event</th>
                      <th>Tickets</th>
                      <th>Booked on</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageBookings.map((booking) => {
                      const status = normaliseStatus(booking.booking_status);

                      return (
                        <tr key={booking.booking_id}>
                          <td>
                            <div className="org-attendee-person">
                              <span>
                                {(
                                  booking.user_name ||
                                  booking.user_email ||
                                  "G"
                                )
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>

                              <div>
                                <strong>
                                  {booking.user_name || "Guest"}
                                </strong>
                                <small>
                                  {booking.user_email || "Email unavailable"}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="org-attendee-event">
                              <strong>{booking.event_name}</strong>
                            </div>
                          </td>

                          <td>{Number(booking.number_of_tickets || 0)}</td>

                          <td>
                            <span className="org-booking-date">
                              <CalendarDays size={13} />
                              {formatDate(booking.booking_date)}
                            </span>
                          </td>

                          <td className="org-booking-amount">
                            {formatAmount(booking.total_amount)}
                          </td>

                          <td>
                            <span
                              className={`org-booking-status ${status.toLowerCase()}`}
                            >
                              {status.charAt(0) + status.slice(1).toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 && (
                <footer className="org-attendee-pagination">
                  <span>
                    {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filteredBookings.length)} of{" "}
                    {filteredBookings.length}
                  </span>

                  <div>
                    <button
                      aria-label="Previous page"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft size={17} />
                    </button>

                    <span>
                      {page} / {pageCount}
                    </span>

                    <button
                      aria-label="Next page"
                      disabled={page === pageCount}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </footer>
              )}
            </>
          )
        )}
      </section>
    </div>
  );
}

export default OrganiserAttendees;