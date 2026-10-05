import {
    CalendarDays,
    Plus
} from "lucide-react";

import "./OrganiserEvents.css";

const OrganiserEvents = () => {

    return (
        <div className="organiser-events">

            <div className="events-page-header">

                <div>
                    <h2>My Events</h2>

                    <p>
                        Create and manage your events.
                    </p>
                </div>


                <button className="create-event-btn">
                    <Plus size={17} />
                    Create Event
                </button>

            </div>

            <div className="event-tabs">

                <button className="event-tab active">
                    All Events
                </button>

                <button className="event-tab">
                    Pending
                </button>

                <button className="event-tab">
                    Approved
                </button>

                <button className="event-tab">
                    Rejected
                </button>

            </div>


            <div className="events-empty">

                <CalendarDays size={45} />

                <h3>No events found</h3>

                <p>
                    You haven't created any events yet.
                </p>

                <button className="create-event-btn">
                    Create Your First Event
                </button>

            </div>

        </div>
    );
};

export default OrganiserEvents;