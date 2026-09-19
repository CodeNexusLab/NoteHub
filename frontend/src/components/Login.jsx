import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Remove extra spaces
    const cleanEmail = email.trim();

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
      alert("Please enter your password! ❌");
      return;
    }

    if (password.length < 6) {
      alert(
        "Password must be at least 6 characters long! ❌"
      );
      return;
    }

    // Start loading
    setLoading(true);

    try {
      const response = await apiFetch("/api/login", {
        method: "POST",

        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
          "Invalid email or password!"
        );
        return;
      }

      localStorage.setItem(
        "loggedInUser",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "token",
        data.token
      );

      alert("Login successful! 🚀");

      navigate("/");

    } catch (error) {
      console.error(
        "Error logging in:",
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
    <div className="login-page">
      <div className="login-card">

        <h1>Welcome Back</h1>

        <p>
          Login to continue to NoteHub.
        </p>

        <form
          onSubmit={handleLogin}
          noValidate
        >

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
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default Login;