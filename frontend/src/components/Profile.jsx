import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===============================
  // EDIT PROFILE STATES
  // ===============================

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ===============================
  // FETCH PROFILE
  // ===============================

  const fetchProfile = async () => {
    try {
      const response = await apiFetch("/api/profile");

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to load profile ❌"
        );
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error(
        "Error fetching profile:",
        error
      );

      alert(
        "Unable to connect to server ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ===============================
  // OPEN EDIT PROFILE
  // ===============================

  const openEditProfile = () => {
    setEditName(user.name);
    setIsEditOpen(true);
  };

  // ===============================
  // CLOSE EDIT PROFILE
  // ===============================

  const closeEditProfile = () => {
    if (savingProfile) return;

    setIsEditOpen(false);
    setEditName("");
  };

  // ===============================
  // UPDATE PROFILE
  // ===============================

  const handleProfileUpdate = async (event) => {
    event.preventDefault();

    const cleanName = editName.trim();

    // Empty name
    if (!cleanName) {
      alert("Name is required ❌");
      return;
    }

    // Minimum length
    if (cleanName.length < 2) {
      alert(
        "Name must contain at least 2 characters ❌"
      );
      return;
    }

    // Maximum length
    if (cleanName.length > 50) {
      alert(
        "Name cannot exceed 50 characters ❌"
      );
      return;
    }

    // No change
    if (cleanName === user.name) {
      setIsEditOpen(false);
      return;
    }

    try {
      setSavingProfile(true);

      const response = await apiFetch(
        "/api/profile",
        {
          method: "PUT",
          body: JSON.stringify({
            name: cleanName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to update profile ❌"
        );
        return;
      }

      // Update profile UI immediately
      setUser(data.user);

      // Update saved login user
      const storedUser =
        localStorage.getItem("loggedInUser");

      if (storedUser) {
        try {
          const parsedUser =
            JSON.parse(storedUser);

          localStorage.setItem(
            "loggedInUser",
            JSON.stringify({
              ...parsedUser,
              name: data.user.name,
            })
          );
        } catch (error) {
          console.error(
            "Error updating local user:",
            error
          );
        }
      }

      // Close modal
      setIsEditOpen(false);
      setEditName("");

      alert(
        "Profile updated successfully ✅"
      );
    } catch (error) {
      console.error(
        "Error updating profile:",
        error
      );

      alert(
        "Unable to connect to server ❌"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ===============================
  // LOADING
  // ===============================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ===============================
  // ERROR
  // ===============================

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-error-icon">
            😕
          </div>

          <h2>Profile Not Available</h2>

          <p>
            Unable to load your NoteHub
            profile information.
          </p>
        </div>
      </div>
    );
  }

  const accountDate = user.createdAt
    ? new Date(
        user.createdAt
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Not available";

  return (
    <div className="profile-page">

      {/* PROFILE HERO */}
      <section className="profile-hero">

        <div className="profile-avatar">
          <span>👤</span>
        </div>

        <div className="profile-hero-content">

          <span className="profile-eyebrow">
            ✦ YOUR NOTEHUB IDENTITY
          </span>

          <h1>
            Welcome{" "}
            <span>{user.name}</span>
          </h1>

          <p>
            Manage your identity and keep
            your learning journey organized.
          </p>

          <div className="profile-member-badge">
            <span className="status-dot"></span>
            NoteHub Member
          </div>

        </div>

        <button
          className="profile-edit-btn"
          type="button"
          onClick={openEditProfile}
        >
          ✦ Edit Profile
        </button>

      </section>

      {/* PERSONAL INFORMATION */}
      <section className="profile-section">

        <div className="profile-section-heading">
          <span className="profile-section-label">
            ACCOUNT
          </span>

          <h2>Personal Information</h2>

          <p>
            Your centralized NoteHub account
            information.
          </p>
        </div>

        <div className="profile-info-grid">

          <div className="profile-info-card">
            <div className="profile-info-icon">
              👤
            </div>

            <div>
              <span className="profile-label">
                FULL NAME
              </span>

              <strong className="profile-value">
                {user.name}
              </strong>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-icon">
              ✉️
            </div>

            <div>
              <span className="profile-label">
                EMAIL ADDRESS
              </span>

              <strong className="profile-value">
                {user.email}
              </strong>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-icon">
              📅
            </div>

            <div>
              <span className="profile-label">
                MEMBER SINCE
              </span>

              <strong className="profile-value">
                {accountDate}
              </strong>
            </div>
          </div>

        </div>

      </section>

      {/* ABOUT LEARNING */}
      <section className="profile-learning">

        <div className="profile-learning-content">

          <span className="profile-section-label">
            YOUR JOURNEY
          </span>

          <h2>
            Learning starts with
            <span> organized knowledge.</span>
          </h2>

          <p>
            NoteHub gives you a centralized
            space to discover, organize and
            share what you learn.
          </p>

        </div>

        <div className="profile-learning-icon">
          🧠
        </div>

      </section>

      {/* ACCOUNT STATUS */}
      <section className="profile-status">

        <div>
          <span className="profile-section-label">
            ACCOUNT STATUS
          </span>

          <h3>Your NoteHub account is active.</h3>
        </div>

        <div className="profile-active-badge">
          <span className="status-dot"></span>
          Active
        </div>

      </section>

      {/* PROFILE FOOTER */}
      <div className="profile-footer">
        ✦ Crafted for organized learning
      </div>

      {/* =====================================
          EDIT PROFILE MODAL
      ===================================== */}

      {isEditOpen && (
        <div
          className="profile-edit-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditProfile();
            }
          }}
        >

          <div className="profile-edit-modal">

            {/* MODAL HEADER */}

            <div className="profile-edit-modal-header">

              <div>
                <span className="profile-edit-modal-label">
                  ACCOUNT
                </span>

                <h2>Edit Profile</h2>

                <p>
                  Update your NoteHub identity.
                </p>
              </div>

              <button
                type="button"
                className="profile-edit-close"
                onClick={closeEditProfile}
                disabled={savingProfile}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {/* EDIT FORM */}

            <form
              className="profile-edit-form"
              onSubmit={handleProfileUpdate}
            >

              <label htmlFor="profile-name">
                FULL NAME
              </label>

              <input
                id="profile-name"
                type="text"
                value={editName}
                onChange={(event) =>
                  setEditName(
                    event.target.value
                  )
                }
                placeholder="Enter your name"
                maxLength={50}
                autoFocus
                disabled={savingProfile}
              />

              <span className="profile-edit-hint">
                2–50 characters
              </span>

              {/* BUTTONS */}

              <div className="profile-edit-actions">

                <button
                  type="button"
                  className="profile-edit-cancel"
                  onClick={closeEditProfile}
                  disabled={savingProfile}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-edit-save"
                  disabled={savingProfile}
                >
                  {savingProfile
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Profile;