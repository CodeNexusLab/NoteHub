const API_URL = "https://notehub-0jad.onrender.com";

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
        ...options.headers,
      },
    }
  );

  // Handle invalid or expired JWT
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("token");

    window.location.href = "/login";

    return response;
  }

  return response;
};