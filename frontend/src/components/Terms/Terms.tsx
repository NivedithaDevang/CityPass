import React, { useEffect } from "react";
import "./Terms.css";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TERMS_LIST: string[] = [
  "By accepting, holding or using a ticket, you acknowledge that you have read, understood, accepted and agreed to the full terms and conditions.",
  "The organizer reserves the right of admission.",
  "The organizer may alter the event schedule without prior notice.",
  "Entry is permitted only after a thorough security check and through designated entrances.",
  "Re-entry is not permitted.",
  "The venue does not allow food, beverages, liquids, bottles, cans, tins, bags, lighters, matchboxes, flammable items, or any illegal or hazardous substances inside the venue or seating area (\"Prohibited Items\"). Security personnel will search ticket holders' belongings at entry. If a ticket holder refuses a search and/or is found in possession of Prohibited Items, the organizer may deny entry without any refund or compensation.",
  "This is a drug-free event. If any ticket holder uses, possesses, procures, supplies, or consumes drugs, narcotics, or psychotropic substances (as defined under the Narcotic Drugs and Psychotropic Substances Act, 1985), the organizer will immediately evict them from the venue without refund or compensation. The organizer also reserves the right to initiate legal action as permitted under applicable law.",
  "The organizer reserves the right to refuse admission or eject any ticket holder who appears intoxicated, under the influence of drugs, behaves dangerously or inappropriately, or engages in conduct likely to cause harassment, damage, injury, or nuisance. The organizer's decision in this regard shall be final.",
  "The use of audio or video recording equipment, including still cameras, is strictly prohibited.",
  "The organizer issues this ticket in accordance with the rules and regulations of the event organizer and venue management.",
  "The organizer does not accept responsibility for any injury to persons or for any loss or damage to personal property brought to the event.",
  "In accordance with applicable law, persons below the legally permissible age may not purchase or consume alcoholic beverages.",
  "The organizer and venue are not liable for any issues arising from unauthorized copies or reproductions of this ticket. Except as stated herein, the ticket is non-refundable and cannot be exchanged, cancelled, or returned once purchased.",
  "If the organizer cancels the performance, the organizer will refund the ticket fee. All other charges, including parking fees, internet handling fees, and order processing fees, remain non-refundable.",
  "The ticket is invalid if the security features affixed to it are tampered with.",
  "You voluntarily assume all risks related to contracting COVID-19, H1N1, or any other communicable disease or illness, whether occurring before, during, or after the event, and waive all claims against the organizer arising from such risks.",
  "The event is subject to force majeure conditions.",
  "We request your cooperation at all times.",
  "All disputes or claims shall be subject to the exclusive jurisdiction of the courts in Mumbai.",
  "The organizer may modify these terms and conditions at its discretion from time to time.",
  "All secondary performances (if any) and the event lineup are subject to the artist's discretion.",
  "To ensure a high-quality user experience, the organizer may collect certain information (including personally identifiable information such as name, email address, or phone number) at the time of booking, registration, or payment, in accordance with its Terms and Conditions and Privacy Policy."
];

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

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
          Terms & Conditions
        </h2>

        <div className="bms-modal-body">
          <ol className="bms-modal-list">
            {TERMS_LIST.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};