import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

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

import Cities from "../Cities/Cities";
import Categories from "../Categories/Categories";
import Users from "../Users/Users";
import Events from "../Events/Events";
import Organisers from "../Organisers/Organisers";
import OrganiserRequests from "../OrganiserRequests/OrganiserRequests";
import Tickets from "../Tickets/Tickets";

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
  const { section } = useParams<{ section?: string }>();

  if (section === "cities") {
    return <Cities />;
  }

  if (section === "categories") {
    return <Categories />;
  }

  if (section === "users") {
    return <Users />;
  }

  if (section === "events") {
    return <Events />;
  }

  if (section === "organisers") {
    return <Organisers />;
  }

  if (section === "organiser-requests") {
    return <OrganiserRequests />;
  }

  if (section === "tickets") {
    return <Tickets />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);

  const [events, setEvents] = useState<EventItem[]>([]);

  const [requests, setRequests] = useState<OrgRequest[]>([]);

  const [citiesCount, setCitiesCount] = useState(0);

  const [categoriesCount, setCategoriesCount] = useState(0);

  const [actionError, setActionError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [totalOrganisers, setTotalOrganisers] = useState(0);

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

      if (usersRes.status === "fulfilled") {
        setTotalUsers(
          Array.isArray(usersRes.value.users)
            ? usersRes.value.users.length
            : 0
        );
      }

      if (organisersRes.status === "fulfilled") {
        setTotalOrganisers(
          Array.isArray(organisersRes.value.organisers)
            ? organisersRes.value.organisers.length
            : 0
        );
      }

      if (eventsRes.status === "fulfilled") {
        setEvents(
          Array.isArray(eventsRes.value.events)
            ? eventsRes.value.events
            : []
        );
      }

      if (reqRes.status === "fulfilled") {
        setRequests(
          Array.isArray(reqRes.value.requests)
            ? reqRes.value.requests
            : []
        );
      } else {
        console.error(
          "Failed to load requests:",
          reqRes.reason
        );
      }
      if (citiesRes.status === "fulfilled") {
        setCitiesCount(
          Array.isArray(citiesRes.value.cities)
            ? citiesRes.value.cities.length
            : 0
        );
      }

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

      <div className="cmd-header-card">
        <div>
          <span className="cmd-badge">
            PLATFORM OVERVIEW
          </span>

          <h2 className="cmd-title">
            SuperAdmin Command Center
          </h2>

          <p className="cmd-subtitle">
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
          Refresh Dashboard
        </button>
      </div>
      <div className="cmd-stats-grid">

        <div className="cmd-stat-card">
          <div className="cmd-stat-header">
            <span>TOTAL USERS</span>

            <span>
              <HiUsers className="cmd-stat-icon" />
            </span>
          </div>

          <div className="cmd-stat-value">
            {totalUsers}
          </div>

          <div className="cmd-stat-subtext">
            Registered accounts
          </div>
        </div>

        <div className="cmd-stat-card">
          <div className="cmd-stat-header">
            <span>TOTAL ORGANISERS</span>

            <span>
              <HiUsers className="cmd-stat-icon" />
            </span>
          </div>

          <div className="cmd-stat-value">
            {totalOrganisers}
          </div>

          <div className="cmd-stat-subtext">
            Registered organisers
          </div>
        </div>

        <div className="cmd-stat-card">
          <div className="cmd-stat-header">
            <span>PENDING EVENTS</span>

            <span>
              <FaClock className="cmd-stat-icon" />
            </span>
          </div>

          <div className="cmd-stat-value">
            {pendingEvents.length}
          </div>

          <div className="cmd-stat-subtext">
            Awaiting review
          </div>
        </div>

        <div className="cmd-stat-card">
          <div className="cmd-stat-header">
            <span>HOST REQUESTS</span>

            <span>
              <FaUsers className="cmd-stat-icon" />
            </span>
          </div>

          <div className="cmd-stat-value">
            {pendingRequests.length}
          </div>

          <div className="cmd-stat-subtext">
            Awaiting organizer approval
          </div>
        </div>
        <div className="cmd-stat-card">
          <div className="cmd-stat-header">
            <span>CITIES</span>

            <span>
              <FaMapPin className="cmd-stat-icon" />
            </span>
          </div>

          <div className="cmd-stat-value">
            {citiesCount}
          </div>

          <div className="cmd-stat-subtext">
            Configured cities
          </div>
        </div>

        <div className="cmd-stat-card">
          <div className="cmd-stat-header">
            <span>CATEGORIES</span>

            <span>
              <PiTagChevronFill className="cmd-stat-icon" />
            </span>
          </div>

          <div className="cmd-stat-value">
            {categoriesCount}
          </div>

          <div className="cmd-stat-subtext">
            Configured categories
          </div>
        </div>

      </div>

      <div className="cmd-queues-grid">

        <div className="cmd-queue-card">

          <div className="queue-card-head">
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
                <FaCalendarDay className="cmd-stat-icon" />
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