import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { CityProvider } from "./context/CityContext";
import Home from "./pages/Home/Home";
import Settings from "./pages/Settings/Settings";
import Events from "./pages/Events/Events";
import { Activities } from "./pages/Activities/Activities";
import { Concerts } from "./pages/Concerts/Concerts";
import EventDetails from "./components/EventDetails/EventDetails";
import BookingPage from "./pages/BookingPage/BookingPage";
function App() {
  return (
    <UserProvider>
      <CityProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Settings routes */}
            <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
            <Route path="/settings/:tabSlug" element={<Settings />} />

            <Route path="/events" element={<Events />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/concerts" element={<Concerts />} />
            <Route path="/events/:slug" element={<EventDetails />} />
            {/* <Route path="/events/:slug/book" element={<Booking />} /> */}
            <Route path="/bookings" element={<BookingPage />} />
          </Routes>
        </BrowserRouter>
      </CityProvider>
    </UserProvider>
  );
}

export default App;