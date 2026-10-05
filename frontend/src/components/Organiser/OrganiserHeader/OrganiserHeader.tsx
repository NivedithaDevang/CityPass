import {
    Bell,
    ChevronDown
} from "lucide-react";

import "./OrganiserHeader.css";

const OrganiserHeader = () => {

    return (
        <header className="organiser-header">

            <div>
                <h1>Organizer Dashboard</h1>
                <p>Manage your events and attendees</p>
            </div>


            <div className="organiser-header-right">

                <button className="organiser-notification">
                    <Bell size={20} />
                    <span></span>
                </button>


                <div className="organiser-profile">

                    <div className="organiser-avatar">
                        O
                    </div>

                    <div className="organiser-profile-info">
                        <strong>Organizer</strong>
                        <small>Organizer Account</small>
                    </div>

                    <ChevronDown size={17} />

                </div>

            </div>

        </header>
    );
};

export default OrganiserHeader;