import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// User Pages
import Home from "../pages/Home/Home";
import Settings from "../pages/Settings/Settings";
import Events from "../pages/Events/Events";
import { Activities } from "../pages/Activities/Activities";
import { Concerts } from "../pages/Concerts/Concerts";

import Event from "../pages/Events/Events";
import BookingPage from "../pages/BookingPage/BookingPage";

import TermsConditions from "../pages/PrivacyPolicy/TermsConditions";
import PrivacyPolicy from "../pages/PrivacyPolicy/PrivacyPolicy";


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* User Routes */}

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
          element={<Events />}
        />

        <Route
          path="/events/:slug"
          element={<Event />}
        />

        <Route
          path="/activities"
          element={<Activities />}
        />

        <Route
          path="/concerts"
          element={<Concerts />}
        />

        <Route
          path="/bookings"
          element={<BookingPage />}
        />

        {/* Legal Pages */}

        <Route
          path="/terms"
          element={<TermsConditions />}
        />

        <Route
          path="/privacy"
          element={<PrivacyPolicy />}
        />

      
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;