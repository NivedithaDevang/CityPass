
interface ConfirmationPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  isLoading: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onViewTerms: () => void;
}

const ConfirmationPopup = ({
  isOpen,
  title,
  message,
  confirmText,
  isLoading,
  danger = false,
  onConfirm,
  onClose,
  onViewTerms,
}: ConfirmationPopupProps) => {
  if (!isOpen) return null;

  return (
    <div className="bms-modal-backdrop confirmation-popup-backdrop">
      <section
        className={`bms-modal-card confirmation-popup-card ${
          danger ? "confirmation-popup-card-danger" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-popup-title"
      >
        <h2
          id="confirmation-popup-title"
          className="bms-modal-title confirmation-popup-title"
        >
          {title}
        </h2>

        <p className="confirmation-popup-message">{message}</p>

        <button
          type="button"
          className="confirmation-terms-button"
          onClick={onViewTerms}
        >
          View Terms and Conditions
        </button>

        <div className="confirmation-actions">
          <button
            type="button"
            className="confirmation-cancel-button"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            type="button"
            className={`confirmation-confirm-button ${
              danger ? "confirmation-confirm-button-danger" : ""
            }`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Please wait..." : confirmText}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConfirmationPopup;
