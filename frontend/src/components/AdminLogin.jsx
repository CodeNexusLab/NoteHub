import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      alert("Please enter your email and password ❌");
      return;
    }

    setLoading(true);

    try {
      // Authenticate using the existing backend login API.
      const response = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed ❌");
        return;
      }

      // Store credentials temporarily so we can verify
      // administrative access using the protected API.
      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "loggedInUser",
        JSON.stringify(data.user)
      );

      // The backend must confirm the actual role.
      const verifyResponse = await apiFetch(
        "/api/admin/verify"
      );

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");

        alert(
          verifyData.message ||
          "You do not have Super Admin access ❌"
        );

        return;
      }

      alert("Super Admin login successful! 👑");

      navigate("/admin", { replace: true });
    } catch (error) {
      console.error("Admin login error:", error);

      alert("Unable to connect to server ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Admin Login 👑</h1>

        <p>
          Sign in with your authorized Super Admin account.
        </p>

        <form onSubmit={handleLogin} noValidate>
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;