import { Link, useNavigate } from "react-router-dom";

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

  return (
    <nav>
      <h2>NoteHub</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/notes">Notes</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>

        {loggedInUser ? (
          <>
            <span>Hi, {loggedInUser.name} 👋</span>

            <Link to="/my-notes">My Notes</Link>

            <Link to="/create-note">Create Note</Link>

            <button onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;