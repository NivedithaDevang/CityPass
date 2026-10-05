import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    UserCircle,
    LogOut
} from "lucide-react";

import "./OrganiserSidebar.css";

const OrganiserSidebar = () => {

    return (
        <aside className="organiser-sidebar">

            {/* Logo */}
            <div className="organiser-logo">
                <span className="organiser-logo-mark">C</span>

                <div>
                    <h2>CityPass</h2>
                    <span>Organizer</span>
                </div>
            </div>


            {/* Navigation */}
            <nav className="organiser-nav">

                <NavLink
                    to="/organiser/home"
                    className={({ isActive }) =>
                        `organiser-nav-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>


                <NavLink
                    to="/organiser/events"
                    className={({ isActive }) =>
                        `organiser-nav-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <CalendarDays size={20} />
                    <span>My Events</span>
                </NavLink>


                <NavLink
                    to="/organiser/attendees"
                    className={({ isActive }) =>
                        `organiser-nav-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <Users size={20} />
                    <span>Attendees</span>
                </NavLink>


                <NavLink
                    to="/organiser/profile"
                    className={({ isActive }) =>
                        `organiser-nav-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    <UserCircle size={20} />
                    <span>Profile</span>
                </NavLink>

            </nav>


            {/* Bottom */}
            <div className="organiser-sidebar-bottom">

                <button className="organiser-logout">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>

            </div>

        </aside>
    );
};

export default OrganiserSidebar;