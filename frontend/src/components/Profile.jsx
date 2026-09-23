import { useEffect, useState } from "react";
import { apiFetch } from "../api";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Loading profile... ⏳</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h2>Profile not available 😕</h2>
          <p>
            Unable to load your profile information.
          </p>
        </div>
      </div>
    );
  }

  const accountDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      )
    : "Not available";

  return (
    <div className="profile-page">
      <div className="profile-card">

        <div className="profile-avatar">
          👤
        </div>

        <h1>My Profile</h1>

        <p className="profile-subtitle">
          Manage and view your NoteHub account information.
        </p>

        <div className="profile-info">

          <div className="profile-info-item">
            <span className="profile-label">
              Full Name
            </span>

            <span className="profile-value">
              {user.name}
            </span>
          </div>

          <div className="profile-info-item">
            <span className="profile-label">
              Email
            </span>

            <span className="profile-value">
              {user.email}
            </span>
          </div>

          <div className="profile-info-item">
            <span className="profile-label">
              Account Created
            </span>

            <span className="profile-value">
              {accountDate}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;