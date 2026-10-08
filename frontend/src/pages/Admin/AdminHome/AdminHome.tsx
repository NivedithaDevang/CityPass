import { useEffect, useState } from "react";

import { HiUsers } from "react-icons/hi";
import {
  FaCalendarDay,
  FaClock,
  FaUsers,
  FaMapPin,
} from "react-icons/fa";
import { PiTagChevronFill } from "react-icons/pi";

import {
  fetchAdminUsers,
  fetchAdminEvents,
  fetchAdminOrganiserRequests,
  fetchAdminOrganisers,
  fetchAdminCities,
  fetchAdminCategories,
  updateEventStatus,
} from "../../../services/adminService";

import "./AdminHome.css";

interface OrgRequest {
  id: number;
  organization_name: string;
  description: string;
  status: string;
  city_name?: string;
}

interface EventItem {
  id: number;
  name: string;
  status: string;
  price: number;
}

function AdminHome() {
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrganisers, setTotalOrganisers] = useState(0);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [requests, setRequests] = useState<OrgRequest[]>([]);

  const [citiesCount, setCitiesCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [actionLoading, setActionLoading] =
    useState<number | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setActionError(null);

      const [
        usersRes,
        organisersRes,
        eventsRes,
        reqRes,
        citiesRes,
        categoriesRes,
      ] = await Promise.allSettled([
        fetchAdminUsers(),
        fetchAdminOrganisers(),
        fetchAdminEvents(),
        fetchAdminOrganiserRequests(),
        fetchAdminCities(),
        fetchAdminCategories(),
      ]);

      // Users
      if (usersRes.status === "fulfilled") {
        setTotalUsers(
          Array.isArray(usersRes.value.users)
            ? usersRes.value.users.length
            : 0
        );
      }

      // Organisers
      if (organisersRes.status === "fulfilled") {
        setTotalOrganisers(
          Array.isArray(organisersRes.value.organisers)
            ? organisersRes.value.organisers.length
            : 0
        );
      }

      // Events
      if (eventsRes.status === "fulfilled") {
        setEvents(
          Array.isArray(eventsRes.value.events)
            ? eventsRes.value.events
            : []
        );
      }

      // Organiser requests
      if (reqRes.status === "fulfilled") {
        setRequests(
          Array.isArray(reqRes.value.requests)
            ? reqRes.value.requests
            : []
        );
      } else {
        console.error(
          "Failed to load organiser requests:",
          reqRes.reason
        );
      }

      // Cities
      if (citiesRes.status === "fulfilled") {
        setCitiesCount(
          Array.isArray(citiesRes.value.cities)
            ? citiesRes.value.cities.length
            : 0
        );
      }

      // Categories
      if (categoriesRes.status === "fulfilled") {
        setCategoriesCount(
          Array.isArray(categoriesRes.value.categories)
            ? categoriesRes.value.categories.length
            : 0
        );
      }
    } catch (error) {
      console.error(
        "Dashboard fetch error:",
        error
      );

      setActionError(
        "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const handleEventApproval = async (
    eventId: number
  ) => {
    try {
      setActionError(null);
      setActionLoading(eventId);

      await updateEventStatus(
        eventId,
        "APPROVED"
      );

      setEvents((previous) =>
        previous.map((event) =>
          event.id === eventId
            ? {
                ...event,
                status: "APPROVED",
              }
            : event
        )
      );
    } catch (error) {
      console.error(
        "Event approval error:",
        error
      );

      setActionError(
        "Failed to approve event. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };


  const pendingEvents = events.filter(
    (event) =>
      event.status?.toUpperCase() === "PENDING"
  );

  const pendingRequests = requests.filter(
    (request) =>
      request.status?.toUpperCase() === "PENDING"
  );


  return (
    <>

      {actionError && (
        <div
          className="cmd-error-banner"
          role="alert"
        >
          {actionError}

          <button
            type="button"
            onClick={() =>
              setActionError(null)
            }
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="header-card">
        <div>
          <span className="badge">
            PLATFORM OVERVIEW
          </span>

          <h2 className="title">
            SuperAdmin Command Center
          </h2>

          <p className="subtitle">
            Monitor users, event approvals,
            organizer applications, and active
            cities across CityPass.
          </p>
        </div>

        <button
          type="button"
          className="btn-refresh"
          onClick={loadDashboardData}
          disabled={
            loading ||
            actionLoading !== null
          }
        >
          {loading
            ? "Refreshing..."
            : "Refresh Dashboard"}
        </button>
      </div>

      <div className="stats-grid">

        {/* Users */}
        <div className="stat-card">
          <div className="stat-header">
            <span>TOTAL USERS</span>

            <span>
              <HiUsers className="stat-icon" />
            </span>
          </div>

          <div className="stat-value">
            {totalUsers}
          </div>

          <div className="stat-subtext">
            Registered accounts
          </div>
        </div>

        {/* Organisers */}
        <div className="stat-card">
          <div className="stat-header">
            <span>TOTAL ORGANISERS</span>

            <span>
              <HiUsers className="stat-icon" />
            </span>
          </div>

          <div className="stat-value">
            {totalOrganisers}
          </div>

          <div className="stat-subtext">
            Registered organisers
          </div>
        </div>

        {/* Pending Events */}
        <div className="stat-card">
          <div className="stat-header">
            <span>PENDING EVENTS</span>

            <span>
              <FaClock className="stat-icon" />
            </span>
          </div>

          <div className="stat-value">
            {pendingEvents.length}
          </div>

          <div className="stat-subtext">
            Awaiting review
          </div>
        </div>

        {/* Host Requests */}
        <div className="stat-card">
          <div className="stat-header">
            <span>HOST REQUESTS</span>

            <span>
              <FaUsers className="stat-icon" />
            </span>
          </div>

          <div className="stat-value">
            {pendingRequests.length}
          </div>

          <div className="stat-subtext">
            Awaiting organizer approval
          </div>
        </div>

        {/* Cities */}
        <div className="stat-card">
          <div className="stat-header">
            <span>CITIES</span>

            <span>
              <FaMapPin className="stat-icon" />
            </span>
          </div>

          <div className="stat-value">
            {citiesCount}
          </div>

          <div className="stat-subtext">
            Configured cities
          </div>
        </div>

        {/* Categories */}
        <div className="stat-card">
          <div className="stat-header">
            <span>CATEGORIES</span>

            <span>
              <PiTagChevronFill className="stat-icon" />
            </span>
          </div>

          <div className="stat-value">
            {categoriesCount}
          </div>

          <div className="stat-subtext">
            Configured categories
          </div>
        </div>

      </div>

      <div className="queues-grid">
        <div className="queue-card">

          <div className="card-head">
            <div>
              <h3 className="queue-title">
                Pending Event Submissions
              </h3>

              <p className="queue-desc">
                Review organizer event listings
              </p>
            </div>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="queue-empty-state">

              <span className="empty-icon">
                <FaCalendarDay className="tat-icon" />
              </span>

              <p>
                No pending events to review.
              </p>

            </div>
          ) : (
            <div className="queue-items-list">

              {pendingEvents.map((event) => (
                <div
                  key={event.id}
                  className="org-request-item"
                >

                  <div>
                    <div className="org-applicant-name">
                      {event.name}
                    </div>

                    <div className="org-applicant-note">
                      Price: ₹
                      {Number(
                        event.price || 0
                      ).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-promote"
                    onClick={() =>
                      handleEventApproval(
                        event.id
                      )
                    }
                    disabled={
                      actionLoading !== null
                    }
                  >
                    {actionLoading === event.id
                      ? "Approving..."
                      : "Approve Event"}
                  </button>

                </div>
              ))}

            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default AdminHome;