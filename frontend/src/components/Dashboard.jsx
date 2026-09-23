import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loggedInUser =
    JSON.parse(localStorage.getItem("loggedInUser"));

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileResponse, notesResponse] =
          await Promise.all([
            apiFetch("/api/profile"),
            apiFetch("/api/notes"),
          ]);

        const profileData =
          await profileResponse.json();

        const notesData =
          await notesResponse.json();

        if (!profileResponse.ok) {
          console.error(
            profileData.message ||
              "Failed to load profile ❌"
          );
          return;
        }

        if (!notesResponse.ok) {
          console.error(
            notesData.message ||
              "Failed to load notes ❌"
          );
          return;
        }

        setUser(profileData.user);
        setNotes(notesData);

      } catch (error) {
        console.error(
          "Error loading dashboard:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-loading-icon">
            ⏳
          </div>

          <h2>Loading Dashboard...</h2>

          <p>
            Please wait while we prepare your NoteHub dashboard.
          </p>
        </div>
      </div>
    );
  }

  const myNotes = notes.filter(
    (note) =>
      note.ownerEmail === loggedInUser?.email
  );

  const recentNotes = [...notes]
    .sort(
      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
    )
    .slice(0, 3);

  const accountDate = user?.createdAt
    ? new Date(
        user.createdAt
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Not available";

  return (
    <div className="dashboard-page">

      {/* =================================
          WELCOME HERO
      ================================= */}

      <section className="dashboard-hero">

        <div className="dashboard-hero-content">

          <span className="dashboard-badge">
            ✨ NoteHub Dashboard
          </span>

          <h1>
            Welcome back,{" "}
            <span>
              {user?.name ||
                loggedInUser?.name ||
                "User"}
            </span>{" "}
            👋
          </h1>

          <p>
            Manage your notes, explore learning
            resources and keep track of your
            NoteHub activity.
          </p>

          <div className="dashboard-hero-buttons">

            <Link
              to="/create-note"
              className="dashboard-primary-btn"
            >
              ➕ Create Note
            </Link>

            <Link
              to="/notes"
              className="dashboard-secondary-btn"
            >
              📖 Explore Notes
            </Link>

          </div>

        </div>

        <div className="dashboard-hero-icon">
          📚
        </div>

      </section>


      {/* =================================
          STATISTICS
      ================================= */}

      <section className="dashboard-stats">

        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            📚
          </div>

          <div className="dashboard-stat-content">

            <span>Total Notes</span>

            <strong>
              {notes.length}
            </strong>

            <small>
              Available on NoteHub
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            📝
          </div>

          <div className="dashboard-stat-content">

            <span>My Notes</span>

            <strong>
              {myNotes.length}
            </strong>

            <small>
              Uploaded by you
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            👤
          </div>

          <div className="dashboard-stat-content">

            <span>Account</span>

            <strong>
              {user?.name || "User"}
            </strong>

            <small>
              Your NoteHub account
            </small>

          </div>

        </div>


        <div className="dashboard-stat-card">

          <div className="dashboard-stat-icon">
            📅
          </div>

          <div className="dashboard-stat-content">

            <span>Joined</span>

            <strong className="dashboard-date">
              {accountDate}
            </strong>

            <small>
              Account creation date
            </small>

          </div>

        </div>

      </section>


      {/* =================================
          QUICK ACTIONS
      ================================= */}

      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <span className="dashboard-section-label">
            QUICK ACTIONS
          </span>

          <h2>
            What would you like to do?
          </h2>

          <p>
            Quickly access your most-used NoteHub features.
          </p>

        </div>


        <div className="dashboard-actions">

          <Link
            to="/create-note"
            className="dashboard-action-card"
          >

            <div className="dashboard-action-icon">
              ➕
            </div>

            <div>
              <h3>
                Create Note
              </h3>

              <p>
                Share your knowledge with the community.
              </p>
            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </Link>


          <Link
            to="/notes"
            className="dashboard-action-card"
          >

            <div className="dashboard-action-icon">
              📖
            </div>

            <div>
              <h3>
                Explore Notes
              </h3>

              <p>
                Discover useful notes and learning resources.
              </p>
            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </Link>


          <Link
            to="/my-notes"
            className="dashboard-action-card"
          >

            <div className="dashboard-action-icon">
              📝
            </div>

            <div>
              <h3>
                My Notes
              </h3>

              <p>
                Manage your uploaded notes easily.
              </p>
            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </Link>


          <Link
            to="/profile"
            className="dashboard-action-card"
          >

            <div className="dashboard-action-icon">
              👤
            </div>

            <div>
              <h3>
                My Profile
              </h3>

              <p>
                View your account information.
              </p>
            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </Link>

        </div>

      </section>


      {/* =================================
          RECENT NOTES
      ================================= */}

      <section className="dashboard-section">

        <div className="dashboard-section-header">

          <div>

            <span className="dashboard-section-label">
              ACTIVITY
            </span>

            <h2>
              Recent Notes
            </h2>

            <p>
              Latest notes available on NoteHub.
            </p>

          </div>

          <Link
            to="/notes"
            className="dashboard-view-all"
          >
            View All →
          </Link>

        </div>


        {recentNotes.length === 0 ? (

          <div className="dashboard-empty">

            <div>
              📚
            </div>

            <h3>
              No Notes Available
            </h3>

            <p>
              There are no notes available yet.
            </p>

            <Link to="/create-note">
              Create the first note →
            </Link>

          </div>

        ) : (

          <div className="dashboard-recent-notes">

            {recentNotes.map((note) => (

              <div
                className="dashboard-note-card"
                key={note._id}
              >

                <div className="dashboard-note-icon">
                  📄
                </div>

                <div className="dashboard-note-content">

                  <h3>
                    {note.title}
                  </h3>

                  <p className="dashboard-note-subject">
                    <strong>
                      Subject:
                    </strong>{" "}
                    {note.subject}
                  </p>

                  <p className="dashboard-note-owner">
                    <strong>
                      Uploaded by:
                    </strong>{" "}
                    {note.ownerName ||
                      "Unknown"}
                  </p>

                  <Link
                    to={`/note/${note._id}`}
                    className="dashboard-note-link"
                  >
                    View Notes →
                  </Link>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default Dashboard;