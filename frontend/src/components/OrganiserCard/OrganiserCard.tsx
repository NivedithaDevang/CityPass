import { useState } from "react";
import "./OrganiserCard.css";
import { FaUserCircle, FaChevronDown, FaChevronUp, FaCalendarCheck } from "react-icons/fa";
import { VscVerifiedFilled } from "react-icons/vsc";

interface OrganiserDetailsProps {
  stageName?: string | null;
  description?: string | null;
  eventsCount?: number | string | null;
}

export function OrganiserDetails({
  stageName,
  description,
  eventsCount,
}: OrganiserDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayName = stageName?.trim();

  return (
    <div
      className={`organiser-card ${isExpanded ? "expanded" : ""}`}
      onClick={() => displayName && setIsExpanded((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (displayName) setIsExpanded((prev) => !prev);
        }
      }}
      aria-expanded={isExpanded}
      title={displayName ? "Click to view organiser details" : undefined}
    >
      <div className="organiser-card-header">
        <div className="organiser-card-header-left">
          <div className="organiser-avatar">
            <FaUserCircle aria-hidden="true" />
          </div>
          <div>
            {displayName ? (
              <h3>
                {displayName}
                <VscVerifiedFilled className="verify-icon" />
              </h3>
            ) : (
              <span className="organiser-card-status">
                Organiser information unavailable
              </span>
            )}
            <small className="organiser-click-hint">
              {isExpanded ? "Click to collapse" : "Click to view profile"}
            </small>
          </div>
        </div>

        {displayName && (
          <div className="organiser-expand-arrow">
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        )}
      </div>

      {isExpanded && displayName && (
        <div className="organiser-expanded-content">
          <div className="organiser-stat-badge">
            <FaCalendarCheck className="stat-icon" />
            <span>
              <strong>{eventsCount ?? 1}</strong>{" "}
              {Number(eventsCount) === 1 ? "Event Hosted" : "Events Hosted"}
            </span>
          </div>

          <div className="organiser-bio">
            <h4>About the Organiser</h4>
            <p>
              {description?.trim() ||
                `${displayName} has not added a description yet.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}