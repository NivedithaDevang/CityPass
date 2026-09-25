import React, { useEffect } from "react";
import "./Terms.css";

interface OrganiserTerms {
    isOpen: boolean;
    onClose: () => void;
}

export const OrganiserTerms: string[] = [
  "By hosting an event on CityPass, you confirm that all information provided about the event is accurate, complete, and up to date.",

  "You must provide accurate details including the event name, description, date, time, location, ticket price, capacity, and other required information.",

  "You must have the necessary rights, permissions, licenses, and approvals required to organize and conduct the event.",

  "You are responsible for arranging and managing the venue, staff, equipment, facilities, and other requirements necessary for conducting the event.",

  "You are responsible for the safety, security, and overall experience of attendees during the event.",

  "You must comply with all applicable laws, regulations, permits, and local requirements related to organizing and conducting the event.",

  "CityPass may review submitted events before they are published. An event may be approved, rejected, or sent back for changes based on CityPass requirements.",

  "Approval of an event on CityPass does not mean that CityPass endorses, sponsors, or guarantees the event or its organizer.",

  "You must not submit events containing false, misleading, fraudulent, illegal, offensive, or unauthorized content.",

  "You must not upload or use images, logos, descriptions, videos, or other content that infringes another person's intellectual property or other legal rights.",

  "You are responsible for informing CityPass and affected attendees about any significant changes to the event, including changes to the date, time, venue, pricing, or event status.",

  "If you cancel, postpone, or significantly change an event, you are responsible for following the applicable cancellation and refund terms and cooperating with CityPass regarding attendee communication.",

  "You must honor all valid bookings and tickets issued for your event through CityPass, subject to the applicable booking and cancellation terms.",

  "You must not manipulate ticket availability, pricing, bookings, attendee information, or event ratings on the CityPass platform.",

  "You must not use CityPass to conduct fraudulent activities, unauthorized promotions, or any activity that violates applicable laws or CityPass policies.",

  "CityPass may suspend, reject, restrict, or remove an event or organizer account if there is a violation of these terms, suspected fraudulent activity, safety concerns, or other legitimate reasons.",

  "You are responsible for the accuracy and legality of all information and content submitted through your organizer account.",

  "You agree to provide reasonable cooperation to CityPass when required to resolve attendee complaints, booking issues, event changes, cancellations, or other event-related concerns.",

  "CityPass acts as a platform for event discovery and booking and is not responsible for the actual organization, management, or conduct of an event unless expressly stated otherwise.",

  "By submitting an event for hosting on CityPass, you confirm that you have read, understood, and agreed to these Organizer Terms & Conditions."
];

export const Terms: React.FC<OrganiserTerms> = ({ isOpen, onClose}) => {

    useEffect(() => {
        if(!isOpen)
            return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();

        }
        document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="bms-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-heading"
    >
      <div
        className="bms-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="bms-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <h2 id="terms-modal-heading" className="bms-modal-title">
          Terms and Conditions to become an organiser
        </h2>

        <div className="bms-modal-body">
          <ol className="bms-modal-list">
            {OrganiserTerms.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );


}