import { apiFetch } from "../api";
import { useState } from "react";

function CreateNote() {
  // =========================================================
  // NOTE INFORMATION
  // =========================================================

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  // =========================================================
  // ACADEMIC INFORMATION
  // =========================================================

  const [stream, setStream] = useState("");
  const [semester, setSemester] = useState("");

  // =========================================================
  // RESOURCE TYPE
  // =========================================================

  const [resourceType, setResourceType] = useState("");

  // =========================================================
  // TAGS
  // =========================================================

  const [tags, setTags] = useState("");

  // =========================================================
  // FILE + LOADING
  // =========================================================

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================================================
  // STREAM OPTIONS
  // =========================================================

  const streamOptions = [
    "BCA",
    "BBA",
    "B.Com",
    "BA",
    "B.Sc",
    "Other",
  ];

  // =========================================================
  // SEMESTER OPTIONS
  // =========================================================

  const semesterOptions = [
    "1st Semester",
    "2nd Semester",
    "3rd Semester",
    "4th Semester",
    "5th Semester",
    "6th Semester",
    "Other",
  ];

  // =========================================================
  // BCA SUBJECT STRUCTURE
  // NOTEHUB GENERAL SUBJECT NAMES
  // =========================================================

  const bcaSubjects = {
    "1st Semester": [
      "C Programming",
      "Computer Fundamentals",
      "Computer Organization",
      "Mathematics",
    ],

    "2nd Semester": [
      "C++ Programming",
      "Web Technology",
      "Operating System",
      "Mathematics",
    ],

    "3rd Semester": [
      "Java Programming",
      "Linux and Shell Programming",
      "Database Technology",
      "Data Science",
    ],

    "4th Semester": [
      "Data Structures",
      "Frontend Development",
      "Computer Graphics",
      "Software Testing",
    ],

    "5th Semester": [
      "Software Engineering",
      "Backend Development",
      "Computer Networks",
      "Web Designing",
    ],

    "6th Semester": [
      "Python Programming",
      "Advanced Web Development",
      "Artificial Intelligence",
      "Data Science",
    ],
  };

  // =========================================================
  // RESOURCE TYPES
  // =========================================================

  const resourceTypes = [
    "Notes",
    "Previous Year Question Paper",
    "Study Material",
    "Other",
  ];

  // =========================================================
  // HANDLE STREAM CHANGE
  // =========================================================

  const handleStreamChange = (e) => {
    const selectedStream = e.target.value;

    setStream(selectedStream);

    // Reset semester and subject whenever stream changes
    setSemester("");
    setSubject("");
  };

  // =========================================================
  // HANDLE SEMESTER CHANGE
  // =========================================================

  const handleSemesterChange = (e) => {
    const selectedSemester = e.target.value;

    setSemester(selectedSemester);
    setSubject("");
  };

  // =========================================================
  // GET SUBJECT OPTIONS
  // =========================================================

  const getSubjectOptions = () => {
    if (stream === "BCA" && semester) {
      return bcaSubjects[semester] || [];
    }

    return [];
  };

  // =========================================================
  // FILE VALIDATION
  // =========================================================

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

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
  };

  // =========================================================
  // FORM SUBMISSION
  // =========================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    // -------------------------------------------------------
    // CLEAN VALUES
    // -------------------------------------------------------

    const cleanTitle = title.trim();
    const cleanSubject = subject.trim();
    const cleanContent = content.trim();
    const cleanStream = stream.trim();
    const cleanSemester = semester.trim();
    const cleanResourceType = resourceType.trim();

    // -------------------------------------------------------
    // TAG PROCESSING
    // -------------------------------------------------------

    const cleanTags = tags
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag !== "");

    // =======================================================
    // VALIDATION
    // =======================================================

    if (!cleanTitle) {
      alert("Please enter a note title! ❌");
      return;
    }

    if (!cleanStream) {
      alert("Please select your stream! ❌");
      return;
    }

    if (!cleanSemester) {
      alert("Please select your semester! ❌");
      return;
    }

    if (!cleanSubject) {
      alert("Please select or enter a subject! ❌");
      return;
    }

    if (!cleanResourceType) {
      alert("Please select resource type! ❌");
      return;
    }

    if (!cleanContent) {
      alert("Please write some content in your note! ❌");
      return;
    }

    if (!file) {
      alert("Please select a file! ❌");
      return;
    }

    // =======================================================
    // START LOADING
    // =======================================================

    setLoading(true);

    const reader = new FileReader();

    reader.onload = async () => {
      // =====================================================
      // CREATE NOTE OBJECT
      // =====================================================

      const newNote = {
        title: cleanTitle,

        stream: cleanStream,

        semester: cleanSemester,

        subject: cleanSubject,

        resourceType: cleanResourceType,

        tags: cleanTags,

        content: cleanContent,

        fileName: file.name,

        fileData: reader.result,
      };

      try {
        // ===================================================
        // SEND NOTE TO BACKEND
        // ===================================================

        const response = await apiFetch(
          "/api/notes",
          {
            method: "POST",
            body: JSON.stringify(newNote),
          }
        );

        const data = await response.json();

        // ===================================================
        // API ERROR
        // ===================================================

        if (!response.ok) {
          alert(
            data.message ||
              "Failed to publish note ❌"
          );

          return;
        }

        console.log(
          "Created note:",
          data
        );

        // ===================================================
        // SUCCESS
        // ===================================================

        alert(
          "Note published successfully! 🚀"
        );

        // ===================================================
        // RESET FORM
        // ===================================================

        setTitle("");
        setStream("");
        setSemester("");
        setSubject("");
        setResourceType("");
        setTags("");
        setContent("");
        setFile(null);

        // ===================================================
        // RESET FILE INPUT
        // ===================================================

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
        setLoading(false);
      }
    };

    // =======================================================
    // READ FILE
    // =======================================================

    reader.readAsDataURL(file);
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="create-note-page">

      <div className="create-note-card">

        {/* =================================================
            HEADER
        ================================================= */}

        <h1>
          Create a Note
        </h1>

        <p>
          Share your knowledge with the
          NoteHub community.
        </p>

        <form onSubmit={handleSubmit}>

          {/* =================================================
              NOTE TITLE
          ================================================= */}

          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            disabled={loading}
          />

          {/* =================================================
              STREAM
          ================================================= */}

          <select
            value={stream}
            onChange={handleStreamChange}
            disabled={loading}
          >

            <option value="">
              Select Stream
            </option>

            {streamOptions.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}

          </select>

          {/* =================================================
              SEMESTER
          ================================================= */}

          <select
            value={semester}
            onChange={handleSemesterChange}
            disabled={
              loading ||
              !stream
            }
          >

            <option value="">
              {stream
                ? "Select Semester"
                : "Select Stream First"}
            </option>

            {semesterOptions.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}

          </select>

          {/* =================================================
              SUBJECT
          ================================================= */}

          {stream === "BCA" &&
          bcaSubjects[semester] ? (

            <select
              value={subject}
              onChange={(e) =>
                setSubject(
                  e.target.value
                )
              }
              disabled={loading}
            >

              <option value="">
                Select Subject
              </option>

              {getSubjectOptions().map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}

            </select>

          ) : (

            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) =>
                setSubject(
                  e.target.value
                )
              }
              disabled={
                loading ||
                !semester
              }
            />

          )}

          {/* =================================================
              RESOURCE TYPE
          ================================================= */}

          <select
            value={resourceType}
            onChange={(e) =>
              setResourceType(
                e.target.value
              )
            }
            disabled={loading}
          >

            <option value="">
              Select Resource Type
            </option>

            {resourceTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}

          </select>

          {/* =================================================
              TAGS
          ================================================= */}

          <input
            type="text"
            placeholder="Tags (e.g. javascript, react, frontend)"
            value={tags}
            onChange={(e) =>
              setTags(e.target.value)
            }
            disabled={loading}
          />

          {/* =================================================
              FILE
          ================================================= */}

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            disabled={loading}
          />

          {/* =================================================
              CONTENT
          ================================================= */}

          <textarea
            placeholder="Write your note here..."
            rows="8"
            value={content}
            onChange={(e) =>
              setContent(
                e.target.value
              )
            }
            disabled={loading}
          ></textarea>

          {/* =================================================
              SUBMIT
          ================================================= */}

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