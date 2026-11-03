import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./SecurityCenter.css";

const EVENT_LABELS = {
  login_success: "Successful Login",
  login_failed: "Failed Login",
  account_suspended: "Account Suspended",
  account_reactivated: "Account Reactivated",
  admin_action: "Administrative Action",
};

const EVENT_FILTERS = [
  { value: "all", label: "All Events" },
  { value: "login_success", label: "Successful Login" },
  { value: "login_failed", label: "Failed Login" },
  { value: "account_suspended", label: "Account Suspended" },
  { value: "account_reactivated", label: "Account Reactivated" },
  { value: "admin_action", label: "Admin Actions" },
];

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return parsedDate.toLocaleString();
}

function SecurityCenter({ onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
const [eventFilter, setEventFilter] = useState("all");

  const fetchSecurityLogs = useCallback(async () => {
    setLoadingLogs(true);
    setLogsError("");

    try {
      const response = await apiFetch(
        "/api/admin/security-logs?limit=50"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load security activity."
        );
      }

      if (!Array.isArray(data.logs)) {
        throw new Error("The server returned an invalid logs response.");
      }

      setLogs(data.logs);
      setTotalLogs(
        Number.isFinite(data.totalLogs)
          ? data.totalLogs
          : data.logs.length
      );
    } catch (error) {
      setLogsError(
        error.message || "Something went wrong while loading security logs."
      );
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "activity") {
      fetchSecurityLogs();
    }
  }, [activeTab, fetchSecurityLogs]);


const filteredLogs = logs.filter((log) => {
  const matchesEvent =
    eventFilter === "all" || log.eventType === eventFilter;

  const query = searchQuery.trim().toLowerCase();

  const searchableText = [
    log.actorName,
    log.actorEmail,
    log.targetEmail,
    log.description,
    log.eventType,
    log.actorRole,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchesSearch =
    !query || searchableText.includes(query);

  return matchesEvent && matchesSearch;
});


  const renderSecurityActivity = () => (
    <>
      <div className="security-activity-heading">
        <div>
          <h2>Security Activity</h2>
          <p>
            Review login events and recorded security activity from NoteHub.
          </p>
        </div>

        <button
          type="button"
          className="security-refresh-btn"
          onClick={fetchSecurityLogs}
          disabled={loadingLogs}
        >
          {loadingLogs ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div className="security-activity-summary">
        <div className="security-information-row">
          <span>Total security events</span>
          <strong>{totalLogs}</strong>
        </div>

        <div className="security-information-row">
          <span>Events currently displayed</span>
          <strong>{logs.length}</strong>
        </div>
      </div>

<div className="security-activity-filters">
  <div className="security-search-wrapper">
    <span aria-hidden="true">🔎</span>

    <input
      type="search"
      className="security-search-input"
      placeholder="Search name, email, role or description..."
      value={searchQuery}
      onChange={(event) => setSearchQuery(event.target.value)}
      aria-label="Search security activity"
    />
  </div>

  <div className="security-filter-wrapper">
    <label htmlFor="security-event-filter">
      Event Type
    </label>

    <select
      id="security-event-filter"
      className="security-event-filter"
      value={eventFilter}
      onChange={(event) => setEventFilter(event.target.value)}
    >
      {EVENT_FILTERS.map((filter) => (
        <option key={filter.value} value={filter.value}>
          {filter.label}
        </option>
      ))}
    </select>
  </div>

  {(searchQuery || eventFilter !== "all") && (
    <button
      type="button"
      className="security-clear-filters-btn"
      onClick={() => {
        setSearchQuery("");
        setEventFilter("all");
      }}
    >
      Clear Filters
    </button>
  )}
</div>

<div className="security-filter-results">
  Showing <strong>{filteredLogs.length}</strong> matching events
  out of <strong>{logs.length}</strong> loaded events.
</div>


      {loadingLogs && logs.length === 0 && (
        <div className="security-empty-state">
          <span>⏳</span>
          <h3>Loading security activity</h3>
          <p>Please wait while we retrieve the latest logs.</p>
        </div>
      )}

      {!loadingLogs && logsError && (
        <div className="security-error-state" role="alert">
          <span>⚠️</span>
          <h3>Unable to load security activity</h3>
          <p>{logsError}</p>

          <button
            type="button"
            className="security-refresh-btn"
            onClick={fetchSecurityLogs}
          >
            Try Again
          </button>
        </div>
      )}

      {!loadingLogs && !logsError && logs.length === 0 && (
        <div className="security-empty-state">
          <span>📋</span>
          <h3>No security activity found</h3>
          <p>New security events will appear here when available.</p>
        </div>
      )}

      {filteredLogs.length > 0 && (
        <div className="security-activity-list">
          {filteredLogs.map((log) => (
            <article
              className="security-activity-item"
              key={log._id}
            >
              <div className="security-activity-item-header">
                <div>
                  <span
                    className={`security-event-badge security-event-${log.eventType}`}
                  >
                    {EVENT_LABELS[log.eventType] || log.eventType}
                  </span>

                  <h3>
                    {log.actorName || log.actorEmail || "Unknown user"}
                  </h3>
                </div>

                <time dateTime={log.createdAt || undefined}>
                  {formatDate(log.createdAt)}
                </time>
              </div>

              <p className="security-activity-description">
                {log.description || "No description provided."}
              </p>

              <div className="security-activity-meta">
                <span>
                  Role: {log.actorRole || "unknown"}
                </span>

                {log.actorEmail && (
                  <span>Email: {log.actorEmail}</span>
                )}

                {log.targetEmail && (
                  <span>Target: {log.targetEmail}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

{!loadingLogs &&
  !logsError &&
  logs.length > 0 &&
  filteredLogs.length === 0 && (
    <div className="security-empty-state">
      <span>🔎</span>
      <h3>No matching events found</h3>
      <p>
        Try another search term or event type, or clear your filters.
      </p>
    </div>
  )}


      {!logsError && logs.length > 0 && (
        <p className="security-activity-footnote">
          Showing up to 50 most recent events.
        </p>
      )}
    </>
  );

  return (
    <div className="security-center">
      <header className="security-center-header">
        <div>
          <p className="security-eyebrow">
            NOTEHUB ADMINISTRATION
          </p>

          <h1>Security Center</h1>

          <p className="security-subtitle">
            Monitor account protection, access control, and platform security.
          </p>
        </div>

        <div className="security-header-actions">
          <span className="security-status-badge">
            <span className="security-status-dot" />
            Authentication Enabled
          </span>

          <button
            type="button"
            className="security-close-btn"
            onClick={onClose}
            aria-label="Close Security Center and return to Dashboard"
            title="Back to Dashboard"
          >
            ❌
          </button>
        </div>
      </header>

      <section className="security-overview-grid">
        <article className="security-overview-card">
          <span className="security-card-icon">🔐</span>
          <p>Authentication</p>
          <h2>JWT Enabled</h2>
          <span>Token-based authentication</span>
        </article>

        <article className="security-overview-card">
          <span className="security-card-icon">🛡️</span>
          <p>Access Control</p>
          <h2>Role-Based</h2>
          <span>Protected administrative routes</span>
        </article>

        <article className="security-overview-card">
          <span className="security-card-icon">📋</span>
          <p>Security Events</p>
          <h2>{totalLogs}</h2>
          <span>Recorded security events</span>
        </article>
      </section>

      <section className="security-details-panel">
        <div className="security-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            className={
              activeTab === "overview"
                ? "security-tab active"
                : "security-tab"
            }
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "access"}
            className={
              activeTab === "access"
                ? "security-tab active"
                : "security-tab"
            }
            onClick={() => setActiveTab("access")}
          >
            Access Control
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "activity"}
            className={
              activeTab === "activity"
                ? "security-tab active"
                : "security-tab"
            }
            onClick={() => setActiveTab("activity")}
          >
            Security Activity
          </button>
        </div>

        <div className="security-tab-content">
          {activeTab === "overview" && (
            <>
              <h2>Security Overview</h2>

              <p>
                Review the existing authentication and account-protection
                capabilities of NoteHub.
              </p>

              <div className="security-information-row">
                <span>JWT authentication</span>
                <strong>Configured</strong>
              </div>

              <div className="security-information-row">
                <span>Role-based authorization</span>
                <strong>Configured</strong>
              </div>

              <div className="security-information-row">
                <span>Suspended-account checks</span>
                <strong>Configured</strong>
              </div>

              <div className="security-information-row">
                <span>Recorded security events</span>
                <strong>{totalLogs}</strong>
              </div>
            </>
          )}

          {activeTab === "access" && (
            <>
              <h2>Access Control</h2>

              <p>
                NoteHub currently defines three account roles.
              </p>

              <div className="security-information-row">
                <span>Super Admin</span>
                <strong>Full administrative access</strong>
              </div>

              <div className="security-information-row">
                <span>Admin</span>
                <strong>Role defined</strong>
              </div>

              <div className="security-information-row">
                <span>Regular User</span>
                <strong>Standard account access</strong>
              </div>

              <p className="security-note">
                Actual permissions depend on the authorization rules enforced
                by the backend.
              </p>
            </>
          )}

          {activeTab === "activity" && renderSecurityActivity()}
        </div>
      </section>

      <footer className="security-center-footer">
        <p>
          NoteHub Security Center · Security activity monitoring
        </p>
      </footer>
    </div>
  );
}

export default SecurityCenter;
