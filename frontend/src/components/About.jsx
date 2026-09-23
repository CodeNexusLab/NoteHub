function About() {
  return (
    <div className="about-page">

      {/* ===== Hero ===== */}

      <section className="about-hero">
        <h1>About NoteHub</h1>
        <p>
          A centralized platform for creating, organizing, managing, and
          sharing study notes in one place.
        </p>
      </section>

      {/* ===== About NoteHub ===== */}

      <section className="about-section">
        <h2>What is NoteHub?</h2>

        <p>
          NoteHub is a full-stack centralized notes sharing platform designed
          to help students create, organize, search, and manage their study
          notes efficiently. Users can also attach supporting documents to
          their notes and access them whenever required.
        </p>
      </section>

      {/* ===== Key Features ===== */}

      <section className="about-section">
        <h2>Key Features</h2>

        <div className="about-features">

          <div className="feature-card">
            <h3>📝 Note Management</h3>
            <p>
              Create, view, edit, search, and delete notes from one centralized
              platform.
            </p>
          </div>

          <div className="feature-card">
            <h3>🔐 Secure Authentication</h3>
            <p>
              User registration, login, JWT authentication, and protected
              routes.
            </p>
          </div>

          <div className="feature-card">
            <h3>📎 File Attachments</h3>
            <p>
              Attach, open, and download supporting study documents with notes.
            </p>
          </div>

          <div className="feature-card">
            <h3>🔍 Easy Access</h3>
            <p>
              Search and manage study notes through a simple and responsive
              interface.
            </p>
          </div>

        </div>
      </section>

      {/* ===== Technology Stack ===== */}

<section className="about-section">
  <h2>Technology Stack</h2>

  <div className="tech-stack">

    <div className="tech-category">
      <h3>Frontend</h3>
      <div className="tech-list">
        <span>React.js</span>
        <span>JavaScript</span>
        <span>HTML5</span>
        <span>CSS3</span>
      </div>
    </div>

    <div className="tech-category">
      <h3>Backend</h3>
      <div className="tech-list">
        <span>Node.js</span>
        <span>Express.js</span>
        <span>REST API</span>
      </div>
    </div>

    <div className="tech-category">
      <h3>Database</h3>
      <div className="tech-list">
        <span>MongoDB</span>
        <span>Mongoose</span>
        <span>MongoDB Atlas</span>
      </div>
    </div>

    <div className="tech-category">
      <h3>Authentication & Security</h3>
      <div className="tech-list">
        <span>JWT</span>
        <span>bcrypt</span>
      </div>
    </div>

    <div className="tech-category">
      <h3>Version Control & Deployment</h3>
      <div className="tech-list">
        <span>Git</span>
        <span>GitHub</span>
        <span>Render</span>
      </div>
    </div>

  </div>
</section>

      {/* ===== Developer ===== */}

      <section className="about-section developer-section">
        <h2>About the Developer</h2>

        <h3>Sahil</h3>

        <p>
          BCA student and aspiring Full Stack Web Developer interested in
          building practical web applications and learning modern development
          technologies.
        </p>

        <a
          href="https://github.com/CodeNexusLab/NoteHub"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          View NoteHub on GitHub
        </a>
      </section>

      {/* ===== Footer ===== */}

      <section className="about-footer">
        <h2>Built for Learning & Sharing</h2>

        <p>
          NoteHub brings notes, supporting documents, and essential note
          management features together through a centralized platform,
          providing students with an organized way to manage and share study
          resources.
        </p>
      </section>

    </div>
  );
}

export default About;