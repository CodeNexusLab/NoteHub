import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./AdminAnalytics.css";

function StatCard({ icon, label, value, description }) {
  return (
    <article className="analytics-stat-card">
      <div className="analytics-stat-icon" aria-hidden="true">
        {icon}
      </div>

      <div className="analytics-stat-content">
        <p className="analytics-stat-label">{label}</p>

        <h3 className="analytics-stat-value">
          {Number(value ?? 0).toLocaleString()}
        </h3>

        <p className="analytics-stat-description">{description}</p>
      </div>
    </article>
  );
}

function DistributionCard({ title, items, labelKey, emptyMessage }) {
  const maxCount = Math.max(
    ...items.map((item) => Number(item.count ?? 0)),
    1
  );

  return (
    <section className="analytics-panel">
      <div className="analytics-panel-heading">
        <h3>{title}</h3>

        <span className="analytics-panel-badge">
          {items.length} categories
        </span>
      </div>

      {items.length === 0 ? (
        <p className="analytics-empty">{emptyMessage}</p>
      ) : (
        <div className="analytics-distribution-list">
          {items.map((item, index) => {
            const label = String(item[labelKey] ?? "Unknown");
            const count = Number(item.count ?? 0);
            const percentage = Math.min(
              (count / maxCount) * 100,
              100
            );

            return (
              <div
                className="analytics-distribution-item"
                key={`${label}-${index}`}
              >
                <div className="analytics-distribution-info">
                  <span className="analytics-distribution-label">
                    {label}
                  </span>

                  <strong>{count.toLocaleString()}</strong>
                </div>

                <div
                  className="analytics-progress-track"
                  role="progressbar"
                  aria-label={`${label} resource count`}
                  aria-valuemin={0}
                  aria-valuemax={maxCount}
                  aria-valuenow={count}
                >
                  <div
                    className="analytics-progress-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatChartDate(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: days === 7 ? "short" : undefined,
  });
}

function TrendChart({ title, description, items, days, color }) {
  const safeItems = Array.isArray(items) ? items : [];

  const values = safeItems.map((item) =>
    Math.max(0, Number(item.count ?? 0))
  );

  const maxValue = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <section className="analytics-panel analytics-trend-panel">
      <div className="analytics-panel-heading">
        <div>
          <h3>{title}</h3>
          <p className="analytics-trend-description">{description}</p>
        </div>

        <span className="analytics-panel-badge">
          {total.toLocaleString()} total
        </span>
      </div>

      {safeItems.length === 0 ? (
        <p className="analytics-empty">
          No trend data is available yet.
        </p>
      ) : (
        <>
          <div
            className="analytics-trend-chart"
            role="img"
            aria-label={`${title}, ${days} days. Total ${total} events.`}
          >
            {safeItems.map((item, index) => {
              const value = values[index];

              const height =
                value === 0
                  ? 3
                  : Math.max((value / maxValue) * 100, 5);

              return (
                <div
                  className="analytics-trend-column"
                  key={`${item.date}-${index}`}
                  title={`${item.date}: ${value}`}
                >
                  <span className="analytics-trend-value">
                    {value}
                  </span>

                  <div className="analytics-trend-bar-area">
                    <div
                      className={`analytics-trend-bar ${color}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>

                  <span className="analytics-trend-date">
                    {formatChartDate(item.date, days)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="analytics-trend-summary">
            <span>Daily activity</span>
            <strong>
              {(
                total / Math.max(safeItems.length, 1)
              ).toFixed(1)}{" "}
              per day on average
            </strong>
          </div>
        </>
      )}
    </section>
  );
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [trendRange, setTrendRange] = useState(7);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await apiFetch("/api/admin/analytics");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load platform analytics."
        );
      }

      setAnalytics(data);
    } catch (err) {
      setError(
        err.message || "Something went wrong while loading analytics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const overview = analytics?.overview ?? {};

  const trends = analytics?.trends ?? {};

  const userRegistrationTrend =
    trendRange === 7
      ? trends.userRegistrations?.last7Days
      : trends.userRegistrations?.last30Days;

  const resourceUploadTrend =
    trendRange === 7
      ? trends.resourceUploads?.last7Days
      : trends.resourceUploads?.last30Days;

  if (loading) {
    return (
      <main className="admin-analytics">
        <div className="analytics-page-header">
          <div>
            <p className="analytics-eyebrow">PLATFORM INSIGHTS</p>
            <h1>Platform Analytics</h1>
            <p>Understanding your NoteHub community and resources.</p>
          </div>
        </div>

        <div className="analytics-loading" role="status">
          <span className="analytics-spinner" />
          <p>Loading platform analytics...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-analytics">
      <header className="analytics-page-header">
        <div>
          <p className="analytics-eyebrow">PLATFORM INSIGHTS</p>
          <h1>Platform Analytics</h1>

          <p>
            Understand your community, resources, and platform activity.
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh-button"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {error && (
        <div className="analytics-error" role="alert">
          <strong>Unable to load the latest analytics.</strong>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            Try again
          </button>
        </div>
      )}

      {analytics && (
        <>
          <section className="analytics-section">
            <div className="analytics-section-heading">
              <div>
                <h2>Platform Overview</h2>
                <p>Current account and resource totals.</p>
              </div>
            </div>

            <div className="analytics-stats-grid">
              <StatCard
                icon="👥"
                label="Total Users"
                value={overview.totalUsers}
                description="Registered accounts"
              />

              <StatCard
                icon="🟢"
                label="Active Accounts"
                value={overview.activeUsers}
                description="Accounts marked active"
              />

              <StatCard
                icon="🚫"
                label="Suspended Accounts"
                value={overview.suspendedUsers}
                description="Accounts marked suspended"
              />

              <StatCard
                icon="🛡️"
                label="Administrators"
                value={overview.adminUsers}
                description="Admin accounts"
              />

              <StatCard
                icon="👑"
                label="Super Administrators"
                value={overview.superAdminUsers}
                description="Super Admin accounts"
              />

              <StatCard
                icon="📚"
                label="Total Resources"
                value={overview.totalResources}
                description="All stored resources"
              />

              <StatCard
                icon="✅"
                label="Visible Resources"
                value={overview.activeResources}
                description="Resources available to users"
              />

              <StatCard
                icon="🙈"
                label="Hidden Resources"
                value={overview.disabledResources}
                description="Resources disabled by admin"
              />
            </div>
          </section>

          <section className="analytics-section">
            <div className="analytics-section-heading">
              <div>
                <h2>Activity Trends</h2>
                <p>
                  Track user registrations and resource uploads over time.
                </p>
              </div>

              <div
                className="analytics-range-toggle"
                role="group"
                aria-label="Select analytics date range"
              >
                <button
                  type="button"
                  className={trendRange === 7 ? "active" : ""}
                  aria-pressed={trendRange === 7}
                  onClick={() => setTrendRange(7)}
                >
                  7 Days
                </button>

                <button
                  type="button"
                  className={trendRange === 30 ? "active" : ""}
                  aria-pressed={trendRange === 30}
                  onClick={() => setTrendRange(30)}
                >
                  30 Days
                </button>
              </div>
            </div>

            <div className="analytics-trends-grid">
              <TrendChart
                title="User Registration Trend"
                description="New accounts created each day."
                items={userRegistrationTrend}
                days={trendRange}
                color="analytics-trend-bar-users"
              />

              <TrendChart
                title="Resource Upload Trend"
                description="Resources created each day."
                items={resourceUploadTrend}
                days={trendRange}
                color="analytics-trend-bar-resources"
              />
            </div>
          </section>

          <section className="analytics-section">
            <div className="analytics-section-heading">
              <div>
                <h2>Resource Distribution</h2>
                <p>Explore resources across NoteHub.</p>
              </div>
            </div>

            <div className="analytics-distribution-grid">
              <DistributionCard
                title="By Course"
                items={analytics.courseDistribution ?? []}
                labelKey="course"
                emptyMessage="No course data is available yet."
              />

              <DistributionCard
                title="By Semester"
                items={analytics.semesterDistribution ?? []}
                labelKey="semester"
                emptyMessage="No semester data is available yet."
              />

              <DistributionCard
                title="By Resource Type"
                items={analytics.resourceTypeDistribution ?? []}
                labelKey="resourceType"
                emptyMessage="No resource type data is available yet."
              />
            </div>
          </section>

          <footer className="analytics-footer">
            {analytics.generatedAt && (
              <p>
                Last updated:{" "}
                {new Date(analytics.generatedAt).toLocaleString()}
              </p>
            )}
          </footer>
        </>
      )}
    </main>
  );
}
