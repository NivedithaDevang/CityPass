import React from "react";
import "./ServerDown.css";

interface ServerDownProps {
  onRetry?: () => void;
  onLogin?: () => void;
}

const ServerDown: React.FC<ServerDownProps> = ({ onRetry }) => {
  const handleRetry = (): void => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };


  return (
    <div className="server-error-container">
      <h1 className="server-error-title">Server Error</h1>
      <p className="server-error-text">
        Something went wrong on our end. Please log in again or refresh the page.
      </p>

      <div className="server-error-actions">
        <button type="button" className="btn-secondary" onClick={handleRetry}>
          Try Again
        </button>

      </div>
    </div>
  );
};

export default ServerDown;