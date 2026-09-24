import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">

      {/* =========================
          HERO SECTION
      ========================== */}
      <section className="home-hero">

        <div className="hero-content">

          <span className="hero-badge">
            ✦ Your Centralized Learning Hub
          </span>

          <h1>
            Learn.
            <span> Organize.</span>
            <br />
            Share.
          </h1>

          <p className="hero-description">
            NoteHub brings your learning resources into one centralized
            platform — making it easier to discover, organize and share
            knowledge.
          </p>

          <div className="hero-actions">
            <Link to="/notes" className="hero-primary-btn">
              Explore Knowledge →
            </Link>

            <Link to="/about" className="hero-secondary-btn">
              Discover NoteHub
            </Link>
          </div>

        </div>

        {/* Floating visual */}
        <div className="hero-visual">

          <div className="hero-orbit orbit-one"></div>
          <div className="hero-orbit orbit-two"></div>

          <div className="hero-core">
            <span>📚</span>
            <strong>NoteHub</strong>
            <small>Centralized Knowledge</small>
          </div>

          <div className="floating-card floating-card-one">
            <span>🧠</span>
            <div>
              <strong>Learn</strong>
              <small>Build knowledge</small>
            </div>
          </div>

          <div className="floating-card floating-card-two">
            <span>📝</span>
            <div>
              <strong>Create</strong>
              <small>Share your notes</small>
            </div>
          </div>

          <div className="floating-card floating-card-three">
            <span>🚀</span>
            <div>
              <strong>Grow</strong>
              <small>Keep learning</small>
            </div>
          </div>

        </div>

      </section>


      {/* =========================
          CENTRALIZED KNOWLEDGE
      ========================== */}
      <section className="centralized-section">

        <div className="section-heading">
          <span>WHY NOTEHUB?</span>

          <h2>
            Everything you learn,
            <br />
            <strong>centralized in one place.</strong>
          </h2>

          <p>
            Stop searching through scattered files, messages and folders.
            NoteHub gives your learning resources a centralized home.
          </p>
        </div>

        <div className="centralized-grid">

          <div className="centralized-card">
            <div className="centralized-icon">📚</div>
            <h3>Centralized Knowledge</h3>
            <p>
              Keep your study resources organized within one
              centralized learning ecosystem.
            </p>
          </div>

          <div className="centralized-card">
            <div className="centralized-icon">🔎</div>
            <h3>Easy Discovery</h3>
            <p>
              Discover useful learning material without jumping
              between different places.
            </p>
          </div>

          <div className="centralized-card">
            <div className="centralized-icon">🤝</div>
            <h3>Knowledge Sharing</h3>
            <p>
              Turn your own notes into resources that can help
              the wider learning community.
            </p>
          </div>

        </div>

      </section>


      {/* =========================
          LEARNING JOURNEY
      ========================== */}
      <section className="learning-journey">

        <div className="section-heading">
          <span>THE NOTEHUB JOURNEY</span>

          <h2>
            From learning to
            <strong> sharing knowledge.</strong>
          </h2>
        </div>

        <div className="journey-grid">

          <div className="journey-card">
            <span className="journey-number">01</span>
            <div className="journey-icon">🔎</div>
            <h3>Discover</h3>
            <p>
              Find useful resources and explore knowledge
              across different subjects.
            </p>
          </div>

          <div className="journey-card">
            <span className="journey-number">02</span>
            <div className="journey-icon">🧠</div>
            <h3>Learn</h3>
            <p>
              Study, understand and build your knowledge
              with organized resources.
            </p>
          </div>

          <div className="journey-card">
            <span className="journey-number">03</span>
            <div className="journey-icon">📝</div>
            <h3>Create</h3>
            <p>
              Create and organize your own notes inside
              your centralized workspace.
            </p>
          </div>

          <div className="journey-card">
            <span className="journey-number">04</span>
            <div className="journey-icon">🚀</div>
            <h3>Share</h3>
            <p>
              Share knowledge and help create a stronger
              learning community.
            </p>
          </div>

        </div>

      </section>
{/* =========================
    DEVELOPER WATERMARK
========================= */}
<div className="developer-watermark">
  ✦ Crafted by Sahil
</div>

    </div>
  );
}

export default Home;