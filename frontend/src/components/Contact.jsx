import { useState } from "react";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter your name! ⚠️");
      return;
    }

    if (!formData.email.trim()) {
      alert("Please enter your email! ⚠️");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert("Please enter a valid email address! ⚠️");
      return;
    }

    if (!formData.message.trim()) {
      alert("Please enter your message! ⚠️");
      return;
    }

    alert(
      "Form validated successfully! 🚀\n\nMessage sending will be connected later."
    );
  };

  return (
    <main className="contact-page">

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-badge">
          ✦ We'd Love to Hear From You
        </div>

        <h1>
          Let's Connect with <span>NoteHub</span>
        </h1>

        <p>
          Have a question, suggestion, or feedback?
          Reach out to us and let us know what you think.
        </p>
      </section>

      {/* Contact Options */}
      <section className="contact-options">

        <div className="contact-option-card">
          <div className="contact-icon">📧</div>

          <h3>Email</h3>

          <p>
            Have a question or feedback?
          </p>

          <span>Contact us</span>
        </div>

        <div className="contact-option-card">
          <div className="contact-icon">👨‍💻</div>

          <h3>Developer</h3>

          <p>
            Built and maintained by
          </p>

          <span>Sahil Joshi</span>
        </div>

        <div className="contact-option-card">
  <div className="contact-icon">🔗</div>
  <h3>GitHub</h3>
  <p>Explore the NoteHub project</p>

  <a
    href="https://github.com/CodeNexusLab/NoteHub"
    target="_blank"
    rel="noopener noreferrer"
  >
    View Profile
  </a>
</div>

      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section">

        <div className="contact-form-heading">
          <div className="contact-section-badge">
            GET IN TOUCH
          </div>

          <h2>Have Something to Say?</h2>

          <p>
            Your feedback helps us make NoteHub better.
          </p>
        </div>

        <div className="contact-form-card">

          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >

            {/* Name */}
            <div className="contact-field">
              <label htmlFor="name">
                Name
              </label>

              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div className="contact-field">
              <label htmlFor="email">
                Email
              </label>

              <input
                type="text"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Message */}
            <div className="contact-field">
              <label htmlFor="message">
                Message
              </label>

              <textarea
                id="message"
                name="message"
                placeholder="Write your message..."
                rows="6"
                value={formData.message}
                onChange={handleChange}
              ></textarea>
            </div>

            <button
              type="submit"
              className="contact-submit-btn"
            >
              Send Message <span>→</span>
            </button>

          </form>

        </div>

      </section>

      {/* Bottom Message */}
      <section className="contact-bottom">
        <h3>Building a better way to share knowledge.</h3>

        <p>
          NoteHub — A Centralized Notes Sharing Platform.
        </p>
      </section>

    </main>
  );
}

export default Contact;