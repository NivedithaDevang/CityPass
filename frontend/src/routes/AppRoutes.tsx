import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// User Pages
import Home from "../pages/Home/Home";
import Settings from "../pages/Settings/Settings";
import Event from "../pages/Events/Events";
import BookingPage from "../pages/BookingPage/BookingPage";
import EventDetails from "../components/EventDetails/EventDetails";
import TermsConditions from "../pages/PrivacyPolicy/TermsConditions";
import PrivacyPolicy from "../pages/PrivacyPolicy/PrivacyPolicy";

// Organiser Pages
import OrganiserProtectedRoute from "./OrganiserProtectedRoute";
import Organiser from "./OrganiserRoutes";

// Admin Routes
import AdminRoutes from "./AdminRoutes";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

          <Route
            path="/settings"
            element={
              <Navigate
                to="/settings/profile"
                replace
              />
            }
          />

          <Route
            path="/settings/:tabSlug"
            element={<Settings />}
          />

          <Route
            path="/events"
            element={<Event />}
          />

          <Route
            path="/events/:slug"
            element={<EventDetails />}
          />

          <Route
            path="/bookings"
            element={<BookingPage />}
          />

          <Route
            path="/terms"
            element={<TermsConditions />}
          />

          <Route
            path="/privacy"
            element={<PrivacyPolicy />}
          />


        <Route element={<OrganiserProtectedRoute />}>
          <Route
            path="/organiser/*"
            element={<Organiser />}
          />
        </Route>

        <Route
          path="/admin/*"
          element={<AdminRoutes />}
        />
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;