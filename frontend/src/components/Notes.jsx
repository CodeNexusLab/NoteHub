import { apiFetch } from "../api";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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

  // Search notes
  const filteredNotes = notes.filter((note) => {
    const searchText =
      search.toLowerCase();

    return (
      (note.title || "")
        .toLowerCase()
        .includes(searchText) ||
      (note.subject || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  return (
    <div className="notes-page">

      <div className="notes-header">

        <h1>Explore Notes</h1>

        <p>
          Discover useful notes and learning resources.
        </p>

        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      <div className="notes-grid">

        {loading ? (
          <p className="no-notes">
            Loading notes... ⏳
          </p>

        ) : filteredNotes.length === 0 ? (
          <p className="no-notes">
            No notes found 🔍
          </p>

        ) : (
          filteredNotes.map((note) => (

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

              {/* View Only */}
              <Link
                to={`/note/${note._id}`}
              >
                <button>
                  View Notes
                </button>
              </Link>

            </div>

          ))
        )}

      </div>

    </div>
  );
}

export default Notes;