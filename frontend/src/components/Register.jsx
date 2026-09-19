import { useState } from "react";
import { apiFetch } from "../api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    // Remove extra spaces
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    // Name validation
    if (!cleanName) {
      alert("Please enter your full name! ❌");
      return;
    }

    // Name length validation
    if (cleanName.length < 2) {
      alert("Name must contain at least 2 characters! ❌");
      return;
    }

    // Email validation
    if (!cleanEmail) {
      alert("Please enter your email! ❌");
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      alert("Please enter a valid email address! ❌");
      return;
    }

    // Password validation
    if (!password) {
      alert("Please enter a password! ❌");
      return;
    }

    // Password length validation
    if (password.length < 6) {
      alert(
        "Password must be at least 6 characters long! ❌"
      );
      return;
    }

    // Start loading
    setLoading(true);

    try {
      const response = await apiFetch("/api/register", {
        method: "POST",

        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
          "Registration failed ❌"
        );
        return;
      }

      alert(
        "Account created successfully! 🚀"
      );

      setName("");
      setEmail("");
      setPassword("");

    } catch (error) {
      console.error(
        "Error registering user:",
        error
      );

      alert(
        "Unable to connect to server ❌"
      );

    } finally {
      // Stop loading
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        <h1>Create Account</h1>

        <p>
          Join NoteHub and start sharing your knowledge.
        </p>

        <form
          onSubmit={handleRegister}
          noValidate
        >

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            disabled={loading}
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default Register;