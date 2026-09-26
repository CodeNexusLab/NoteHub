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

          <h2>Preparing your workspace...</h2>

          <p>
            Loading your NoteHub learning dashboard.
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

      {/* =========================================
          DASHBOARD HERO
      ========================================= */}

      <section className="dashboard-hero-v2">

        <div className="dashboard-hero-v2-glow"></div>

        <div className="dashboard-hero-v2-content">

          <span className="dashboard-eyebrow">
            ✦ YOUR NOTEHUB WORKSPACE
          </span>

          <h1>
            Welcome back,
            <span>
              {" "}
              {user?.name ||
                loggedInUser?.name ||
                "User"}
            </span>{" "}
            👋
          </h1>

          <p>
            Your personal space to discover,
            organize and manage knowledge.
          </p>

          <div className="dashboard-hero-v2-actions">

            <Link
              to="/create-note"
              className="dashboard-v2-primary-btn"
            >
              ➕ Create Note
            </Link>

            <Link
              to="/notes"
              className="dashboard-v2-secondary-btn"
            >
              📖 Explore Knowledge
            </Link>

          </div>
        </div>

        {/* =========================================
    DASHBOARD — KNOWLEDGE PRISM
    Unique Dashboard hero visual
========================================= */}

<div className="dashboard-prism-visual">

  {/* Ambient glow */}
  <div className="dashboard-prism-glow"></div>

  {/* Soft background grid */}
  <div className="dashboard-prism-grid"></div>


  {/* =======================================
      KNOWLEDGE NETWORK
  ======================================= */}

  <span className="dashboard-prism-line prism-line-learn"></span>
  <span className="dashboard-prism-line prism-line-create"></span>
  <span className="dashboard-prism-line prism-line-discover"></span>
  <span className="dashboard-prism-line prism-line-grow"></span>


  {/* Learn node */}
  <div className="dashboard-prism-node prism-node-learn">
    <span>🧠</span>
    <strong>Learn</strong>
    <small>Build knowledge</small>
  </div>


  {/* Create node */}
  <div className="dashboard-prism-node prism-node-create">
    <span>📝</span>
    <strong>Create</strong>
    <small>Make notes</small>
  </div>


  {/* Discover node */}
  <div className="dashboard-prism-node prism-node-discover">
    <span>🔎</span>
    <strong>Discover</strong>
    <small>Find resources</small>
  </div>


  {/* Grow node */}
  <div className="dashboard-prism-node prism-node-grow">
    <span>🚀</span>
    <strong>Grow</strong>
    <small>Keep learning</small>
  </div>


  {/* =======================================
      MAIN GLASS PRISM
  ======================================= */}

  <div className="dashboard-prism-wrap">

    <div className="dashboard-prism-shadow"></div>

    <div className="dashboard-prism">

      <div className="dashboard-prism-face">

        <div className="dashboard-prism-icon">
          📚
        </div>

        <strong>
          NoteHub
        </strong>

        <small>
          Knowledge Prism
        </small>

      </div>

      {/* Moving light reflection */}
      <div className="dashboard-prism-reflection"></div>

      {/* Inner glow */}
      <div className="dashboard-prism-inner-glow"></div>

    </div>

  </div>


  {/* Tiny ambient particles */}

  <span className="dashboard-prism-particle particle-one"></span>
  <span className="dashboard-prism-particle particle-two"></span>
  <span className="dashboard-prism-particle particle-three"></span>
  <span className="dashboard-prism-particle particle-four"></span>

</div>  
      </section>


      {/* =========================================
          LEARNING OVERVIEW
      ========================================= */}

      <section className="dashboard-overview">

        <div className="dashboard-section-heading-v2">
          <span>YOUR LEARNING OVERVIEW</span>

          <h2>
            Your NoteHub activity,
            <strong> at a glance.</strong>
          </h2>

          <p>
            Keep track of your knowledge,
            notes and learning journey.
          </p>
        </div>

        <div className="dashboard-overview-grid">

          <div className="dashboard-overview-card">
            <div className="dashboard-overview-icon">
              📚
            </div>

            <div>
              <span>Total Notes</span>
              <strong>{notes.length}</strong>
              <small>Available on NoteHub</small>
            </div>
          </div>


          <div className="dashboard-overview-card">
            <div className="dashboard-overview-icon">
              📝
            </div>

            <div>
              <span>My Notes</span>
              <strong>{myNotes.length}</strong>
              <small>Uploaded by you</small>
            </div>
          </div>


          <div className="dashboard-overview-card">
            <div className="dashboard-overview-icon">
              👤
            </div>

            <div>
              <span>Account</span>
              <strong>
                {user?.name || "User"}
              </strong>
              <small>Your NoteHub account</small>
            </div>
          </div>


          <div className="dashboard-overview-card">
            <div className="dashboard-overview-icon">
              📅
            </div>

            <div>
              <span>Member Since</span>
              <strong className="dashboard-overview-date">
                {accountDate}
              </strong>
              <small>Account creation date</small>
            </div>
          </div>

        </div>
      </section>


      {/* =========================================
          LEARNING JOURNEY
      ========================================= */}

      <section className="dashboard-journey">

        <div className="dashboard-section-heading-v2">
          <span>YOUR LEARNING JOURNEY</span>

          <h2>
            From discovering knowledge to
            <strong> sharing it.</strong>
          </h2>

          <p>
            Make every step of your learning
            journey more organized with NoteHub.
          </p>
        </div>


        <div className="dashboard-journey-grid">

          <div className="dashboard-journey-card">
            <span className="dashboard-journey-number">
              01
            </span>

            <div className="dashboard-journey-icon">
              🔎
            </div>

            <h3>Discover</h3>

            <p>
              Explore useful notes and learning
              resources across different subjects.
            </p>
          </div>


          <div className="dashboard-journey-card">
            <span className="dashboard-journey-number">
              02
            </span>

            <div className="dashboard-journey-icon">
              🧠
            </div>

            <h3>Learn</h3>

            <p>
              Study organized resources and
              build your knowledge.
            </p>
          </div>


          <div className="dashboard-journey-card">
            <span className="dashboard-journey-number">
              03
            </span>

            <div className="dashboard-journey-icon">
              📝
            </div>

            <h3>Create</h3>

            <p>
              Turn your learning into useful
              notes and resources.
            </p>
          </div>


          <div className="dashboard-journey-card">
            <span className="dashboard-journey-number">
              04
            </span>

            <div className="dashboard-journey-icon">
              🚀
            </div>

            <h3>Share</h3>

            <p>
              Share knowledge and contribute
              to the NoteHub community.
            </p>
          </div>

        </div>
      </section>


      {/* =========================================
          QUICK ACTIONS
      ========================================= */}

      <section className="dashboard-actions-v2">

        <div className="dashboard-section-heading-v2">
          <span>QUICK ACTIONS</span>

          <h2>
            What would you like
            <strong> to do?</strong>
          </h2>

          <p>
            Quickly access the features you use
            most inside NoteHub.
          </p>
        </div>


        <div className="dashboard-action-grid-v2">

          <Link
            to="/create-note"
            className="dashboard-action-card-v2"
          >
            <div className="dashboard-action-icon-v2">
              ➕
            </div>

            <div className="dashboard-action-content-v2">
              <h3>Create a Note</h3>

              <p>
                Share your knowledge with
                the community.
              </p>
            </div>

            <span className="dashboard-action-arrow-v2">
              →
            </span>
          </Link>


          <Link
            to="/notes"
            className="dashboard-action-card-v2"
          >
            <div className="dashboard-action-icon-v2">
              📖
            </div>

            <div className="dashboard-action-content-v2">
              <h3>Explore Notes</h3>

              <p>
                Discover useful notes and
                learning resources.
              </p>
            </div>

            <span className="dashboard-action-arrow-v2">
              →
            </span>
          </Link>


          <Link
            to="/my-notes"
            className="dashboard-action-card-v2"
          >
            <div className="dashboard-action-icon-v2">
              📝
            </div>

            <div className="dashboard-action-content-v2">
              <h3>My Notes</h3>

              <p>
                Manage your uploaded notes
                easily.
              </p>
            </div>

            <span className="dashboard-action-arrow-v2">
              →
            </span>
          </Link>


          <Link
            to="/profile"
            className="dashboard-action-card-v2"
          >
            <div className="dashboard-action-icon-v2">
              👤
            </div>

            <div className="dashboard-action-content-v2">
              <h3>My Profile</h3>

              <p>
                View and manage your
                account information.
              </p>
            </div>

            <span className="dashboard-action-arrow-v2">
              →
            </span>
          </Link>

        </div>
      </section>


      {/* =========================================
          RECENT NOTES
      ========================================= */}

      <section className="dashboard-notes-v2">

        <div className="dashboard-section-header-v2">

          <div>
            <span>KNOWLEDGE FEED</span>

            <h2>
              Recent
              <strong> Notes.</strong>
            </h2>

            <p>
              Latest learning resources available
              on NoteHub.
            </p>
          </div>

          <Link
            to="/notes"
            className="dashboard-view-all-v2"
          >
            View All →
          </Link>

        </div>


        {recentNotes.length === 0 ? (

          <div className="dashboard-empty-v2">

            <div className="dashboard-empty-icon">
              📚
            </div>

            <h3>No Notes Available</h3>

            <p>
              There are no notes available yet.
            </p>

            <Link to="/create-note">
              Create the first note →
            </Link>

          </div>

        ) : (

          <div className="dashboard-notes-grid-v2">

            {recentNotes.map((note) => (

              <article
                className="dashboard-note-card-v2"
                key={note._id}
              >

                <div className="dashboard-note-top-v2">

                  <div className="dashboard-note-icon-v2">
                    📄
                  </div>

                  <span>
                    NOTE
                  </span>

                </div>


                <div className="dashboard-note-content-v2">

                  <h3>
                    {note.title}
                  </h3>

                  <p className="dashboard-note-subject-v2">
                    <strong>Subject</strong>
                    {note.subject}
                  </p>

                  <p className="dashboard-note-owner-v2">
                    <strong>Uploaded by</strong>
                    {note.ownerName || "Unknown"}
                  </p>

                </div>


                <Link
                  to={`/note/${note._id}`}
                  className="dashboard-note-link-v2"
                >
                  View Note →
                </Link>

              </article>

            ))}

          </div>
        )}
      </section>


      {/* =========================================
          FINAL CTA
      ========================================= */}

      <section className="dashboard-final-cta">

        <div className="dashboard-final-cta-content">

          <span>
            ✦ KEEP LEARNING
          </span>

          <h2>
            Keep learning.
            <strong>
              Keep sharing.
            </strong>
          </h2>

          <p>
            Turn your knowledge into organized
            resources with NoteHub.
          </p>

          <Link
            to="/create-note"
            className="dashboard-final-cta-btn"
          >
            Create Your Next Note →
          </Link>

        </div>

        <div className="dashboard-final-cta-icon">
          🚀
        </div>

      </section>


      <div className="dashboard-footer-v2"> 
        ✦ Crafted for organized learning
      </div>

    </div>
  );
}

export default Dashboard;