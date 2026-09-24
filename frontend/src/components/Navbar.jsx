import { NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const loggedInUser =
    JSON.parse(localStorage.getItem("loggedInUser"));

  const handleLogout = () => {
    // Remove logged-in user information
    localStorage.removeItem("loggedInUser");

    // Remove JWT token
    localStorage.removeItem("token");

    alert("Logged out successfully!");

    navigate("/login");
  };

  // Active navigation styling
  const navLinkClass = ({ isActive }) =>
    `nav-item ${isActive ? "active" : ""}`;

  return (
    <nav className="navbar">
      {/* ===== Brand ===== */}
      <NavLink to="/" className="navbar-brand">
        <span className="brand-dot"></span>
        <span>NoteHub</span>
      </NavLink>

      {/* ===== Navigation ===== */}
      <div className="nav-links">

        <NavLink to="/" className={navLinkClass}>
          Home
        </NavLink>

        <NavLink to="/notes" className={navLinkClass}>
          Notes
        </NavLink>

        <NavLink to="/about" className={navLinkClass}>
          About
        </NavLink>

        <NavLink to="/contact" className={navLinkClass}>
          Contact
        </NavLink>

        {loggedInUser ? (
          <>
            {/* ===== User Identity ===== */}
            <div className="nav-user">
              <span className="user-status"></span>
              <span>Hi, {loggedInUser.name} 👋</span>
            </div>

            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>

            <NavLink to="/my-notes" className={navLinkClass}>
              My Notes
            </NavLink>

            {/* ===== Primary Action ===== */}
            <NavLink
              to="/create-note"
              className="nav-create"
            >
              <span>＋</span>
              Create Note
            </NavLink>

            {/* ===== Logout ===== */}
            <button
              className="nav-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={navLinkClass}>
              Login
            </NavLink>

            <NavLink to="/register" className="nav-register">
              Register
            </NavLink>
          </>
        )}

      </div>
    </nav>
  );
}

export default Navbar;