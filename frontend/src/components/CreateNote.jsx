import { apiFetch } from "../api";
import { useState } from "react";

function CreateNote() {
  // =========================================
  // NOTE INFORMATION
  // =========================================

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");


  // =========================================
  // ACADEMIC INFORMATION
  // =========================================

  const [stream, setStream] = useState("");
  const [semester, setSemester] = useState("");


  // =========================================
  // NOTE TAGS
  // Example:
  // javascript, react, frontend
  // =========================================

  const [tags, setTags] = useState("");


  // =========================================
  // FILE + LOADING
  // =========================================

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);


  // =========================================
  // FILE VALIDATION
  // =========================================

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


  // =========================================
  // FORM SUBMISSION
  // =========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    // Remove extra spaces
    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();
    const cleanContent = content.trim();
    const cleanStream = stream.trim();
    const cleanSemester = semester.trim();


    // =========================================
    // TAG PROCESSING
    // Convert comma-separated text into array
    // =========================================

    const cleanTags = tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag !== "");


    // =========================================
    // VALIDATION
    // =========================================

    // Title validation
    if (!cleanTitle) {
      alert("Please enter a note title! ❌");
      return;
    }

    // Stream validation
    if (!cleanStream) {
      alert("Please select your stream! ❌");
      return;
    }

    // Semester validation
    if (!cleanSemester) {
      alert("Please select your semester! ❌");
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


    // =========================================
    // START LOADING
    // =========================================

    setLoading(true);

    const reader = new FileReader();


    reader.onload = async () => {

      // =======================================
      // CREATE NOTE OBJECT
      // =======================================

      const newNote = {
        title: cleanTitle,

        stream: cleanStream,

        semester: cleanSemester,

        subject: cleanSubject,

        tags: cleanTags,

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


        // =====================================
        // API ERROR
        // =====================================

        if (!response.ok) {
          alert(
            data.message ||
              "Failed to publish note ❌"
          );

          return;
        }


        console.log(data);


        // =====================================
        // SUCCESS
        // =====================================

        alert(
          "Note published successfully! 🚀"
        );


        // Reset form

        setTitle("");
        setStream("");
        setSemester("");
        setSubject("");
        setTags("");
        setContent("");
        setFile(null);


        // Reset file input
        const fileInput =
          document.querySelector(
            'input[type="file"]'
          );

        if (fileInput) {
          fileInput.value = "";
        }

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


  // =========================================
  // UI
  // =========================================

  return (
    <div className="create-note-page">

      <div className="create-note-card">

        <h1>Create a Note</h1>

        <p>
          Share your knowledge with the
          NoteHub community.
        </p>


        <form onSubmit={handleSubmit}>

          {/* =================================
              NOTE TITLE
          ================================== */}

          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            disabled={loading}
          />


          {/* =================================
              STREAM
          ================================== */}

          <select
            value={stream}
            onChange={(e) =>
              setStream(e.target.value)
            }
            disabled={loading}
          >

            <option value="">
              Select Stream
            </option>

            <option value="BCA">
              BCA
            </option>

            <option value="BBA">
              BBA
            </option>

            <option value="B.Com">
              B.Com
            </option>

            <option value="BA">
              BA
            </option>

            <option value="B.Sc">
              B.Sc
            </option>

            <option value="Other">
              Other
            </option>

          </select>


          {/* =================================
              SEMESTER
          ================================== */}

          <select
            value={semester}
            onChange={(e) =>
              setSemester(e.target.value)
            }
            disabled={loading}
          >

            <option value="">
              Select Semester
            </option>

            <option value="1st Semester">
              1st Semester
            </option>

            <option value="2nd Semester">
              2nd Semester
            </option>

            <option value="3rd Semester">
              3rd Semester
            </option>

            <option value="4th Semester">
              4th Semester
            </option>

            <option value="5th Semester">
              5th Semester
            </option>

            <option value="6th Semester">
              6th Semester
            </option>

            <option value="Other">
              Other
            </option>

          </select>


          {/* =================================
              SUBJECT
          ================================== */}

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
            disabled={loading}
          />


          {/* =================================
              TAGS
          ================================== */}

          <input
            type="text"
            placeholder="Tags (e.g. javascript, react, frontend)"
            value={tags}
            onChange={(e) =>
              setTags(e.target.value)
            }
            disabled={loading}
          />


          {/* =================================
              FILE
          ================================== */}

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            disabled={loading}
          />


          {/* =================================
              CONTENT
          ================================== */}

          <textarea
            placeholder="Write your note here..."
            rows="8"
            value={content}
            onChange={(e) =>
              setContent(e.target.value)
            }
            disabled={loading}
          ></textarea>


          {/* =================================
              SUBMIT
          ================================== */}

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