import EditNote from "./components/EditNote";
import DSA from "./components/DSA";
import { Link } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Notes from "./components/Notes";
import CreateNote from "./components/CreateNote";
import NoteDetails from "./components/NoteDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";

import MyNotes from "./components/MyNotes";
import About from "./components/About";
import Contact from "./components/Contact";
import Profile from "./components/Profile";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";

import Maintenance from "./components/Maintenance";

// =====================================================
// 404 PAGE
// =====================================================

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page Not Found 😕</h2>
      <p>The page you are looking for does not exist.</p>

      <Link to="/">
        <button>Go Home</button>
      </Link>
    </div>
  );
}

// =====================================================
// APP CONTENT
// =====================================================

function AppContent() {
  const location = useLocation();

  // Keep admin pages accessible during maintenance.
  const isAdminPage =
    location.pathname === "/admin" ||
    location.pathname === "/admin-login";

  return (
    <Maintenance bypass={isAdminPage}>
      <>
        {/* Hide the normal Navbar on admin pages. */}
        {!isAdminPage && <Navbar />}

        <Routes>
          {/* Public Routes */}

          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/about" element={<About />} />

          <Route path="/contact" element={<Contact />} />

          {/* Admin Routes */}

          <Route
            path="/admin-login"
            element={<AdminLogin />}
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Protected User Routes */}

          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-notes"
            element={
              <ProtectedRoute>
                <MyNotes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dsa"
            element={
              <ProtectedRoute>
                <DSA />
              </ProtectedRoute>
            }
          />

          <Route
            path="/create-note"
            element={
              <ProtectedRoute>
                <CreateNote />
              </ProtectedRoute>
            }
          />

          <Route
            path="/note/:id"
            element={
              <ProtectedRoute>
                <NoteDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/note/:id/edit"
            element={
              <ProtectedRoute>
                <EditNote />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </>
    </Maintenance>
  );
}

// =====================================================
// MAIN APP
// =====================================================

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;