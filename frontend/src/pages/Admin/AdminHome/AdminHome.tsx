import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  user_name?: string;
}

interface EventItem {
  id: number;
  name: string;
  status: string;
  price: number;
  category_name?: string;
  city_name?: string;
}

function AdminHome() {
  const [loading, setLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrganisers, setTotalOrganisers] = useState(0);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [requests, setRequests] = useState<OrgRequest[]>([]);

  const [citiesCount, setCitiesCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
          Array.isArray(usersRes.value.users) ? usersRes.value.users.length : 0
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
          Array.isArray(eventsRes.value.events) ? eventsRes.value.events : []
        );
      }

      if (reqRes.status === "fulfilled") {
        setRequests(
          Array.isArray(reqRes.value.requests) ? reqRes.value.requests : []
        );
      }

      if (citiesRes.status === "fulfilled") {
        setCitiesCount(
          Array.isArray(citiesRes.value.cities) ? citiesRes.value.cities.length : 0
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
      console.error("Dashboard fetch error:", error);
      setActionError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const handleEventApproval = async (eventId: number) => {
    try {
      setActionError(null);
      setActionLoading(eventId);
      await updateEventStatus(eventId, "APPROVED");

      setEvents((previous) =>
        previous.map((event) =>
          event.id === eventId ? { ...event, status: "APPROVED" } : event
        )
      );
    } catch (error) {
      console.error("Event approval error:", error);
      setActionError("Failed to approve event. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingEvents = events.filter(
    (event) => event.status?.toUpperCase() === "PENDING"
  );

  const pendingRequests = requests.filter(
    (request) => request.status?.toUpperCase() === "PENDING"
  );

  return (
    <>
      {actionError && (
        <div className="adm-cmd-error-banner" role="alert">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="adm-header-card">
        <div>
          <span className="adm-badge">PLATFORM OVERVIEW</span>
          <h2 className="adm-title">SuperAdmin Command Center</h2>
          <p className="adm-subtitle">
            Live operations, queue management, organizer applications, and regional city hubs across CityPass.
          </p>
        </div>

        <button
          type="button"
          className="adm-btn-refresh"
          onClick={loadDashboardData}
          disabled={loading || actionLoading !== null}
        >
          {loading ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span>TOTAL USERS</span>
            <span><HiUsers className="adm-stat-icon" /></span>
          </div>
          <div className="adm-stat-value">{totalUsers}</div>
          <div className="adm-stat-subtext">Registered accounts</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span>TOTAL ORGANISERS</span>
            <span><HiUsers className="adm-stat-icon" /></span>
          </div>
          <div className="adm-stat-value">{totalOrganisers}</div>
          <div className="adm-stat-subtext">Registered organisers</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span>PENDING EVENTS</span>
            <span><FaClock className="adm-stat-icon" /></span>
          </div>
          <div className="adm-stat-value">{pendingEvents.length}</div>
          <div className="adm-stat-subtext">Awaiting review</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span>HOST REQUESTS</span>
            <span><FaUsers className="adm-stat-icon" /></span>
          </div>
          <div className="adm-stat-value">{pendingRequests.length}</div>
          <div className="adm-stat-subtext">Awaiting organizer approval</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span>CITIES</span>
            <span><FaMapPin className="adm-stat-icon" /></span>
          </div>
          <div className="adm-stat-value">{citiesCount}</div>
          <div className="adm-stat-subtext">Configured cities</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span>CATEGORIES</span>
            <span><PiTagChevronFill className="adm-stat-icon" /></span>
          </div>
          <div className="adm-stat-value">{categoriesCount}</div>
          <div className="adm-stat-subtext">Configured categories</div>
        </div>
      </div>

      {/* 2-Column Split: Dual Operational Queues */}
      <div className="adm-queues-grid-dual">
        {/* Event Queue */}
        <div className="adm-queue-card">
          <div className="adm-card-head">
            <div>
              <h3 className="adm-queue-title">Pending Event Submissions</h3>
              <p className="adm-queue-desc">Review organizer event listings</p>
            </div>
            <span className="adm-queue-badge">{pendingEvents.length} Pending</span>
          </div>

          {pendingEvents.length === 0 ? (
            <div className="adm-queue-empty-state">
              <span className="adm-empty-icon">
                <FaCalendarDay className="adm-tat-icon" />
              </span>
              <p>No pending events to review.</p>
            </div>
          ) : (
            <div className="adm-queue-items-list">
              {pendingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="adm-org-request-item">
                  <div>
                    <div className="adm-org-applicant-name">{event.name}</div>
                    <div className="adm-org-applicant-note">
                      Price: ₹{Number(event.price || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="adm-btn-promote"
                    onClick={() => handleEventApproval(event.id)}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === event.id ? "Approving..." : "Approve"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Host Requests Queue */}
        <div className="adm-queue-card">
          <div className="adm-card-head">
            <div>
              <h3 className="adm-queue-title">Pending Host Requests</h3>
              <p className="adm-queue-desc">Organizer role authorization queue</p>
            </div>
            <span className="adm-queue-badge">{pendingRequests.length} Pending</span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="adm-queue-empty-state">
              <span className="adm-empty-icon">
                <FaUsers className="adm-tat-icon" />
              </span>
              <p>No host applications pending approval.</p>
            </div>
          ) : (
            <div className="adm-queue-items-list">
              {pendingRequests.slice(0, 5).map((req) => (
                <div key={req.id} className="adm-org-request-item">
                  <div>
                    <div className="adm-org-applicant-name">{req.organization_name}</div>
                    <div className="adm-org-applicant-note">
                      City: {req.city_name || "Unspecified"}
                    </div>
                  </div>
                  <Link to="/admin/organiser-requests" className="adm-btn-promote-link">
                    Review
                  </Link>
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