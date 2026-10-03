import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// User Pages
import Home from "../pages/Home/Home";
import Settings from "../pages/Settings/Settings";
import Event from "../pages/Events/Events";
import { Activities } from "../pages/Activities/Activities";
import { Concerts } from "../pages/Concerts/Concerts";
import BookingPage from "../pages/BookingPage/BookingPage";
import EventDetails from "../components/EventDetails/EventDetails";
import TermsConditions from "../pages/PrivacyPolicy/TermsConditions";
import PrivacyPolicy from "../pages/PrivacyPolicy/PrivacyPolicy";

// Admin Layout & Guard
import AdminProtectedRoute from "./AdminProtectedRoute";
import AdminRoutes from "./AdminRoutes";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<Home />} />

        <Route
          path="/settings"
          element={<Navigate to="/settings/profile" replace />}
        />
        <Route path="/settings/:tabSlug" element={<Settings />} />

        <Route path="/events" element={<Event />} />
        <Route path="/events/:slug" element={<EventDetails />} />

        <Route path="/activities" element={<Activities />} />
        <Route path="/concerts" element={<Concerts />} />
        <Route path="/bookings" element={<BookingPage />} />

        {/* Legal Pages */}
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Admin Module Routes (Guarded & Nested) */}
        <Route
          element={
            <AdminProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]} />
          }
        >
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;