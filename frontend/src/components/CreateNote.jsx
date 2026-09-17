import { apiFetch } from "../api";
import { useState } from "react";

function CreateNote() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        alert(
          "Only PDF, DOC, DOCX and TXT files are allowed! ❌"
        );

        e.target.value = "";
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Remove extra spaces
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();
    const cleanContent = content.trim();

    // Title validation
    if (!cleanTitle) {
      alert("Please enter a note title! ❌");
      return;
    }

    // Subject validation
    if (!cleanSubject) {
      alert("Please enter a subject! ❌");
      return;
    }

    // Content validation
    if (!cleanContent) {
      alert(
        "Please write some content in your note! ❌"
      );
      return;
    }

    // File validation
    if (!file) {
      alert("Please select a file! ❌");
      return;
    }

    // Start loading
    setLoading(true);

    const reader = new FileReader();

    reader.onload = async () => {
      const newNote = {
        title: cleanTitle,
        subject: cleanSubject,
        content: cleanContent,
        fileName: file.name,
        fileData: reader.result,
      };

      try {
        const response = await apiFetch(
          "/api/notes",
          {
            method: "POST",
            body: JSON.stringify(newNote),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(
            data.message ||
            "Failed to publish note ❌"
          );
          return;
        }

        console.log(data);

        alert(
          "Note published successfully! 🚀"
        );

        setTitle("");
        setSubject("");
        setContent("");
        setFile(null);

      } catch (error) {
        console.error(
          "Error publishing note:",
          error
        );

        alert(
          "Unable to connect to server ❌"
        );

      } finally {
        // Stop loading
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="create-note-page">
      <div className="create-note-card">

        <h1>Create a Note</h1>

        <p>
          Share your knowledge with the NoteHub community.
        </p>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            disabled={loading}
          />

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
            disabled={loading}
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            disabled={loading}
          />

          <textarea
            placeholder="Write your note here..."
            rows="8"
            value={content}
            onChange={(e) =>
              setContent(e.target.value)
            }
            disabled={loading}
          ></textarea>

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Publishing Note..."
              : "Publish Note"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default CreateNote;