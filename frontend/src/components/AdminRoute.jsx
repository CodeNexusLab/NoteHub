import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const storedUser = localStorage.getItem("loggedInUser");

  let loggedInUser = null;

  try {
    loggedInUser = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error("Invalid user data:", error);
  }

  // User must be logged in
  if (!loggedInUser) {
    return <Navigate to="/admin-login" replace />;
  }

  // Only administrators can access Admin routes
  const allowedRoles = ["admin", "superadmin"];

  if (!allowedRoles.includes(loggedInUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;