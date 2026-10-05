import React, { useState } from "react";
import { isAxiosError } from "axios";
import { verifySuperAdminKey } from "../../../services/adminService";
import "./AdminPinModal.css";
import { RiAdminLine } from "react-icons/ri";

interface AdminPinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminPinModal = ({ isOpen, onSuccess, onCancel }: AdminPinModalProps) => {
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!secretKey.trim()) {
      setError("Please enter the secret key.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifySuperAdminKey(secretKey);
      setSecretKey("");
      onSuccess();
    } catch (verificationError) {
      const responseMessage = isAxiosError(verificationError)
        ? verificationError.response?.data?.message
        : undefined;
      setError(
        typeof responseMessage === "string"
          ? responseMessage
          : "Unable to verify the secret key. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSecretKey("");
    setError("");
    onCancel();
  };

  return (
    <div className="admin-pin-overlay">
      <div className="admin-pin-modal">
        <div className="admin-pin-icon">
          <RiAdminLine />

        </div>

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
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-pin-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Enter Super Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPinModal;