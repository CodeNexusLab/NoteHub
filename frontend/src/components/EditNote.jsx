import { apiFetch } from "../api";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";

function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loggedInUser =
    JSON.parse(localStorage.getItem("loggedInUser"));

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

        setTitle(data.title || "");
        setSubject(data.subject || "");
        setContent(data.content || "");

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

  const isOwner =
    note?.ownerEmail === loggedInUser?.email;

  // ===============================
  // UPDATE NOTE
  // ===============================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!note) {
      return;
    }

    if (!isOwner) {
      alert(
        "You can only edit your own notes!"
      );
      return;
    }

    setUpdating(true);

    // ===============================
    // NEW FILE SELECTED
    // ===============================

    if (file) {
      const reader = new FileReader();

      reader.onload = async () => {
        const updatedNote = {
          ...note,
          title,
          subject,
          content,
          fileName: file.name,
          fileData: reader.result,
        };

        try {
          const response = await apiFetch(
            `/api/notes/${id}`,
            {
              method: "PUT",
              body: JSON.stringify(updatedNote),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            alert(
              data.message ||
              "Failed to update note ❌"
            );
            return;
          }

          alert(
            "Note updated successfully! ✏️"
          );

          navigate("/notes");

        } catch (error) {
          console.error(
            "Error updating note:",
            error
          );

          alert(
            "Unable to connect to server ❌"
          );

        } finally {
          setUpdating(false);
        }
      };

      reader.readAsDataURL(file);

      return;
    }

    // ===============================
    // NO NEW FILE SELECTED
    // ===============================

    const updatedNote = {
      ...note,
      title,
      subject,
      content,
    };

    try {
      const response = await apiFetch(
        `/api/notes/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedNote),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
          "Failed to update note ❌"
        );
        return;
      }

      alert(
        "Note updated successfully! ✏️"
      );

      navigate("/notes");

    } catch (error) {
      console.error(
        "Error updating note:",
        error
      );

      alert(
        "Unable to connect to server ❌"
      );

    } finally {
      setUpdating(false);
    }
  };

  // ===============================
  // LOADING STATE
  // ===============================

  if (loading) {
    return (
      <div className="edit-note-page">
        <div className="edit-note-card">
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
      <div className="edit-note-page">
        <div className="edit-note-card">
          <h2>Unable to load note ❌</h2>

          <p>{error}</p>

          <Link to="/notes">
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  // ===============================
  // ACCESS CHECK
  // ===============================

  if (!note) {
    return (
      <div className="edit-note-page">
        <div className="edit-note-card">
          <h2>Note not found ❌</h2>

          <Link to="/notes">
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="edit-note-page">
        <div className="edit-note-card">

          <h2>Access Denied 🚫</h2>

          <p>
            You can only edit your own notes.
          </p>

          <Link to="/notes">
            Back to Notes
          </Link>

        </div>
      </div>
    );
  }

  // ===============================
  // EDIT FORM
  // ===============================

  return (
    <div className="edit-note-page">
      <div className="edit-note-card">

        <h1>Edit Note</h1>

        <p>
          Update your note details.
        </p>

        <form onSubmit={handleUpdate}>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            disabled={updating}
          />

          <input
            type="text"
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
            disabled={updating}
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) =>
              setFile(e.target.files[0])
            }
            disabled={updating}
          />

          <textarea
            rows="8"
            value={content}
            onChange={(e) =>
              setContent(e.target.value)
            }
            disabled={updating}
          ></textarea>

          <button
            type="submit"
            disabled={updating}
          >
            {updating
              ? "Updating Note..."
              : "Update Note"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default EditNote;