import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  UserPlus,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "../api";
import "./PlatformSettings.css";

function PlatformSettings({ onClose }) {
  const [settings, setSettings] = useState({
    platformName: "NoteHub",
    platformDescription: "Your learning resources, all in one place.",
    registrationEnabled: true,
    maintenanceMode: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch("/api/admin/settings");

      if (!response.ok) {
        throw new Error("Unable to fetch platform settings.");
      }

      const data = await response.json();

      if (!data.settings) {
        throw new Error("Settings data was not returned by the server.");
      }

      setSettings({
        platformName: data.settings.platformName ?? "NoteHub",
        platformDescription:
          data.settings.platformDescription ??
          "Your learning resources, all in one place.",
        registrationEnabled:
          data.settings.registrationEnabled ?? true,
        maintenanceMode: data.settings.maintenanceMode ?? false,
      });
    } catch (err) {
      setError(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setSuccess("");
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiFetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platformName: settings.platformName.trim(),
          platformDescription: settings.platformDescription.trim(),
          registrationEnabled: settings.registrationEnabled,
          maintenanceMode: settings.maintenanceMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save settings.");
      }

      if (!data.settings) {
        throw new Error("The server did not return the updated settings.");
      }

      setSettings({
        platformName: data.settings.platformName ?? "NoteHub",
        platformDescription:
          data.settings.platformDescription ??
          "Your learning resources, all in one place.",
        registrationEnabled:
          data.settings.registrationEnabled ?? true,
        maintenanceMode: data.settings.maintenanceMode ?? false,
      });

      setSuccess("Platform settings saved successfully!");
    } catch (err) {
      setError(err.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="platform-settings-page">
        <div className="ps-loading">
          <RefreshCw className="ps-spin" size={28} />
          <h2>Loading Platform Settings</h2>
          <p>Please wait while we fetch your settings...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="platform-settings-page">
      <header className="ps-header">
        <div className="ps-heading">
          <div className="ps-heading-icon">
            <Settings size={27} />
          </div>

          <div>
            <span className="ps-eyebrow">ADMIN CONTROL CENTER</span>
            <h1>Platform Settings</h1>
            <p>Configure NoteHub and manage platform availability.</p>
          </div>
        </div>

        <div className="ps-header-actions">
          <button
            type="button"
            className="ps-button ps-refresh"
            onClick={loadSettings}
            disabled={saving}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {onClose && (
            <button
              type="button"
              className="ps-button ps-back"
              onClick={onClose}
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="ps-alert ps-alert-error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="ps-alert ps-alert-success" role="status">
          <Check size={19} />
          <span>{success}</span>
        </div>
      )}

      <div className="ps-summary-grid">
        <article className="ps-summary-card">
          <div className="ps-summary-icon ps-icon-blue">
            <Settings size={21} />
          </div>
          <div>
            <span>Platform</span>
            <strong>{settings.platformName || "NoteHub"}</strong>
          </div>
        </article>

        <article className="ps-summary-card">
          <div
            className={`ps-summary-icon ${
              settings.registrationEnabled
                ? "ps-icon-green"
                : "ps-icon-red"
            }`}
          >
            <UserPlus size={21} />
          </div>
          <div>
            <span>New Registrations</span>
            <strong>
              {settings.registrationEnabled ? "Enabled" : "Disabled"}
            </strong>
          </div>
        </article>

        <article className="ps-summary-card">
          <div
            className={`ps-summary-icon ${
              settings.maintenanceMode
                ? "ps-icon-red"
                : "ps-icon-green"
            }`}
          >
            <Wrench size={21} />
          </div>
          <div>
            <span>Maintenance</span>
            <strong>
              {settings.maintenanceMode ? "Active" : "Inactive"}
            </strong>
          </div>
        </article>
      </div>

      <form className="ps-settings-form" onSubmit={handleSave}>
        <section className="ps-panel">
          <div className="ps-panel-heading">
            <div className="ps-panel-icon">
              <Settings size={21} />
            </div>

            <div>
              <h2>General Information</h2>
              <p>Update the platform name and public description.</p>
            </div>
          </div>

          <div className="ps-field">
            <label htmlFor="platformName">Platform Name</label>
            <input
              id="platformName"
              name="platformName"
              type="text"
              value={settings.platformName}
              onChange={handleChange}
              maxLength={100}
              minLength={1}
              required
              placeholder="Enter platform name"
            />
            <span className="ps-help">
              {settings.platformName.length}/100 characters
            </span>
          </div>

          <div className="ps-field">
            <label htmlFor="platformDescription">
              Platform Description
            </label>
            <textarea
              id="platformDescription"
              name="platformDescription"
              value={settings.platformDescription}
              onChange={handleChange}
              maxLength={500}
              rows={4}
              placeholder="Describe your learning platform"
            />
            <span className="ps-help">
              {settings.platformDescription.length}/500 characters
            </span>
          </div>
        </section>

        <section className="ps-panel">
          <div className="ps-panel-heading">
            <div className="ps-panel-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h2>Access & Availability</h2>
              <p>Manage registration and maintenance controls.</p>
            </div>
          </div>

          <div className="ps-toggle-row">
            <div className="ps-toggle-description">
              <div className="ps-toggle-title">
                <UserPlus size={19} />
                <strong>Allow New Registrations</strong>
              </div>

              <p>
                {settings.registrationEnabled
                  ? "New users can create NoteHub accounts."
                  : "New user registrations are blocked."}
              </p>
            </div>

            <label className="ps-switch">
              <input
                type="checkbox"
                name="registrationEnabled"
                checked={settings.registrationEnabled}
                onChange={handleChange}
                aria-label="Allow new registrations"
              />
              <span className="ps-switch-track" />
            </label>
          </div>

          <div className="ps-toggle-row">
            <div className="ps-toggle-description">
              <div className="ps-toggle-title">
                <Wrench size={19} />
                <strong>Maintenance Mode</strong>
              </div>

              <p>
                {settings.maintenanceMode
                  ? "Maintenance mode is enabled in platform settings."
                  : "Maintenance mode is currently disabled."}
              </p>

              <span className={`ps-warning ${
  settings.maintenanceMode
    ? "ps-warning-active"
    : "ps-warning-inactive"
}`}>
  {settings.maintenanceMode
    ? "Maintenance is active. Regular users cannot access the platform."
    : "Maintenance is inactive. The platform is available to users."}
</span>
            </div>

            <label className="ps-switch">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleChange}
                aria-label="Enable maintenance mode"
              />
              <span className="ps-switch-track" />
            </label>
          </div>
        </section>

        <footer className="ps-form-footer">
          <div className="ps-security-note">
            <ShieldCheck size={19} />
            <span>Only authorized administrators should change these settings.</span>
          </div>

          <button
            type="submit"
            className="ps-button ps-save"
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw className="ps-spin" size={17} />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Settings
              </>
            )}
          </button>
        </footer>
      </form>
    </section>
  );
}

export default PlatformSettings;
