import { useState, useEffect, useCallback, type CSSProperties } from "react";
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
import TermsConditions from "./pages/PrivacyPolicy/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import ServerDown from "./components/ServerDown/ServerDown";


// Backend URL
const BACKEND_URL: string =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";


// Loading screen styles
const loadingStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  width: "100vw",
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  fontFamily: "system-ui, sans-serif",
  fontSize: "1.1rem",
};


function App() {

  // Stores whether backend/server is unavailable
  const [isServerDown, setIsServerDown] = useState<boolean>(false);

  // Stores whether the initial health check is still running
  const [isLoading, setIsLoading] = useState<boolean>(true);


  // Checks whether backend + database are available
  const checkHealth = useCallback(async (): Promise<void> => {

    // Show loading while checking
    setIsLoading(true);

    // Create controller to cancel request if it takes too long
    const controller = new AbortController();

    // Stop request after 3 seconds
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 3000);


    try {

      // Call backend health endpoint
      const response = await fetch(`${BACKEND_URL}/health`, {
        signal: controller.signal,
      });


      // 200 = backend + database working
      if (response.ok) {
        setIsServerDown(false);
      } 
      
      // 503 or any other error response
      else {
        setIsServerDown(true);
      }

    } catch (error) {

      // Backend completely unreachable
      // Example: server is not running
      setIsServerDown(true);

    } finally {

      // Clear timeout
      clearTimeout(timeoutId);

      // Stop loading
      setIsLoading(false);
    }

  }, []);


  // Run health check when application starts
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);


  // Show loading screen while checking server
  if (isLoading) {
    return (
      <div style={loadingStyle}>
        Connecting to server...
      </div>
    );
  }


  // Show ServerDown component if backend/database is unavailable
  if (isServerDown) {
    return <ServerDown onRetry={checkHealth} />;
  }


  // Backend is available → load the actual application
  return (
    <UserProvider>
      <CityProvider>
        <BrowserRouter>

          <Routes>

            <Route path="/" element={<Home />} />

            {/* Settings routes */}
            <Route
              path="/settings"
              element={<Navigate to="/settings/profile" replace />}
            />

            <Route
              path="/settings/:tabSlug"
              element={<Settings />}
            />

            <Route path="/events" element={<Events />} />

            <Route path="/activities" element={<Activities />} />

            <Route path="/concerts" element={<Concerts />} />

            <Route
              path="/events/:slug"
              element={<EventDetails />}
            />

            {/* <Route path="/events/:slug/book" element={<Booking />} /> */}

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

          </Routes>

        </BrowserRouter>
      </CityProvider>
    </UserProvider>
  );
}


export default App;
