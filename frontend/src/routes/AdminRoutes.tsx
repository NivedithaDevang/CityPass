import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "../components/Admin/AdminLayout/AdminLayout";
import AdminProtectedRoute from "./AdminProtectedRoute";

import Navbar from "../components/Navbar/Navbar";

import AdminHome from "../pages/Admin/AdminHome/AdminHome";
import OrganiserRequests from "../pages/Admin/OrganiserRequests/OrganiserRequests";
import Events from "../pages/Admin/Events/Events";
import Cities from "../pages/Admin/Cities/Cities";
import Categories from "../pages/Admin/Categories/Categories";
import Users from "../pages/Admin/Users/Users";
import Organisers from "../pages/Admin/Organisers/Organisers";
import Tickets from "../pages/Admin/Tickets/Tickets";

const ADMIN_SUB_ROUTES = [
  {
    index: true,
    element: <AdminHome />,
  },
  {
    path: "organiser-requests",
    element: <OrganiserRequests />,
  },
  {
    path: "events",
    element: <Events />,
  },
  {
    path: "cities",
    element: <Cities />,
  },
  {
    path: "categories",
    element: <Categories />,
  },
  {
    path: "users",
    element: <Users />,
  },
  {
    path: "organisers",
    element: <Organisers />,
  },
  {
    path: "tickets",
    element: <Tickets />,
  },
];

export default function AdminRoutes() {
  return (
    <>
      <Navbar />

      <Routes>

        <Route element={<AdminProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>

            {ADMIN_SUB_ROUTES.map((route, index) =>
              route.index ? (
                <Route
                  key="admin-index"
                  index
                  element={route.element}
                />
              ) : (
                <Route
                  key={route.path || index}
                  path={route.path}
                  element={route.element}
                />
              )
            )}
            <Route
              path="*"
              element={
                <Navigate
                  to="/admin"
                  replace
                />
              }
            />

          </Route>
        </Route>

      </Routes>
    </>
  );
}