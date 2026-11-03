const API_URL = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://notehub-0jad.onrender.com";

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    ...(token && {
      Authorization: `Bearer ${token}`,
    }),
    ...options.headers,
  };

  // Add Content-Type only when a request has a body
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  // Handle authentication failures separately
  if (response.status === 401) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("token");

    // Avoid redirecting repeatedly if already on login pages
    const currentPath = window.location.pathname;

    if (
      currentPath !== "/login" &&
      currentPath !== "/admin-login"
    ) {
      window.location.href = "/login";
    }
  }

  // IMPORTANT:
  // A 403 means the request is forbidden.
  // Do not automatically log out the user.
  // The calling component can display the error message.

  return response;
};