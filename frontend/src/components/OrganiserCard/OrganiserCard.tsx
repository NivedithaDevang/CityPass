import "./OrganiserCard.css";
import { FaUserCircle } from "react-icons/fa";
import { VscVerifiedFilled } from "react-icons/vsc";

interface OrganiserDetailsProps {
    stageName?: string | null;
    userName?: string | null;
}

export function OrganiserDetails({ stageName, userName }: OrganiserDetailsProps) {
    const displayName = stageName?.trim() || userName?.trim();

    return (
        <div className="organiser-card">
            <div className="organiser-avatar">
                <FaUserCircle aria-hidden="true" />
            </div>
            {displayName ? (
                <h3>
                    {displayName}
                    <VscVerifiedFilled className="verify-icon" />
                </h3>
            ) : (
                <span className="organiser-card-status">Organiser information unavailable</span>
            )}
        </div>
    );
}