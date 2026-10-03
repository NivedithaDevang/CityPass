import React, { useState } from "react";
import "./AdminPinModal.css";

interface AdminPinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
}) => {
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");

  const SUPER_ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET_KEY;

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!secretKey.trim()) {
      setError("Please enter the secret key.");
      return;
    }

    if (secretKey !== SUPER_ADMIN_SECRET) {
      setError("Invalid secret key. Please try again.");
      return;
    }

    setSecretKey("");
    onSuccess();
  };

  const handleCancel = () => {
    setSecretKey("");
    setError("");
    onCancel();
  };

  return (
    <div className="admin-pin-overlay">
      <div className="admin-pin-modal">
        <div className="admin-pin-icon">🔐</div>

        <h2>Super Admin Module</h2>

        <p className="admin-pin-message">
          You are entering the <strong>Super Admin module</strong>.
        </p>

        <p className="admin-pin-warning">
          This area contains sensitive administrative controls. Please enter the
          secret key to continue.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="adminSecretKey">Secret Key</label>

          <input
            id="adminSecretKey"
            type="password"
            value={secretKey}
            onChange={(event) => {
              setSecretKey(event.target.value);
              setError("");
            }}
            placeholder="Enter secret key"
            autoFocus
          />

          {error && <p className="admin-pin-error">{error}</p>}

          <div className="admin-pin-actions">
            <button
              type="button"
              className="admin-pin-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button type="submit" className="admin-pin-submit">
              Enter Super Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPinModal;