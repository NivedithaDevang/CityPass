import Navbar from "../components/Navbar/Navbar";
import { Routes, Route , Navigate} from "react-router-dom";
import OrganiserAttendees from "../pages/Organiser/OrganiserAttendees/OrganiserAttendees";
import OrganiserEvents from "../pages/Organiser/OrganiserEvents/OrganiserEvents";
import OrganiserHome from "../pages/Organiser/OrganiserHome/OrganiserHome";

import { OrganiserLayout } from "../components/Organiser/OrganiserLayout/OrganiserLayout";
const ORGANISER_SUB_ROUTES = [
  { index: true, element: <OrganiserHome /> },
  { path: "attendees", element: <OrganiserAttendees /> },
  { path: "events", element: <OrganiserEvents /> },

]


export default function OrganiserRoutes() {
  return (
    <>
    <Navbar />
    <Routes>
      <Route path="/" element={<OrganiserLayout />}>
        {ORGANISER_SUB_ROUTES.map((route, i) =>
          route.index ? (
            <Route key="index" index element={route.element} />
          ) : (
            <Route key={route.path || i} path={route.path} element={route.element} />
          )
        )}
        <Route path="*" element={<Navigate to="/organiser" replace />} />
      </Route>

    </Routes>
    </>
  );
}
