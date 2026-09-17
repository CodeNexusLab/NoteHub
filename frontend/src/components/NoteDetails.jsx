import { apiFetch } from "../api";
import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";

function NoteDetails() {
  const { id } = useParams();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===============================
  // FETCH SINGLE NOTE
  // ===============================

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await apiFetch(
          `/api/notes/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message || "Failed to load note ❌"
          );
          return;
        }

        setNote(data);

      } catch (error) {
        console.error(
          "Error fetching note:",
          error
        );

        setError(
          "Unable to connect to server ❌"
        );

      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  // ===============================
  // LOADING STATE
  // ===============================

  if (loading) {
    return (
      <div className="note-details-page">
        <div className="note-details-card">
          <h2>Loading note... ⏳</h2>
        </div>
      </div>
    );
  }

  // ===============================
  // ERROR STATE
  // ===============================

  if (error) {
    return (
      <div className="note-details-page">
        <div className="note-details-card">

          <h2>Unable to load note ❌</h2>

          <p>{error}</p>

          <Link to="/notes">
            <button>← Back to Notes</button>
          </Link>

        </div>
      </div>
    );
  }

  // ===============================
  // NOTE NOT FOUND
  // ===============================

  if (!note) {
    return (
      <div className="note-details-page">
        <div className="note-details-card">

          <h2>Note not found ❌</h2>

          <p>
            The note you're looking for does not exist.
          </p>

          <Link to="/notes">
            <button>← Back to Notes</button>
          </Link>

        </div>
      </div>
    );
  }

  // ===============================
  // OPEN FILE
  // ===============================

  const handleOpenFile = async () => {
    try {
      const response = await fetch(note.fileData);

      const blob = await response.blob();

      const fileUrl =
        URL.createObjectURL(blob);

      window.open(fileUrl, "_blank");

      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 60000);

    } catch (error) {
      console.error(
        "Error opening file:",
        error
      );

      alert(
        "Unable to open file! ❌"
      );
    }
  };

  // ===============================
  // PAGE
  // ===============================

  return (
    <div className="note-details-page">
      <div className="note-details-card">

        <h1>{note.title}</h1>

        <h3>
          Subject: {note.subject}
        </h3>

        <p>{note.content}</p>

        {note.fileName && note.fileData && (
          <div>

            <p>
              📎 Attached File:{" "}
              <strong>
                {note.fileName}
              </strong>
            </p>

            <button
              onClick={handleOpenFile}
            >
              Open File
            </button>

            <a
              href={note.fileData}
              download={note.fileName}
            >
              <button>
                Download File
              </button>
            </a>

          </div>
        )}

        <Link to="/notes">
          <button>
            ← Back to Notes
          </button>
        </Link>

      </div>
    </div>
  );
}

export default NoteDetails;