import { apiFetch } from "../api";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function MyNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loggedInUser =
    JSON.parse(localStorage.getItem("loggedInUser"));

  // Fetch all notes from backend
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await apiFetch("/api/notes");

        const data = await response.json();

        if (!response.ok) {
          console.error(
            data.message || "Failed to fetch notes ❌"
          );
          setNotes([]);
          return;
        }

        setNotes(data);
      } catch (error) {
        console.error(
          "Error fetching notes:",
          error
        );

        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // Filter user's own notes
  const myNotes = notes.filter(
    (note) =>
      note.ownerEmail === loggedInUser?.email
  );

  // Delete note
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await apiFetch(
        `/api/notes/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
          "Failed to delete note ❌"
        );
        return;
      }

      if (
        data.message ===
        "Note deleted successfully 🗑️"
      ) {
        alert(data.message);

        setNotes((currentNotes) =>
          currentNotes.filter(
            (note) => note._id !== id
          )
        );
      }

    } catch (error) {
      console.error(
        "Error deleting note:",
        error
      );

      alert(
        "Unable to connect to server ❌"
      );
    }
  };

  return (
    <div className="notes-page">

      <div className="notes-header">
        <h1>My Notes</h1>

        <p>
          Notes uploaded by you.
        </p>
      </div>

      <div className="notes-grid">

        {loading ? (
          <p className="no-notes">
            Loading your notes... ⏳
          </p>
        ) : myNotes.length === 0 ? (
          <p>
            You haven't uploaded any notes yet.
          </p>
        ) : (
          myNotes.map((note) => (

            <div
              className="note-card"
              key={note._id}
            >

              <h3>{note.title}</h3>

              <p>
                <strong>Subject:</strong>{" "}
                {note.subject}
              </p>

              <p>
                <strong>Uploaded by:</strong>{" "}
                {note.ownerName || "Unknown"}
              </p>

              <p>{note.content}</p>

              {note.fileName && (
                <p>
                  📎 {note.fileName}
                </p>
              )}

              <Link
                to={`/note/${note._id}`}
              >
                <button>
                  View Notes
                </button>
              </Link>

              <Link
                to={`/note/${note._id}/edit`}
              >
                <button>
                  Edit
                </button>
              </Link>

              <button
                onClick={() =>
                  handleDelete(note._id)
                }
              >
                Delete
              </button>

            </div>

          ))
        )}

      </div>
    </div>
  );
}

export default MyNotes;