import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./AdminDashboard.css";
import Toast from "./Toast";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import AdminAnalytics from "./AdminAnalytics";
import SecurityCenter from "./SecurityCenter";
import AdminReports from "./AdminReports";
import PlatformSettings from "./PlatformSettings";
import {
  UserRound, Mail, Hash, ShieldCheck, Activity, CalendarDays,
  Clock3, Copy, LockKeyhole, X, Check, ArrowRight, UsersRound, Eye, EyeOff,
} from "lucide-react";

const USERS_PER_PAGE = 10;

const SIDEBAR_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "⌂",
    description: "Platform overview",
    available: true,
  },
  {
    id: "users",
    label: "User Management",
    icon: "♙",
    description: "Manage community",
    available: true,
  },
  {
    id: "notes",
    label: "Notes Management",
    icon: "▤",
    description: "Manage resources",
    available: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "▥",
    description: "Platform insights",
    available: true,
  },
  {
    id: "security",
    label: "Security",
    icon: "♧",
    description: "Account protection",
    available: true,
  },
  {
    id: "reports",
    label: "Reports",
    icon: "▧",
    description: "Activity reports",
    available: true,
  },
  {
  id: "settings",
  label: "Settings",
  icon: "⚙",
  description: "Configure NoteHub platform",
  available: true,
},
];

const notesSelectStyle = {
  minHeight: "42px",
  border: "1px solid rgba(115, 148, 191, 0.35)",
  borderRadius: "10px",
  padding: "8px 12px",
  background: "#080f1c",
  color: "#f3f6ff",
  font: "inherit",
  maxWidth: "100%",
  outline: "none",
};

function SkeletonBlock({ className = "" }) {
  return (
    <span
      className={`admin-skeleton ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Notes Management state
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [notesSearch, setNotesSearch] = useState("");
  const [notesStatus, setNotesStatus] = useState("");
  const [notesResourceType, setNotesResourceType] = useState("");
  const [notesCourse, setNotesCourse] = useState("");
  const [notesSemester, setNotesSemester] = useState("");
  const [notesPage, setNotesPage] = useState(1);
  const [noteFilterPairs, setNoteFilterPairs] = useState([]);
  const [notesLimit] = useState(10);
  const [notesPagination, setNotesPagination] = useState({
    page: 1,
    limit: 10,
    totalNotes: 0,
    totalPages: 0,
  });
  const [processingUserId, setProcessingUserId] = useState(null);
  const [processingNoteId, setProcessingNoteId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message, title) => {
    setToast({ id: Date.now(), type, message, title });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersExpanded, setUsersExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // NEW: Selected user for the details modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [closeAnimating, setCloseAnimating] = useState(false);

// Generate unique course options
const courseOptions = useMemo(() => {
  return [
    ...new Set(
      noteFilterPairs
        .map((item) => String(item.course || "").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));
}, [noteFilterPairs]);

// Generate semesters for the selected course
const semesterOptions = useMemo(() => {
  if (!notesCourse) return [];

  return [
    ...new Set(
      noteFilterPairs
        .filter(
          (item) =>
            String(item.course || "").trim() === notesCourse
        )
        .map((item) => String(item.semester || "").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}, [noteFilterPairs, notesCourse]);

  // =====================================================
  // CURRENT USER
  // =====================================================

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("loggedInUser");

      setLoggedInUser(
        storedUser ? JSON.parse(storedUser) : null
      );
    } catch (err) {
      console.error("Unable to read logged-in user:", err);
      setLoggedInUser(null);
    }
  }, []);

  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = useCallback(async ({ notify = false } = {}) => {
    setUsersLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load registered users."
        );
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
      setCurrentPage(1);
      if (notify) showToast("success", "The user directory is up to date.", "Users refreshed");
    } catch (err) {
      console.error("Admin users fetch error:", err);

      const message = err.message || "Unable to connect to the server.";
      setError(message);
      if (notify) showToast("error", message, "Refresh failed");
    } finally {
      setUsersLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // =====================================================
  // FETCH ADMIN NOTES
  // =====================================================

  const fetchAdminNotes = useCallback(async ({ notify = false } = {}) => {
    setNotesLoading(true);
    setNotesError("");

    try {
      const params = new URLSearchParams({
        page: String(notesPage),
        limit: String(notesLimit),
        sort: "newest",
      });

      if (notesSearch.trim()) params.set("search", notesSearch.trim());
      if (notesStatus) params.set("status", notesStatus);
      if (notesResourceType) params.set("resourceType", notesResourceType);
      if (notesCourse.trim()) params.set("course", notesCourse.trim());
      if (notesSemester.trim()) params.set("semester", notesSemester.trim());

      const response = await apiFetch(`/api/admin/notes?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load notes.");
      }

      setNotes(Array.isArray(data.notes) ? data.notes : []);
      setNotesPagination({
        page: data.pagination?.page ?? notesPage,
        limit: data.pagination?.limit ?? notesLimit,
        totalNotes: data.pagination?.totalNotes ?? 0,
        totalPages: data.pagination?.totalPages ?? 0,
      });

      if (notify) showToast("success", "The notes directory is up to date.", "Notes refreshed");
    } catch (err) {
      console.error("Admin notes fetch error:", err);
      setNotesError(err.message || "Unable to connect to the server.");
      setNotes([]);
      setNotesPagination({ page: 1, limit: notesLimit, totalNotes: 0, totalPages: 0 });
      if (notify) showToast("error", err.message || "Unable to load notes.", "Refresh failed");
    } finally {
      setNotesLoading(false);
    }
  }, [notesPage, notesLimit, notesSearch, notesStatus, notesResourceType, notesCourse, notesSemester, showToast]);

  useEffect(() => {
    if (activeSection === "notes") {
      fetchAdminNotes();
    }
  }, [activeSection, fetchAdminNotes]);


  // Fetch course and semester pairs for the dependent note filters.
  useEffect(() => {
    const fetchNoteFilterOptions = async () => {
      try {
        const response = await apiFetch("/api/admin/note-filter-options");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch note filter options."
          );
        }

        setNoteFilterPairs(Array.isArray(data.pairs) ? data.pairs : []);
      } catch (err) {
        console.error("Admin note filter options fetch error:", err);
      }
    };

    fetchNoteFilterOptions();
  }, []);


  // =====================================================
  // =====================================================
  // HIDE / RESTORE NOTE — SUPERADMIN ONLY
  // =====================================================
  const handleNoteStatusChange = async (note) => {
    const noteId = String(note._id || note.id || "");
    if (!noteId) {
      showToast("error", "Unable to identify this resource.", "Invalid Note");
      return;
    }
    if (processingNoteId) return;

    const currentStatus = note.status || "active";
    const nextStatus = currentStatus === "disabled" ? "active" : "disabled";
    const actionLabel = nextStatus === "disabled" ? "hide" : "restore";
    const resourceName = note.title || note.fileName || "this resource";
    if (!window.confirm(`Are you sure you want to ${actionLabel} “${resourceName}”? ${nextStatus === "disabled" ? "Users will no longer be able to access this resource." : "This resource will become available to users again."}`)) return;

    setProcessingNoteId(noteId);
    try {
      const response = await apiFetch(`/api/admin/notes/${encodeURIComponent(noteId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Unable to ${actionLabel} this resource.`);

      setNotes((previous) => previous.map((item) =>
        String(item._id || item.id || "") === noteId ? { ...item, status: nextStatus } : item
      ));
      showToast("success", data.message || (nextStatus === "disabled" ? "The resource is now hidden from users." : "The resource is available to users again."), nextStatus === "disabled" ? "Note Hidden" : "Note Restored");
      // Refresh so the row respects the currently selected status filter.
      await fetchAdminNotes();
    } catch (err) {
      console.error("Note status update error:", err);
      showToast("error", err.message || "Unable to update this resource. Please try again.", "Action Failed");
    } finally {
      setProcessingNoteId(null);
    }
  };

  useEffect(() => {
    setNotesPage(1);
  }, [notesSearch, notesStatus, notesResourceType, notesCourse, notesSemester]);

  // =====================================================
  // SIDEBAR NAVIGATION
  // =====================================================

  const handleNavigation = (item) => {
    if (!item.available) return;

    setActiveSection(item.id);
    setSidebarOpen(false);

    if (item.id === "dashboard") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (item.id === "analytics") {
  window.scrollTo({ top: 0, behavior: "smooth" });
  return;
}

    if (item.id === "users") {
      setUsersExpanded(true);

      window.setTimeout(() => {
        document
          .getElementById("admin-users")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
      return;
    }

    if (item.id === "notes") {
      setNotesExpanded(true);
      window.setTimeout(() => {
        document
          .getElementById("admin-notes")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setLoggingOut(true);

    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("token");

    navigate("/admin-login", { replace: true });
  };

  // =====================================================
  // USER DETAILS MODAL
  // =====================================================

  const openUserDetails = (user) => {
    setSelectedUser(user);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setCopiedUserId(false);
    setCloseAnimating(false);
  };

  // Animate the close control before dismissing the modal.
  const handleAnimatedClose = () => {
    if (closeAnimating) return;
    setCloseAnimating(true);
    window.setTimeout(() => {
      closeUserDetails();
    }, 260);
  };

  // =====================================================
  // SUSPEND / REACTIVATE USER — SUPERADMIN ONLY
  // =====================================================

  const handleAccountStatusChange = async (user) => {
    const userId = String(user.id || user._id || "");

    if (!userId) {
      showToast("error", "Unable to identify this user.", "Invalid User");
      return;
    }

    if (user.role === "superadmin") {
      showToast(
        "error",
        "Super Admin accounts are protected from suspension.",
        "Action Not Allowed"
      );
      return;
    }

    if (processingUserId) return;

    const currentStatus = user.accountStatus || "active";
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    const actionLabel = nextStatus === "suspended" ? "suspend" : "reactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${user.name || user.email || "this user"}?`
    );

    if (!confirmed) return;

    setProcessingUserId(userId);

    try {
      const response = await apiFetch(
        `/api/admin/users/${encodeURIComponent(userId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountStatus: nextStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Unable to ${actionLabel} this account.`);
      }

      const updatedUser = {
        ...user,
        ...(data.user || {}),
        id: userId,
        accountStatus: nextStatus,
      };

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          String(item.id || item._id || "") === userId
            ? { ...item, ...updatedUser }
            : item
        )
      );

      setSelectedUser((previousUser) => {
        if (!previousUser) return previousUser;
        const selectedId = String(previousUser.id || previousUser._id || "");
        return selectedId === userId
          ? { ...previousUser, ...updatedUser }
          : previousUser;
      });

      showToast(
        "success",
        data.message || (nextStatus === "suspended"
          ? "The user account has been suspended."
          : "The user account has been reactivated."),
        nextStatus === "suspended" ? "User Suspended" : "User Reactivated"
      );

      // Re-fetch canonical server data after the successful update.
      await fetchUsers();
    } catch (err) {
      console.error("Account status update error:", err);
      showToast(
        "error",
        err.message || "Unable to update the account status. Please try again.",
        "Action Failed"
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  const copyUserId = async () => {
    const userId = selectedUser?.id || selectedUser?._id;
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(String(userId));
      setCopiedUserId(true);
      window.setTimeout(() => setCopiedUserId(false), 1800);
    } catch (err) {
      console.error("Unable to copy user ID:", err);
    }
  };

  // Close modal using Escape key
  useEffect(() => {
    if (!selectedUser) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeUserDetails();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Prevent background scrolling while modal is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedUser]);

  // =====================================================
  // SEARCH AND PAGINATION
  // =====================================================

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const role = (user.role || "user").toLowerCase();

      const status = (
        user.accountStatus || "active"
      ).toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        role.includes(query) ||
        status.includes(query)
      );
    });
  }, [users, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedUsers = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * USERS_PER_PAGE;

    return filteredUsers.slice(
      startIndex,
      startIndex + USERS_PER_PAGE
    );
  }, [filteredUsers, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const activeUsers = users.filter(
    (user) =>
      (user.accountStatus || "active") === "active"
  ).length;

  const suspendedUsers = users.filter(
    (user) => user.accountStatus === "suspended"
  ).length;

  const adminUsers = users.filter(
    (user) =>
      user.role === "admin" ||
      user.role === "superadmin"
  ).length;

  // =====================================================
  // HELPERS
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name || !name.trim()) return "U";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const getRoleLabel = (role) => {
    if (role === "superadmin") return "♛ Super Admin";
    if (role === "admin") return "🛡 Admin";

    return "User";
  };

  const getAccountStatus = (status) => {
    return status === "suspended"
      ? "Suspended"
      : "Active";
  };

  const currentDate = new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  const rangeStart =
    filteredUsers.length === 0
      ? 0
      : (safeCurrentPage - 1) * USERS_PER_PAGE + 1;

  const rangeEnd = Math.min(
    safeCurrentPage * USERS_PER_PAGE,
    filteredUsers.length
  );

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className={`admin-layout ${
        sidebarOpen ? "admin-sidebar-is-open" : ""
      }`}
    >
      <div className="nh-toast-viewport" aria-label="Notifications">
        <Toast toast={toast} onClose={dismissToast} />
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}

      <button
        type="button"
        className="admin-sidebar-overlay"
        aria-label="Close navigation menu"
        onClick={() => setSidebarOpen(false)}
        tabIndex={sidebarOpen ? 0 : -1}
      />

      {/* LEFT SIDEBAR */}

      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <button
            type="button"
            className="admin-sidebar-brand"
            onClick={() =>
              handleNavigation({
                id: "dashboard",
                available: true,
              })
            }
            aria-label="Go to dashboard"
          >
            <span className="admin-sidebar-logo">N</span>

            <span className="admin-sidebar-brand-copy">
              <strong>NoteHub</strong>
              <small>ADMIN CONSOLE</small>
            </span>
          </button>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <div className="admin-sidebar-profile">
          <div className="admin-sidebar-avatar">
            {getInitials(loggedInUser?.name)}
          </div>

          <div className="admin-sidebar-profile-info">
            <strong>
              {loggedInUser?.name || "Administrator"}
            </strong>

            <span>
              {loggedInUser?.role === "superadmin"
                ? "Super Administrator"
                : "Administrator"}
            </span>
          </div>

          <span
            className="admin-sidebar-profile-status"
            title="Signed in"
          />
        </div>

        <div className="admin-sidebar-divider" />

        <nav
          className="admin-sidebar-nav"
          aria-label="Admin navigation"
        >
          <span className="admin-sidebar-label">
            WORKSPACE
          </span>

          {SIDEBAR_ITEMS.slice(0, 2).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-sidebar-link ${
                activeSection === item.id
                  ? "admin-sidebar-link-active"
                  : ""
              }`}
              onClick={() => handleNavigation(item)}
              aria-current={
                activeSection === item.id
                  ? "page"
                  : undefined
              }
            >
              <span className="admin-sidebar-icon">
                {item.icon}
              </span>

              <span className="admin-sidebar-link-copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>

              {item.id === "users" && (
                <span className="admin-sidebar-link-count">
                  {usersLoading ? "…" : users.length}
                </span>
              )}
            </button>
          ))}

          <span className="admin-sidebar-label admin-sidebar-label-spaced">
            PLATFORM TOOLS
          </span>

          {SIDEBAR_ITEMS.slice(2).map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-sidebar-link ${
                !item.available ? "admin-sidebar-link-planned" : ""
              } ${
                activeSection === item.id
                  ? "admin-sidebar-link-active"
                  : ""
              }`}
              onClick={() => handleNavigation(item)}
              disabled={!item.available}
              title={
                item.available
                  ? item.label
                  : `${item.label} — Coming Soon`
              }
            >
              <span className="admin-sidebar-icon">
                {item.icon}
              </span>

              <span className="admin-sidebar-link-copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>

              {!item.available && (
                <span className="admin-sidebar-lock">
                  ◷
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-security">
            <span className="admin-sidebar-security-icon">
              ♧
            </span>

            <div>
              <strong>Secure Session</strong>
              <small>Protected admin access</small>
            </div>

            <span className="admin-sidebar-security-dot" />
          </div>

          <button
            type="button"
            className="admin-sidebar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <span>↗</span>
            <span>
              {loggingOut ? "Logging out..." : "Sign Out"}
            </span>
          </button>

          <div className="admin-sidebar-version">
            NOTEHUB ADMIN · V1.0
          </div>
        </div>
      </aside>

      {/* MAIN DASHBOARD CONTENT */}

      <div className="admin-main-area">
        <div className="admin-mobile-topbar">
          <button
            type="button"
            className="admin-mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            ☰
          </button>

          <div className="admin-mobile-brand">
            <span className="admin-sidebar-logo">N</span>
            <strong>NoteHub Admin</strong>
          </div>

          <span
            className="admin-mobile-status"
            title="Admin session"
          >
            ●
          </span>
        </div>
 

{activeSection === "analytics" ? (
  <AdminAnalytics />
) : activeSection === "security" ? (
  <SecurityCenter
    onClose={() => setActiveSection("dashboard")}
  />
) : activeSection === "reports" ? (
  <AdminReports
    onClose={() => setActiveSection("dashboard")}
  />
) : activeSection === "settings" ? (
  <PlatformSettings
    onClose={() => setActiveSection("dashboard")}
  />
) : ( 

  <main className="admin-dashboard">

          {/* HERO */}

          <section className="admin-header admin-hero">
            <div className="admin-brand">
              <div className="admin-brand-icon">N</div>

              <div className="admin-brand-copy">
                <span className="admin-eyebrow">
                  NOTEHUB · CONTROL CENTER
                </span>

                <h1>
                  Admin Dashboard <span>👑</span>
                </h1>

                <p>One platform. Complete control.</p>
              </div>
            </div>

            <div className="admin-header-actions">
              <div className="admin-live-status">
                <span className="admin-live-dot" />
                <span>Admin Session</span>
              </div>

              <button
                type="button"
                className="admin-logout-btn"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "↗ Logout"}
              </button>
            </div>

            <div
              className="admin-hero-decoration"
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </div>
          </section>

          {/* PERSONALIZED WELCOME */}

          <section className="admin-welcome">
            <div className="admin-welcome-content">
              <span className="admin-section-label">
                YOUR COMMAND CENTER
              </span>

              <h2>
                Welcome back,{" "}
                {loggedInUser?.name || "Administrator"}!
                <span className="admin-wave"> 👋</span>
              </h2>

              <p>
                Manage your NoteHub community, monitor accounts,
                and keep your platform running smoothly.
              </p>

              <div className="admin-welcome-meta">
                <span className="admin-role-badge admin-role-superadmin">
                  ♛ {loggedInUser?.role || "Administrator"}
                </span>

                <span className="admin-welcome-date">
                  📅 {currentDate}
                </span>
              </div>
            </div>

            <div className="admin-welcome-emblem">
              <div className="admin-emblem-ring">
                <div className="admin-emblem-core">👑</div>
              </div>

              <span>NOTEHUB ADMIN</span>
              <small>Control • Manage • Protect</small>
            </div>
          </section>

          {/* PLATFORM STATISTICS */}

          <section
            className="admin-overview"
            id="admin-overview"
          >
            <div className="admin-overview-heading">
              <div>
                <span className="admin-section-label">
                  PLATFORM OVERVIEW
                </span>

                <h2>At a glance</h2>

                <p>
                  An overview of your registered community.
                </p>
              </div>

              <button
                type="button"
                className="admin-refresh-btn"
                onClick={() => fetchUsers({ notify: true })}
                disabled={usersLoading}
              >
                {usersLoading ? "Loading..." : "↻ Refresh"}
              </button>
            </div>

            <div className="admin-stats">
              <article className="admin-card admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-icon">👥</span>
                  <span className="admin-stat-caption">
                    COMMUNITY
                  </span>
                </div>

                <p>Total Users</p>
                <h3>{usersLoading ? <SkeletonBlock className="admin-skeleton-number" /> : users.length}</h3>

                <span className="admin-stat-footer">
                  Registered accounts
                </span>
              </article>

              <article className="admin-card admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-icon admin-icon-green">
                    ✓
                  </span>

                  <span className="admin-stat-caption">
                    ACCOUNT HEALTH
                  </span>
                </div>

                <p>Active Users</p>
                <h3>{usersLoading ? <SkeletonBlock className="admin-skeleton-number" /> : activeUsers}</h3>

                <span className="admin-stat-footer">
                  Accounts marked active
                </span>
              </article>

              <article className="admin-card admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-icon admin-icon-purple">
                    🛡️
                  </span>

                  <span className="admin-stat-caption">
                    PERMISSIONS
                  </span>
                </div>

                <p>Administrators</p>
                <h3>{usersLoading ? <SkeletonBlock className="admin-skeleton-number" /> : adminUsers}</h3>

                <span className="admin-stat-footer">
                  Admin and Super Admin accounts
                </span>
              </article>

              <article className="admin-card admin-stat-card">
                <div className="admin-stat-top">
                  <span className="admin-stat-icon admin-icon-red">
                    ⚠️
                  </span>

                  <span className="admin-stat-caption">
                    ACCOUNT STATUS
                  </span>
                </div>

                <p>Suspended Users</p>
                <h3>{usersLoading ? <SkeletonBlock className="admin-skeleton-number" /> : suspendedUsers}</h3>

                <span className="admin-stat-footer">
                  Accounts marked suspended
                </span>
              </article>
            </div>
          </section>

          {/* QUICK ACCESS */}

          <section className="admin-modules-section">
            <div className="admin-overview-heading">
              <div>
                <span className="admin-section-label">
                  MANAGEMENT CENTER
                </span>

                <h2>Quick Access</h2>

                <p>
                  Your administration tools in one place.
                </p>
              </div>
            </div>

            <div className="admin-modules-grid">
              <button
                type="button"
                className="admin-card admin-module-card admin-module-active"
                onClick={() =>
                  handleNavigation({
                    id: "users",
                    available: true,
                  })
                }
              >
                <span className="admin-module-icon">👥</span>

                <span className="admin-module-title">
                  User Management
                </span>

                <span className="admin-module-description">
                  View registered users, roles, and account status.
                </span>

                <span className="admin-module-action">
                  Manage Users <span>→</span>
                </span>
              </button>

              <button
                type="button"
                className="admin-card admin-module-card admin-module-active"
                onClick={() => handleNavigation({ id: "notes", available: true })}
              >
                <span className="admin-module-icon">📝</span>
                <span className="admin-module-title">Notes Management</span>
                <span className="admin-module-description">
                  Review and search resources shared across NoteHub.
                </span>
                <span className="admin-module-action">
                  Manage Notes <span>→</span>
                </span>
              </button>

              <button
  type="button"
  className="admin-card admin-module-card admin-module-active"
  onClick={() =>
    handleNavigation({
      id: "analytics",
      available: true,
    })
  }
>
  <span className="admin-module-icon">📊</span>

  <span className="admin-module-title">
    Platform Analytics
  </span>

  <span className="admin-module-description">
    Explore platform activity, user statistics, and resource distribution.
  </span>

  <span className="admin-module-action">
    View Analytics <span>→</span>
  </span>
</button>


<button
  type="button"
  className="admin-card admin-module-card admin-module-active"
  onClick={() =>
    handleNavigation({
      id: "security",
      available: true,
    })
  }
>
  <span className="admin-module-icon">🔐</span>

  <span className="admin-module-title">
    Security Center
  </span>

  <span className="admin-module-description">
    Review account security and permissions.
  </span>

  <span className="admin-module-action">
    Open Security Center <span>→</span>
  </span>
</button>

            </div>
          </section>

          {/* USER MANAGEMENT */}

          <section
            className="admin-users-section"
            id="admin-users"
          >
            <button
              type="button"
              className="admin-users-toggle"
              onClick={() => {
                setUsersExpanded((previous) => !previous);
                setActiveSection("users");
              }}
              aria-expanded={usersExpanded}
              aria-controls="admin-users-content"
            >
              <div className="admin-users-toggle-info">
                <span className="admin-section-label">
                  COMMUNITY DIRECTORY
                </span>

                <span className="admin-users-title">
                  Registered Users
                </span>

                <span className="admin-users-subtitle">
                  {usersLoading
                    ? "Loading account information..."
                    : `${users.length} registered accounts`}
                </span>
              </div>

              <div className="admin-users-toggle-actions">
                <span className="admin-user-count">
                  {usersLoading ? "..." : users.length}
                </span>

                <span className="admin-expand-label">
                  {usersExpanded ? "Hide Users" : "View Users"}
                </span>

                <span
                  className={`admin-chevron ${
                    usersExpanded ? "admin-chevron-open" : ""
                  }`}
                  aria-hidden="true"
                >
                  ↓
                </span>
              </div>
            </button>

            <div
              id="admin-users-content"
              className={`admin-users-content ${
                usersExpanded ? "admin-users-content-open" : ""
              }`}
              aria-hidden={!usersExpanded}
              inert={!usersExpanded}
            >
              <div className="admin-users-inner">
                <div className="admin-users-heading">
                  <div>
                    <h2>User Directory</h2>

                    <p>
                      Search accounts and review their information.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-refresh-btn"
                    onClick={fetchUsers}
                    disabled={usersLoading}
                  >
                    {usersLoading
                      ? "Loading..."
                      : "↻ Refresh Users"}
                  </button>
                </div>

                <div className="admin-users-toolbar">
                  <label className="admin-search-box">
                    <span aria-hidden="true">⌕</span>

                    <input
                      type="search"
                      placeholder="Search name, email, role or status..."
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      aria-label="Search registered users"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </label>

                  <span className="admin-results-count">
                    {usersLoading
                      ? "Loading..."
                      : `${filteredUsers.length} result${
                          filteredUsers.length === 1 ? "" : "s"
                        }`}
                  </span>
                </div>

                {error && (
                  <div className="admin-error" role="alert">
                    <strong>Unable to load users</strong>
                    <p>{error}</p>

                    <button
                      type="button"
                      onClick={fetchUsers}
                    >
                      Try Again
                    </button>
                  </div>
                )}

                <div className="admin-table-wrapper">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Account Status</th>
                        <th>Joined</th>
                        <th>Details</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {usersLoading ? (
                        <>
                          {Array.from({ length: 5 }, (_, index) => (
                            <tr
                              className="admin-skeleton-row"
                              key={`user-skeleton-${index}`}
                              aria-hidden="true"
                            >
                              <td>
                                <div className="admin-user-cell admin-skeleton-user-cell">
                                  <SkeletonBlock className="admin-skeleton-avatar" />
                                  <div className="admin-user-info admin-skeleton-user-info">
                                    <SkeletonBlock className="admin-skeleton-name" />
                                    <SkeletonBlock className="admin-skeleton-email" />
                                  </div>
                                </div>
                              </td>
                              <td><SkeletonBlock className="admin-skeleton-badge" /></td>
                              <td><SkeletonBlock className="admin-skeleton-badge admin-skeleton-status" /></td>
                              <td><SkeletonBlock className="admin-skeleton-date" /></td>
                              <td><SkeletonBlock className="admin-skeleton-button" /></td>
                              <td><SkeletonBlock className="admin-skeleton-button" /></td>
                            </tr>
                          ))}
                          <tr className="admin-skeleton-status-row">
                            <td colSpan="6" className="admin-table-message" role="status" aria-live="polite">
                              <span className="admin-loading-dot" />
                              Loading registered users...
                            </td>
                          </tr>
                        </>
                      ) : error ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="admin-table-message"
                          >
                            User information could not be loaded.
                          </td>
                        </tr>
                      ) : paginatedUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="admin-table-message"
                          >
                            {search
                              ? "No users match your search."
                              : "No registered users found."}
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user) => {
                          const role = user.role || "user";
                          const status =
                            user.accountStatus || "active";

                          return (
                            <tr key={user.id || user._id}>
                              <td>
                                <div className="admin-user-cell">
                                  <div className="admin-avatar">
                                    {getInitials(user.name)}
                                  </div>

                                  <div className="admin-user-info">
                                    <strong>
                                      {user.name || "Unnamed User"}
                                    </strong>

                                    <span>{user.email}</span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`admin-role-badge admin-role-${role}`}
                                >
                                  {getRoleLabel(role)}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`admin-status-badge admin-status-${status}`}
                                >
                                  <span className="admin-status-dot" />
                                  {getAccountStatus(status)}
                                </span>
                              </td>

                              <td className="admin-date-cell">
                                {formatDate(user.createdAt)}
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="admin-view-details-btn"
                                  onClick={() =>
                                    openUserDetails(user)
                                  }
                                  aria-label={`View details for ${
                                    user.name || user.email
                                  }`}
                                >
                                  👁️ View Details
                                </button>
                              </td>

                              <td>
                                {role === "superadmin" ? (
                                  <span
                                    className="admin-protected-label"
                                    style={{ color: "#9ca3af", fontSize: "0.82rem", whiteSpace: "nowrap" }}
                                  >
                                    🔒 Protected
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className={status === "suspended" ? "admin-reactivate-btn" : "admin-suspend-btn"}
                                    onClick={() => handleAccountStatusChange(user)}
                                    disabled={processingUserId !== null}
                                    style={{
                                      border: "1px solid",
                                      borderColor: status === "suspended" ? "#16a34a" : "#dc2626",
                                      background: status === "suspended" ? "rgba(22, 163, 74, 0.10)" : "rgba(220, 38, 38, 0.10)",
                                      color: status === "suspended" ? "#16a34a" : "#dc2626",
                                      borderRadius: "8px",
                                      padding: "8px 10px",
                                      fontSize: "0.8rem",
                                      fontWeight: 700,
                                      whiteSpace: "nowrap",
                                      cursor: processingUserId !== null ? "wait" : "pointer",
                                      opacity: processingUserId !== null ? 0.65 : 1,
                                    }}
                                    aria-label={`${status === "suspended" ? "Reactivate" : "Suspend"} ${user.name || user.email}`}
                                  >
                                    {processingUserId === String(user.id || user._id)
                                      ? "Processing..."
                                      : status === "suspended"
                                        ? "🔄 Reactivate"
                                        : "🚫 Suspend"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {!usersLoading &&
                  !error &&
                  filteredUsers.length > 0 && (
                    <div className="admin-pagination">
                      <span className="admin-pagination-info">
                        Showing {rangeStart}–{rangeEnd} of{" "}
                        {filteredUsers.length} users
                      </span>

                      <div className="admin-pagination-controls">
                        <button
                          type="button"
                          className="admin-page-btn"
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.max(1, page - 1)
                            )
                          }
                          disabled={safeCurrentPage === 1}
                        >
                          ← Previous
                        </button>

                        <span className="admin-page-indicator">
                          Page {safeCurrentPage} of {totalPages}
                        </span>

                        <button
                          type="button"
                          className="admin-page-btn"
                          onClick={() =>
                            setCurrentPage((page) =>
                              Math.min(totalPages, page + 1)
                            )
                          }
                          disabled={safeCurrentPage === totalPages}
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}

                <div className="admin-table-footer">
                  <span>
                    🔒 User information is available to authorized
                    administrators.
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* NOTES MANAGEMENT */}
          <section className="admin-users-section" id="admin-notes">
            <button
              type="button"
              className="admin-users-toggle admin-notes-toggle"
              onClick={() => {
                setNotesExpanded((previous) => !previous);
                setActiveSection("notes");
              }}
              aria-expanded={notesExpanded}
              aria-controls="admin-notes-content"
            >
              <div className="admin-users-toggle-info">
                <span className="admin-section-label">RESOURCE DIRECTORY</span>
                <span className="admin-users-title">Notes Management</span>
                <span className="admin-users-subtitle">
                  {notesLoading
                    ? "Loading resource information..."
                    : `${notesPagination.totalNotes} shared resources`}
                </span>
              </div>

              <div className="admin-users-toggle-actions">
                <span className="admin-user-count">
                  {notesLoading ? "..." : notesPagination.totalNotes}
                </span>
                <span className="admin-expand-label">
                  {notesExpanded ? "Hide Notes" : "View Notes"}
                </span>
                <span
                  className={`admin-chevron ${notesExpanded ? "admin-chevron-open" : ""}`}
                  aria-hidden="true"
                >
                  ↓
                </span>
              </div>
            </button>

            <div
              id="admin-notes-content"
              className={`admin-users-content ${notesExpanded ? "admin-users-content-open" : ""}`}
              aria-hidden={!notesExpanded}
              inert={!notesExpanded}
            >
              <div className="admin-users-inner" style={{ padding: "28px" }}>
              <div className="admin-users-heading">
                <div>
                  <span className="admin-section-label">RESOURCE DIRECTORY</span>
                  <h2>Notes Management</h2>
                  <p>Search, filter, and review resources shared across NoteHub.</p>
                </div>
                <button
                  type="button"
                  className="admin-refresh-btn"
                  onClick={() => fetchAdminNotes({ notify: true })}
                  disabled={notesLoading}
                >
                  {notesLoading ? "Loading..." : "↻ Refresh Notes"}
                </button>
              </div>

              <div className="admin-users-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
                <label className="admin-search-box" style={{ flex: "1 1 240px" }}>
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="text"
                    placeholder="Search title, subject, owner, course..."
                    value={notesSearch}
                    onChange={(event) => setNotesSearch(event.target.value)}
                    aria-label="Search notes"
                  />
                  {notesSearch && (
                    <button type="button" onClick={() => setNotesSearch("")} aria-label="Clear notes search">×</button>
                  )}
                </label>

                <select aria-label="Filter notes by status" value={notesStatus} onChange={(event) => setNotesStatus(event.target.value)} style={notesSelectStyle}>
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>

                <select aria-label="Filter notes by resource type" value={notesResourceType} onChange={(event) => setNotesResourceType(event.target.value)} style={notesSelectStyle}>
                  <option value="">All resource types</option>
                  <option value="note">Notes</option>
                  <option value="previous-paper">Previous papers</option>
                  <option value="other">Other</option>
                </select>

                <select
                  aria-label="Filter by course"
                  value={notesCourse}
                  onChange={(event) => {
                    setNotesCourse(event.target.value);
                    setNotesSemester("");
                    setNotesPage(1);
                  }}
                  style={notesSelectStyle}
                >
                  <option value="">All courses</option>
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by semester"
                  value={notesSemester}
                  onChange={(event) => {
                    setNotesSemester(event.target.value);
                    setNotesPage(1);
                  }}
                  style={notesSelectStyle}
                  disabled={!notesCourse}
                >
                  <option value="">All semesters</option>
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>

                {(notesStatus || notesResourceType || notesCourse.trim() || notesSemester.trim()) && (
                  <button
                    type="button"
                    className="admin-page-btn"
                    onClick={() => {
                      setNotesStatus("");
                      setNotesResourceType("");
                      setNotesCourse("");
                      setNotesSemester("");
                      setNotesPage(1);
                    }}
                    disabled={notesLoading}
                    aria-label="Clear all note filters"
                  >
                    Clear Filters
                  </button>
                )}

                <span className="admin-results-count">
                  {notesLoading ? "Loading..." : `${notesPagination.totalNotes} resource${notesPagination.totalNotes === 1 ? "" : "s"}`}
                </span>
              </div>

              {notesError && (
                <div className="admin-error" role="alert">
                  <strong>Unable to load notes</strong>
                  <p>{notesError}</p>
                  <button type="button" onClick={() => fetchAdminNotes()} disabled={notesLoading}>Try Again</button>
                </div>
              )}

              <div className="admin-table-wrapper">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Owner</th>
                      <th>Course / Semester</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notesLoading ? (
                      <tr><td colSpan="7" className="admin-table-message" role="status">Loading notes...</td></tr>
                    ) : notesError ? (
                      <tr><td colSpan="7" className="admin-table-message">Notes could not be loaded.</td></tr>
                    ) : notes.length === 0 ? (
                      <tr><td colSpan="7" className="admin-table-message">{notesSearch || notesStatus || notesResourceType || notesCourse || notesSemester ? "No notes match your filters." : "No notes found."}</td></tr>
                    ) : (
                      notes.map((note) => {
                        const noteId = note._id || note.id;
                        const status = note.status || "active";
                        const resourceType = note.resourceType || "note";
                        return (
                          <tr key={noteId}>
                            <td>
                              <div className="admin-user-info">
                                <strong>{note.title || "Untitled resource"}</strong>
                                <span>{note.subject || note.fileName || "No subject provided"}</span>
                              </div>
                            </td>
                            <td>
                              <div className="admin-user-info">
                                <strong>{note.ownerName || "Unknown owner"}</strong>
                                <span>{note.ownerEmail || "No email available"}</span>
                              </div>
                            </td>
                            <td>
                              <div className="admin-user-info">
                                <strong>{note.course || "—"}</strong>
                                <span>{note.semester ? `Semester ${note.semester}` : (note.stream || "—")}</span>
                              </div>
                            </td>
                            <td><span className="admin-role-badge">{resourceType === "previous-paper" ? "Previous Paper" : resourceType === "other" ? "Other" : "Note"}</span></td>
                            <td>
                              <span className={`admin-status-badge ${status === "disabled" ? "admin-status-suspended" : "admin-status-active"}`}>
                                <span className="admin-status-dot" />{status === "disabled" ? "Disabled" : "Active"}
                              </span>
                            </td>
                            <td className="admin-date-cell">{formatDate(note.createdAt)}</td>
                            <td>
                              <button
                                type="button"
                                className="admin-note-visibility-btn"
                                onClick={() => handleNoteStatusChange(note)}
                                disabled={processingNoteId !== null || notesLoading}
                                title={status === "disabled" ? "Restore note for users" : "Hide note from users"}
                                aria-label={`${status === "disabled" ? "Restore" : "Hide"} ${note.title || "resource"}`}
                              >
                                {processingNoteId === String(noteId)
                                  ? "Saving..."
                                  : status === "disabled"
                                    ? <><Eye size={15} aria-hidden="true" /> Restore</>
                                    : <><EyeOff size={15} aria-hidden="true" /> Hide</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {!notesLoading && !notesError && notesPagination.totalNotes > 0 && (
                <div className="admin-pagination">
                  <span className="admin-pagination-info">
                    Showing {((notesPagination.page - 1) * notesPagination.limit) + 1}–{Math.min(notesPagination.page * notesPagination.limit, notesPagination.totalNotes)} of {notesPagination.totalNotes} resources
                  </span>
                  <div className="admin-pagination-controls">
                    <button type="button" className="admin-page-btn" onClick={() => setNotesPage((page) => Math.max(1, page - 1))} disabled={notesLoading || notesPagination.page <= 1}>← Previous</button>
                    <span className="admin-page-indicator">Page {notesPagination.page} of {Math.max(1, notesPagination.totalPages)}</span>
                    <button type="button" className="admin-page-btn" onClick={() => setNotesPage((page) => Math.min(Math.max(1, notesPagination.totalPages), page + 1))} disabled={notesLoading || notesPagination.page >= notesPagination.totalPages}>Next →</button>
                  </div>
                </div>
              )}

              <div className="admin-table-footer">
                <span>🔒 Resource information is available to authorized administrators.</span>
              </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}

          <footer className="admin-footer">
            <div className="admin-footer-brand">
              <span className="admin-footer-logo">N</span>

              <span>
                <strong>NoteHub</strong> Admin Center
              </span>
            </div>

            <span>
  Manage responsibly. Build a better learning community.
</span>
</footer>
</main>
)}
</div>

      {/* USER DETAILS MODAL — Lucide icon redesign */}
      {selectedUser && (
        <div
          className="admin-user-modal-overlay nhud-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeUserDetails();
          }}
        >
          <style>{`
            .nhud-close {
              transition: color 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
              transform-origin: center;
            }
            .nhud-close:hover {
              color: #f87171;
              border-color: #ef4444;
              background: rgba(239, 68, 68, 0.12);
              box-shadow: 0 0 18px rgba(239, 68, 68, 0.22);
            }
            .nhud-close.nhud-close-animating {
              color: #ef4444 !important;
              border-color: #ef4444 !important;
              background: rgba(239, 68, 68, 0.18) !important;
              box-shadow: 0 0 22px rgba(239, 68, 68, 0.35);
              animation: nhudCloseSpin 260ms ease-in-out forwards;
              pointer-events: none;
            }
            @keyframes nhudCloseSpin {
              0% { transform: rotate(0deg) scale(1); }
              55% { transform: rotate(200deg) scale(0.88); }
              100% { transform: rotate(360deg) scale(1); }
            }
            @media (prefers-reduced-motion: reduce) {
              .nhud-close, .nhud-close.nhud-close-animating { animation-duration: 1ms; transition-duration: 1ms; }
            }
          `}</style>
          <section
            className="admin-user-modal nhud-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-modal-title"
          >
            <header className="nhud-header">
              <div>
                <span className="nhud-eyebrow">Community Directory</span>
                <h2 className="nhud-title" id="admin-user-modal-title">User Details</h2>
                <p className="nhud-subtitle">Detailed information about the registered user</p>
              </div>
              <button type="button" className={`nhud-close ${closeAnimating ? "nhud-close-animating" : ""}`} onClick={handleAnimatedClose} aria-label="Close user details" autoFocus disabled={closeAnimating}>
                <X size={21} strokeWidth={2.2} />
              </button>
            </header>

            <div className="nhud-hero">
              <div className="nhud-avatar-wrap">
                <span className="nhud-avatar-ring" />
                <div className="nhud-avatar">{getInitials(selectedUser.name)}</div>
                <span className="nhud-online-indicator" />
              </div>
              <div className="nhud-hero-content">
                <p className="nhud-profile-label">Registered Member</p>
                <h3 className="nhud-title">{selectedUser.name || "Unnamed User"}</h3>
                <p className="nhud-hero-email">{selectedUser.email || "No email available"}</p>
                <div className="nhud-badges">
                  <span className="nhud-role-badge"><UsersRound size={14} /> {getRoleLabel(selectedUser.role || "user").replace(/^♛\s*|^🛡\s*/, "")}</span>
                  <span className="nhud-status-badge"><Activity size={14} /> {getAccountStatus(selectedUser.accountStatus || "active")}</span>
                </div>
              </div>
              <div className="nhud-hero-art" aria-hidden="true">
                <span className="nhud-art-orbit" />
                <span className="nhud-art-orbit nhud-art-orbit-two" />
                <div className="nhud-art-core"><UsersRound size={29} /></div>
                <span className="nhud-art-spark nhud-art-spark-one" />
                <span className="nhud-art-spark nhud-art-spark-two" />
              </div>
            </div>

            <div className="nhud-section-heading">
              <h3>Profile Overview</h3>
              <span className="nhud-secure-label"><LockKeyhole size={12} /> Secure Data</span>
            </div>

            <div className="nhud-grid">
              <article className="nhud-detail nhud-blue">
                <span className="nhud-detail-icon"><UserRound /></span>
                <div className="nhud-detail-content"><span className="nhud-label">Full Name</span><strong className="nhud-value">{selectedUser.name || "Not available"}</strong></div>
              </article>
              <article className="nhud-detail nhud-purple">
                <span className="nhud-detail-icon"><Mail /></span>
                <div className="nhud-detail-content"><span className="nhud-label">Email Address</span><strong className="nhud-value">{selectedUser.email || "Not available"}</strong></div>
              </article>
              <article className="nhud-detail nhud-gold">
                <span className="nhud-detail-icon"><Hash /></span>
                <div className="nhud-detail-content"><span className="nhud-label">User ID</span><strong className="nhud-value nhud-id-value">{selectedUser.id || selectedUser._id || "Not available"}
                  {(selectedUser.id || selectedUser._id) && <button type="button" className="nhud-copy-btn" onClick={copyUserId}>{copiedUserId ? <Check size={14} /> : <Copy size={14} />}{copiedUserId ? "Copied" : "Copy"}</button>}
                </strong></div>
              </article>
              <article className="nhud-detail nhud-pink">
                <span className="nhud-detail-icon"><ShieldCheck /></span>
                <div className="nhud-detail-content"><span className="nhud-label">Account Role</span><strong className="nhud-value">{getRoleLabel(selectedUser.role || "user").replace(/^♛\s*|^🛡\s*/, "")}</strong></div>
              </article>
              <article className="nhud-detail nhud-green">
                <span className="nhud-detail-icon"><Activity /></span>
                <div className="nhud-detail-content"><span className="nhud-label">Account Status</span><strong className="nhud-value nhud-status-indicator">{getAccountStatus(selectedUser.accountStatus || "active")}</strong></div>
              </article>
              <article className="nhud-detail nhud-violet">
                <span className="nhud-detail-icon"><CalendarDays /></span>
                <div className="nhud-detail-content"><span className="nhud-label">Registration Date</span><strong className="nhud-value">{formatDate(selectedUser.createdAt)}</strong></div>
              </article>
              <article className="nhud-detail nhud-cyan">
                <span className="nhud-detail-icon"><Clock3 /></span>
                <div className="nhud-detail-content"><span className="nhud-label">Last Updated</span><strong className="nhud-value">{formatDate(selectedUser.updatedAt)}</strong></div>
              </article>
            </div>

            <footer className="nhud-footer">
              <div className="nhud-privacy"><span className="nhud-lock-icon"><LockKeyhole size={16} /></span><span><strong>Authorized administrator access</strong><br />This information is confidential and restricted.</span></div>
              <button type="button" className="nhud-done" onClick={closeUserDetails}><X size={17} /> Close Details <ArrowRight size={15} /></button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;  