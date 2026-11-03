import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import "./AdminReports.css";

const EVENT_LABELS = {
  login_success: "Successful Login",
  login_failed: "Failed Login",
  account_suspended: "Account Suspended",
  account_reactivated: "Account Reactivated",
  admin_action: "Administrative Action",
};

const EVENT_ICONS = {
  login_success: "✓",
  login_failed: "✕",
  account_suspended: "⊘",
  account_reactivated: "↻",
  admin_action: "⚙",
};

const DATE_PRESETS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDate = (dateString, numberOfDays) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + numberOfDays);
  return getLocalDateString(date);
};

const getDateRange = (preset, customStartDate, customEndDate) => {
  const today = getLocalDateString();

  if (preset === "all") {
    return { startDate: "", endDate: "" };
  }

  if (preset === "today") {
    return { startDate: today, endDate: today };
  }

  if (preset === "last7") {
    return { startDate: shiftDate(today, -6), endDate: today };
  }

  if (preset === "last30") {
    return { startDate: shiftDate(today, -29), endDate: today };
  }

  if (preset === "custom") {
    return {
      startDate: customStartDate,
      endDate: customEndDate,
    };
  }

  return { startDate: "", endDate: "" };
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


// Convert a value into a safe CSV cell.
const escapeCSVValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return '""';
  }

  let text = String(value);

  // Prevent spreadsheet formula injection.
  // Prefix potentially executable spreadsheet formulas.
  if (/^[\s\u0000-\u001F]*[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  // Escape double quotes and wrap the value in quotes.
  return `"${text.replace(/"/g, '""')}"`;
};

// Convert activity logs into an Excel-compatible CSV file.
const exportLogsToCSV = (
  logs,
  appliedDatePreset = "all",
  appliedStartDate = "",
  appliedEndDate = ""
) => {
  if (!Array.isArray(logs) || logs.length === 0) {
    return false;
  }

  const headers = [
    "Event Type",
    "Actor",
    "Email",
    "Role",
    "Description",
    "Target",
    "Date & Time",
  ];

  const rows = logs.map((log) => [
    EVENT_LABELS[log.eventType] || log.eventType || "Unknown",
    log.actorName || log.actorEmail || "Unknown actor",
    log.actorEmail || "",
    log.actorRole || "",
    log.description || "",
    log.targetEmail || "",
    log.createdAt
      ? new Date(log.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "",
  ]);

  const csvContent = [
    headers.map(escapeCSVValue).join(","),
    ...rows.map((row) => row.map(escapeCSVValue).join(",")),
  ].join("\r\n");

  // Add a UTF-8 BOM to improve compatibility with Microsoft Excel.
  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  const dateRange = `${appliedDatePreset}${
  appliedDatePreset === "custom"
    ? `_${appliedStartDate}_to_${appliedEndDate}`
    : ""
}`;

link.download = `NoteHub_Activity_Reports_${dateRange}_${getLocalDateString()}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  return true;
};

const exportAllLogsToCSV = async ({
  appliedDatePreset,
  appliedStartDate,
  appliedEndDate,
  eventFilter,
  searchTerm,
}) => {
  try {
    const params = new URLSearchParams();

    const range = getDateRange(
      appliedDatePreset,
      appliedStartDate,
      appliedEndDate
    );

    if (range.startDate) {
      params.set("startDate", range.startDate);
    }

    if (range.endDate) {
      params.set("endDate", range.endDate);
    }

    params.set("eventType", eventFilter || "all");

    if (searchTerm?.trim()) {
      params.set("search", searchTerm.trim());
    }

    const response = await apiFetch(
      `/api/admin/security-logs/export?${params.toString()}`
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));

      throw new Error(
        data.message || "Failed to export security activity."
      );
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `NoteHub_Security_Activity_${getLocalDateString()}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Full CSV export error:", error);
    alert(error.message || "Unable to export security activity.");
  }
};


const AdminReports = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  const [datePreset, setDatePreset] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedDatePreset, setAppliedDatePreset] = useState("all");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dateFilterError, setDateFilterError] = useState("");

  const fetchReports = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();
        params.set("limit", "100");

        const range = getDateRange(
          appliedDatePreset,
          appliedStartDate,
          appliedEndDate
        );

        if (range.startDate) params.set("startDate", range.startDate);
        if (range.endDate) params.set("endDate", range.endDate);

        const response = await apiFetch(
          `/api/admin/security-logs?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Failed to fetch reports."
          );
        }

        const fetchedLogs = Array.isArray(data.logs) ? data.logs : [];

        setLogs(fetchedLogs);
        setTotalLogs(
          typeof data.totalLogs === "number"
            ? data.totalLogs
            : fetchedLogs.length
        );
      } catch (err) {
        console.error("Admin Reports Error:", err);
        setError(err.message || "Something went wrong while loading reports.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedDatePreset, appliedStartDate, appliedEndDate]
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesEvent =
        eventFilter === "all" || log.eventType === eventFilter;

      const searchableText = [
        log.actorName,
        log.actorEmail,
        log.actorRole,
        log.targetEmail,
        log.description,
        log.eventType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesEvent && matchesSearch;
    });
  }, [logs, searchTerm, eventFilter]);

  const summary = useMemo(() => {
    return {
      total: logs.length,
      successfulLogins: logs.filter(
        (log) => log.eventType === "login_success"
      ).length,
      failedLogins: logs.filter(
        (log) => log.eventType === "login_failed"
      ).length,
      accountChanges: logs.filter((log) =>
        ["account_suspended", "account_reactivated"].includes(log.eventType)
      ).length,
      adminActions: logs.filter(
        (log) => log.eventType === "admin_action"
      ).length,
    };
  }, [logs]);

  const applyDateFilter = () => {
    setDateFilterError("");

    if (datePreset === "custom") {
      if (!customStartDate || !customEndDate) {
        setDateFilterError("Please select both a start date and an end date.");
        return;
      }

      if (customStartDate > customEndDate) {
        setDateFilterError("Start date cannot be later than end date.");
        return;
      }

      setAppliedStartDate(customStartDate);
      setAppliedEndDate(customEndDate);
    } else {
      setAppliedStartDate("");
      setAppliedEndDate("");
    }

    setAppliedDatePreset(datePreset);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setEventFilter("all");
    setDatePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setDateFilterError("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setAppliedDatePreset("all");
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    eventFilter !== "all" ||
    appliedDatePreset !== "all";

  const dateRangeLabel = useMemo(() => {
    if (appliedDatePreset === "all") return "All available dates";
    if (appliedDatePreset === "today") return "Today";
    if (appliedDatePreset === "last7") return "Last 7 Days";
    if (appliedDatePreset === "last30") return "Last 30 Days";
    if (appliedDatePreset === "custom") {
      return `${appliedStartDate} to ${appliedEndDate}`;
    }
    return "Selected date range";
  }, [appliedDatePreset, appliedStartDate, appliedEndDate]);

  if (loading) {
    return (
      <section className="admin-reports">
        <div className="admin-reports-loading">
          <div className="admin-reports-spinner" />
          <h3>Generating Reports...</h3>
          <p>Fetching your platform activity data.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-reports">
      {/* Header */}
      <div className="admin-reports-header">
        <div className="admin-reports-heading">
          <p className="admin-reports-eyebrow">NOTEHUB ADMINISTRATION</p>
          <h1>Platform Reports</h1>
          <p>
            Monitor login activity, account changes, and administrative events.
          </p>
        </div>

        <div className="admin-reports-header-actions">
          <button
            type="button"
            className="admin-reports-refresh"
            onClick={() => fetchReports(true)}
            disabled={refreshing}
          >
            {refreshing ? "↻ Refreshing..." : "↻ Refresh Reports"}
          </button>

          <button
            type="button"
            className="admin-reports-close"
            onClick={onClose}
            aria-label="Close Reports"
            title="Back to Dashboard"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="admin-reports-error" role="alert">
          <span>⚠</span>
          <div>
            <strong>Unable to load reports</strong>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => fetchReports(true)}
              disabled={refreshing}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Date Range Filters */}
      <div className="admin-reports-date-panel">
        <div className="admin-reports-date-heading">
          <div>
            <h2>Date Range</h2>
            <p>Filter activity records by the date they were recorded.</p>
          </div>
          <span className="admin-reports-date-active">
            {dateRangeLabel}
          </span>
        </div>

        <div className="admin-reports-date-controls">
          <label className="admin-reports-date-preset-label">
            <span>Period</span>
            <select
              className="admin-reports-date-preset"
              value={datePreset}
              onChange={(event) => {
                setDatePreset(event.target.value);
                setDateFilterError("");
              }}
              aria-label="Choose report date range"
            >
              {DATE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          {datePreset === "custom" && (
            <div className="admin-reports-custom-dates">
              <label>
                <span>Start date</span>
                <input
                  type="date"
                  value={customStartDate}
                  max={customEndDate || undefined}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  aria-label="Custom range start date"
                />
              </label>

              <label>
                <span>End date</span>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate || undefined}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  aria-label="Custom range end date"
                />
              </label>
            </div>
          )}

          <button
            type="button"
            className="admin-reports-apply-date"
            onClick={applyDateFilter}
            disabled={refreshing}
          >
            Apply Date Filter
          </button>
        </div>

        {dateFilterError && (
          <p className="admin-reports-date-error" role="alert">
            {dateFilterError}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="admin-reports-summary">
        <article className="admin-report-card">
          <div className="admin-report-card-top">
            <span className="admin-report-card-icon total-icon">▤</span>
            <span className="admin-report-card-label">Events Loaded</span>
          </div>
          <h2>{summary.total}</h2>
          <p>Activity records retrieved</p>
        </article>

        <article className="admin-report-card">
          <div className="admin-report-card-top">
            <span className="admin-report-card-icon success-icon">✓</span>
            <span className="admin-report-card-label">Successful Logins</span>
          </div>
          <h2>{summary.successfulLogins}</h2>
          <p>Recorded successful logins</p>
        </article>

        <article className="admin-report-card">
          <div className="admin-report-card-top">
            <span className="admin-report-card-icon failed-icon">✕</span>
            <span className="admin-report-card-label">Failed Logins</span>
          </div>
          <h2>{summary.failedLogins}</h2>
          <p>Recorded failed login attempts</p>
        </article>

        <article className="admin-report-card">
          <div className="admin-report-card-top">
            <span className="admin-report-card-icon account-icon">♙</span>
            <span className="admin-report-card-label">Account Changes</span>
          </div>
          <h2>{summary.accountChanges}</h2>
          <p>Suspensions and reactivations</p>
        </article>

        <article className="admin-report-card">
          <div className="admin-report-card-top">
            <span className="admin-report-card-icon action-icon">⚙</span>
            <span className="admin-report-card-label">Admin Actions</span>
          </div>
          <h2>{summary.adminActions}</h2>
          <p>Recorded administrative events</p>
        </article>
      </div>

      {/* Reports Table */}
      <div className="admin-reports-panel">
        <div className="admin-reports-panel-header">
          <div>
            <h2>Activity Report</h2>
            <p>
              Showing {filteredLogs.length} of {logs.length} loaded records
              {totalLogs > logs.length
                ? ` · ${totalLogs} records match this date range in total`
                : ""}
            </p>
          </div>

          <span className="admin-reports-live-badge">
            <span />
            Activity Logs
          </span>
        </div>

        {/* Search and Filters */}
        <div className="admin-reports-toolbar">
          <div className="admin-reports-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search name, email, role, or activity..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search activity reports"
            />

            {searchTerm && (
              <button
                type="button"
                className="admin-reports-clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <select
            className="admin-reports-event-filter"
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
            aria-label="Filter reports by event type"
          >
            <option value="all">All Event Types</option>
            <option value="login_success">Successful Login</option>
            <option value="login_failed">Failed Login</option>
            <option value="account_suspended">Account Suspended</option>
            <option value="account_reactivated">Account Reactivated</option>
            <option value="admin_action">Administrative Action</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="admin-reports-clear-filters"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}

                    <button
            type="button"
            className="admin-reports-export-btn"
            
onClick={async () => {
  await exportAllLogsToCSV({
    appliedDatePreset,
    appliedStartDate,
    appliedEndDate,
    eventFilter,
    searchTerm,
  });
}}

            disabled={filteredLogs.length === 0}
            title={
              filteredLogs.length === 0
                ? "No activity logs available to export"
                : `Export ${filteredLogs.length} filtered activity logs`
            }
          >
            📥 Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="admin-reports-table-wrapper">
          <table className="admin-reports-table">
            <thead>
              <tr>
                <th>EVENT</th>
                <th>ACTOR</th>
                <th>DESCRIPTION</th>
                <th>TARGET</th>
                <th>DATE &amp; TIME</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <span
                      className={`admin-report-event-badge ${
                        log.eventType || "unknown"
                      }`}
                    >
                      <span>{EVENT_ICONS[log.eventType] || "•"}</span>
                      {EVENT_LABELS[log.eventType] ||
                        log.eventType ||
                        "Unknown"}
                    </span>
                  </td>

                  <td>
                    <div className="admin-report-actor">
                      <strong>
                        {log.actorName || log.actorEmail || "Unknown actor"}
                      </strong>

                      {log.actorName && log.actorEmail && (
                        <small>{log.actorEmail}</small>
                      )}

                      <small>{log.actorRole || "unknown"}</small>
                    </div>
                  </td>

                  <td>
                    <div className="admin-report-description">
                      {log.description || "No description available"}
                    </div>
                  </td>

                  <td>
                    <span className="admin-report-target">
                      {log.targetEmail || "—"}
                    </span>
                  </td>

                  <td>
                    <div className="admin-report-date">
                      <strong>{formatDate(log.createdAt)}</strong>
                      <small>{formatTime(log.createdAt)}</small>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5">
                    <div className="admin-reports-empty">
                      <span>▤</span>
                      <h3>
                        {hasActiveFilters
                          ? "No matching reports"
                          : "No activity records found"}
                      </h3>
                      <p>
                        {hasActiveFilters
                          ? "Try changing your search, event type, or date range."
                          : "Activity reports will appear here when events are recorded."}
                      </p>
                      {hasActiveFilters && (
                        <button type="button" onClick={clearFilters}>
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-reports-footer">
          <span>
            Showing {filteredLogs.length} matching record
            {filteredLogs.length === 1 ? "" : "s"}
          </span>
          <span>Data source: Security Logs</span>
        </div>
      </div>

      {/* Information Note */}
      <div className="admin-reports-note">
        <span>ⓘ</span>
        <p>
          Summary cards are calculated from the records currently loaded (up
          to 100 per request). Reports include only events that NoteHub has
          actually recorded.
        </p>
      </div>
    </section>
  );
};

export default AdminReports;
