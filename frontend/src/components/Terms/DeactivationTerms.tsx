import React, { useEffect } from "react";
import "./Terms.css";

interface DeactivateTerms {
    isOpen: boolean;
    onClose: () => void;
}

const deactivateTerms: string[] = [
    "Your account will be temporarily marked as Inactive. Your account will not be permanently deleted.",
    "You will still be able to browse and view events, activities, concerts, and other content available on CityPass.",
    "While your account is inactive, you will not be able to make new bookings or purchase tickets.",
    "Any existing bookings or tickets will remain active and will not be cancelled automatically because of account deactivation.",
    "Deactivating your account does not automatically cancel or refund any existing bookings. Existing bookings will continue to follow their applicable cancellation and refund policies.",
    "To make a new booking, you must reactivate your account by logging in again.",
    "Once your account is successfully reactivated, your account will return to Active status and booking functionality will be restored.",
    "Your account information may continue to be retained while your account is inactive in accordance with the CityPass Privacy Policy and applicable laws.",
];

export const Terms: React.FC<DeactivateTerms> = ({ isOpen, onClose}) => {

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
          Deactivation Terms
        </h2>

        <div className="bms-modal-body">
          <ol className="bms-modal-list">
            {deactivateTerms.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );


}