import {
    Users,
    Search
} from "lucide-react";

import "./OrganiserAttendees.css";

const OrganiserAttendees = () => {

    return (
        <div className="organiser-attendees">

            <div className="attendees-header">

                <div>
                    <h2>Attendees</h2>

                    <p>
                        View and manage attendees for your events.
                    </p>
                </div>

            </div>

            <div className="attendees-toolbar">

                <div className="attendee-search">

                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search attendees..."
                    />

                </div>


                <select className="attendee-filter">

                    <option value="">
                        All Events
                    </option>

                    <option value="event1">
                        Event 1
                    </option>

                    <option value="event2">
                        Event 2
                    </option>

                </select>

            </div>


            <div className="attendees-empty">

                <Users size={45} />

                <h3>No attendees yet</h3>

                <p>
                    Attendee information will appear here
                    once tickets are booked.
                </p>

            </div>

        </div>
    );
};

export default OrganiserAttendees;