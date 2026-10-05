import {
    CalendarDays,
    Clock,
    Ticket,
    Users
} from "lucide-react";
import "./OrganiserHome.css";

const OrganiserHome = () => {

    return (
        <>
        <div className="organiser-home">

            <div className="organiser-welcome">
                <div>
                    <h2>Welcome back, Organizer</h2>

                    <p>
                        Here's what's happening with your events.
                    </p>
                </div>

                <button className="create-event-btn">
                    + Create Event
                </button>
            </div>
            <div className="organiser-stats">

                <div className="organiser-stat-card">

                    <div className="stat-icon">
                        <CalendarDays size={21} />
                    </div>

                    <div>
                        <span>Total Events</span>
                        <strong>0</strong>
                    </div>

                </div>


                <div className="organiser-stat-card">

                    <div className="stat-icon">
                        <Clock size={21} />
                    </div>

                    <div>
                        <span>Upcoming Events</span>
                        <strong>0</strong>
                    </div>

                </div>


                <div className="organiser-stat-card">

                    <div className="stat-icon">
                        <Ticket size={21} />
                    </div>

                    <div>
                        <span>Tickets Sold</span>
                        <strong>0</strong>
                    </div>

                </div>


                <div className="organiser-stat-card">

                    <div className="stat-icon">
                        <Users size={21} />
                    </div>

                    <div>
                        <span>Total Attendees</span>
                        <strong>0</strong>
                    </div>

                </div>

            </div>

            <div className="organiser-section">

                <div className="section-heading">
                    <div>
                        <h3>Recent Events</h3>
                        <p>Your latest events will appear here.</p>
                    </div>
                </div>


                <div className="empty-events">

                    <CalendarDays size={42} />

                    <h3>No events yet</h3>

                    <p>
                        Create your first event to get started.
                    </p>

                    <button className="create-event-btn">
                        Create Event
                    </button>

                </div>

            </div>

        </div>
        </>
    );
};

export default OrganiserHome;