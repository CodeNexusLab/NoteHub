import { useEffect, useState } from "react";
import "./Maintenance.css";

const API_URL = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://notehub-0jad.onrender.com";

function Maintenance({ children, bypass = false }) {
  const [maintenance, setMaintenance] = useState(false);
  const [checking, setChecking] = useState(!bypass);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    // Admin pages must remain accessible for maintenance recovery.
    if (bypass) {
      setChecking(false);
      setStatusError(false);
      return;
    }

    let active = true;
    let hasReceivedStatus = false;

    const checkMaintenance = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/maintenance-status`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Could not check maintenance status");
        }

        const data = await response.json();

        if (typeof data.maintenanceMode !== "boolean") {
          throw new Error("Invalid maintenance status response");
        }

        if (active) {
          hasReceivedStatus = true;

          setMaintenance(data.maintenanceMode);
          setStatusError(false);
          setChecking(false);
        }
      } catch (error) {
        console.error("Maintenance status check failed:", error);

        if (active) {
          setStatusError(true);
          setChecking(false);

          // If status has never been verified, do not expose
          // normal pages until the backend status is available.
          if (!hasReceivedStatus) {
            setMaintenance(true);
          }
        }
      }
    };

    // Check immediately on page load.
    checkMaintenance();

    // Refresh the status every 10 seconds.
    const interval = setInterval(checkMaintenance, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [bypass]);

  // Admin pages render normally without the maintenance gate.
  if (bypass) {
    return children;
  }

  // Show a loading screen until the first status check completes.
  if (checking) {
    return (
      <div className="maintenance-page">
        <div className="maintenance-card">
          <div className="maintenance-icon" aria-hidden="true">
            ⏳
          </div>

          <h1>Checking Platform Status</h1>

          <p className="maintenance-description">
            Please wait while we check NoteHub availability.
          </p>
        </div>
      </div>
    );
  }

  // Do not expose the normal website if maintenance status
  // cannot be verified.
  if (maintenance || statusError) {
    return (
      <div className="maintenance-page">
        <div className="maintenance-card">
          <div className="maintenance-icon" aria-hidden="true">
            {statusError ? "⚠️" : "🛠️"}
          </div>

          <span className="maintenance-badge">
            NOTEHUB · PLATFORM STATUS
          </span>

          <h1>
            {statusError ? (
              <>
                Unable to Verify <span>Platform Status</span>
              </>
            ) : (
              <>
                We’ll Be <span>Right Back!</span>
              </>
            )}
          </h1>

          <p className="maintenance-description">
            {statusError
              ? "We could not verify whether NoteHub is available. Please check your connection and try again."
              : "We're making improvements to NoteHub to give you a better learning experience. Our team is working on it."}
          </p>

          <div className="maintenance-status">
            <span className="maintenance-status-dot" />

            <span>
              {statusError
                ? "Platform status unavailable"
                : "Maintenance in progress"}
            </span>
          </div>

          <button
            type="button"
            className="maintenance-retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>

          <p className="maintenance-footer">
            Thank you for your patience 💙
          </p>
        </div>
      </div>
    );
  }

  // Maintenance is OFF: display the existing application.
  return children;
}

export default Maintenance;