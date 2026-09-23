import EditNote from "./components/EditNote";
import DSA from "./components/DSA";
// import NoteDetail from "./components/NoteDetail";
import { Link } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Notes from "./components/Notes";
import CreateNote from "./components/CreateNote";
import NoteDetails from "./components/NoteDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import MyNotes from "./components/MyNotes";
import About from "./components/About";
import Contact from "./components/Contact";

function Home() {

  return (
    <>
      <header>
        <h1>NoteHub</h1>
        <p>Your personal notes app</p>
      </header>

      <main>
        <h2>Latest Notes</h2>

        <div>
          <div className="home-card">
            <h3>Data Structures & Algorithms</h3>
            <p>Learn important concepts and algorithms.</p>
            <Link className="explore-link" to="/notes">
              Explore
            </Link>
          </div>

          <div className="home-card">
            <h3>Web Development</h3>
            <p>Learn HTML, CSS, JavaScript and React.</p>
            <Link className="explore-link" to="/notes">
              Explore
            </Link>
          </div>

          <div className="home-card">
            <h3>Database Management</h3>
            <p>Learn SQL and database concepts.</p>
            <Link className="explore-link" to="/notes">
              Explore
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

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

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Notes />
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
          path="/dsa"
          element={
            <ProtectedRoute>
              <DSA />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/create-note"
          element={
            <ProtectedRoute>
              <CreateNote />
            </ProtectedRoute>
          }
        />

        {/* <Route
          path="/notes/data-structures"
          element={<NoteDetail />}
        /> */}

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

          <Route path="/about" element={<About />} />

          <Route path="/contact" element={<Contact />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;