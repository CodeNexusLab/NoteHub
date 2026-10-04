import { apiFetch } from "../api";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

function MyNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // PAGE VIEW
  // =========================================================

  const [view, setView] = useState("recent");

  // =========================================================
  // SEARCH + FILTER STATE
  // =========================================================

  const [search, setSearch] = useState("");

  const [courseFilter, setCourseFilter] =
    useState("All");

  const [semesterFilter, setSemesterFilter] =
    useState("All");

  const [subjectFilter, setSubjectFilter] =
    useState("All");

  const [resourceFilter, setResourceFilter] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("newest");

  // =========================================================
  // LOGGED-IN USER
  // =========================================================

  let loggedInUser = null;

  try {
    loggedInUser = JSON.parse(
      localStorage.getItem("loggedInUser")
    );
  } catch (error) {
    console.error(
      "Unable to read logged-in user:",
      error
    );
  }

  // =========================================================
  // FETCH NOTES
  // =========================================================

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await apiFetch(
          "/api/notes"
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            data.message ||
              "Failed to fetch notes ❌"
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

  // =========================================================
  // USER'S OWN NOTES
  // =========================================================

  const myNotes = useMemo(() => {
    return notes.filter(
      (note) =>
        note.ownerEmail ===
        loggedInUser?.email
    );
  }, [notes, loggedInUser?.email]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getCourse = (note) => {
    return (
      note.course ||
      note.stream ||
      "Uncategorized"
    );
  };

  const getSemester = (note) => {
    return (
      note.semester ||
      "Uncategorized"
    );
  };

  const getSubject = (note) => {
    return (
      note.subject ||
      "Uncategorized"
    );
  };

  // =========================================================
  // RESOURCE TYPE HELPER
  // =========================================================

  const getResourceKey = (type) => {
    if (!type) {
      return "other";
    }

    switch (type) {
      case "note":
      case "Notes":
        return "note";

      case "previous-paper":
      case "Previous Year Question Paper":
      case "Previous Year Paper":
        return "previous-paper";

      case "study-material":
      case "Study Material":
        return "study-material";

      case "other":
      case "Other":
        return "other";

      default:
        return "other";
    }
  };

  const getResourceLabel = (type) => {
    switch (getResourceKey(type)) {
      case "note":
        return "Notes";

      case "previous-paper":
        return "Previous Year Question Paper";

      case "study-material":
        return "Study Material";

      case "other":
      default:
        return "Other";
    }
  };

  // =========================================================
  // MASTER COURSE OPTIONS
  // =========================================================

  const masterCourseOptions = [
    "BCA",
    "BBA",
    "B.Com",
    "BA",
    "B.Sc",
    "Other",
  ];

  // =========================================================
  // MASTER SEMESTER OPTIONS
  // =========================================================

  const masterSemesterOptions = [
    "1st Semester",
    "2nd Semester",
    "3rd Semester",
    "4th Semester",
    "5th Semester",
    "6th Semester",
    "Other",
  ];

  // =========================================================
  // BCA SUBJECT MAP
  // =========================================================
  // Subjects are shown according to selected semester.
  // =========================================================

  const bcaSubjectsBySemester = {
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
  // SUBJECT OPTIONS
  // =========================================================
  // Smart dependent subject filtering.
  // =========================================================

  const subjectOptions = useMemo(() => {
    const noteSubjects = myNotes
      .map((note) => getSubject(note))
      .filter(Boolean);

    let subjects = [];

    // -------------------------------------------------------
    // BCA + specific semester
    // -------------------------------------------------------

    if (
      (courseFilter === "All" ||
        courseFilter === "BCA") &&
      semesterFilter !== "All"
    ) {
      subjects = [
        ...(bcaSubjectsBySemester[
          semesterFilter
        ] || []),
      ];
    }

    // -------------------------------------------------------
    // BCA + all semesters
    // -------------------------------------------------------

    else if (
      courseFilter === "BCA" &&
      semesterFilter === "All"
    ) {
      subjects = Object.values(
        bcaSubjectsBySemester
      ).flat();
    }

    // -------------------------------------------------------
    // Other course selected
    // -------------------------------------------------------

    else if (
      courseFilter !== "All" &&
      courseFilter !== "BCA"
    ) {
      subjects = myNotes
        .filter(
          (note) =>
            getCourse(note) ===
            courseFilter
        )
        .filter((note) => {
          if (
            semesterFilter ===
            "All"
          ) {
            return true;
          }

          return (
            getSemester(note) ===
            semesterFilter
          );
        })
        .map((note) =>
          getSubject(note)
        );
    }

    // -------------------------------------------------------
    // All courses + all semesters
    // -------------------------------------------------------

    else {
      subjects = noteSubjects;
    }

    // -------------------------------------------------------
    // Include subjects actually present in notes
    // This prevents valid existing data from disappearing.
    // -------------------------------------------------------

    if (
      courseFilter === "All" ||
      courseFilter === "BCA"
    ) {
      const matchingNoteSubjects =
        myNotes
          .filter((note) => {
            if (
              courseFilter !==
              "All"
            ) {
              return (
                getCourse(note) ===
                courseFilter
              );
            }

            return true;
          })
          .filter((note) => {
            if (
              semesterFilter ===
              "All"
            ) {
              return true;
            }

            return (
              getSemester(note) ===
              semesterFilter
            );
          })
          .map((note) =>
            getSubject(note)
          );

      subjects = [
        ...subjects,
        ...matchingNoteSubjects,
      ];
    }

    // -------------------------------------------------------
    // Remove duplicates + sort
    // -------------------------------------------------------

    return [
      ...new Set(
        subjects.filter(Boolean)
      ),
    ].sort();
  }, [
    myNotes,
    courseFilter,
    semesterFilter,
  ]);

  // =========================================================
  // COURSE OPTIONS
  // =========================================================

  const courseOptions = useMemo(() => {
    const existingCourses = myNotes
      .map((note) => getCourse(note))
      .filter(Boolean);

    return [
      ...new Set([
        ...masterCourseOptions,
        ...existingCourses,
      ]),
    ];
  }, [myNotes]);

  // =========================================================
  // SEMESTER OPTIONS
  // =========================================================

  const semesterOptions = useMemo(() => {
    const existingSemesters =
      myNotes
        .map((note) =>
          getSemester(note)
        )
        .filter(Boolean);

    const allSemesters = [
      ...new Set([
        ...masterSemesterOptions,
        ...existingSemesters,
      ]),
    ];

    return allSemesters.sort(
      (a, b) => {
        const numberA =
          String(a).match(/\d+/);

        const numberB =
          String(b).match(/\d+/);

        if (
          !numberA &&
          !numberB
        ) {
          return String(
            a
          ).localeCompare(
            String(b)
          );
        }

        if (!numberA) {
          return 1;
        }

        if (!numberB) {
          return -1;
        }

        return (
          Number(
            numberA[0]
          ) -
          Number(
            numberB[0]
          )
        );
      }
    );
  }, [myNotes]);

  // =========================================================
  // RESOURCE OPTIONS
  // =========================================================

  const resourceOptions = [
    "note",
    "previous-paper",
    "study-material",
    "other",
  ];

  // =========================================================
  // SEARCH + FILTER + SORT
  // =========================================================

  const filteredNotes = useMemo(() => {
    const searchValue =
      search
        .trim()
        .toLowerCase();

    const result =
      myNotes.filter(
        (note) => {

          // -------------------------------------------------
          // SEARCH
          // -------------------------------------------------

          const searchableText = [
            note.title,
            note.subject,
            note.content,
            note.ownerName,
            note.ownerEmail,
            note.course,
            note.stream,
            note.semester,
            note.resourceType,
            note.fileName,
            ...(Array.isArray(
              note.tags
            )
              ? note.tags
              : []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            !searchValue ||
            searchableText.includes(
              searchValue
            );

          // -------------------------------------------------
          // COURSE
          // -------------------------------------------------

          const matchesCourse =
            courseFilter ===
              "All" ||
            getCourse(note) ===
              courseFilter;

          // -------------------------------------------------
          // SEMESTER
          // -------------------------------------------------

          const matchesSemester =
            semesterFilter ===
              "All" ||
            getSemester(note) ===
              semesterFilter;

          // -------------------------------------------------
          // SUBJECT
          // -------------------------------------------------

          const matchesSubject =
            subjectFilter ===
              "All" ||
            getSubject(note) ===
              subjectFilter;

          // -------------------------------------------------
          // RESOURCE
          // -------------------------------------------------

          const matchesResource =
            resourceFilter ===
              "All" ||
            getResourceKey(
              note.resourceType
            ) ===
              resourceFilter;

          return (
            matchesSearch &&
            matchesCourse &&
            matchesSemester &&
            matchesSubject &&
            matchesResource
          );
        }
      );

    // =======================================================
    // SORT
    // =======================================================

    result.sort((a, b) => {
      switch (sortBy) {

        case "oldest":
          return (
            new Date(
              a.createdAt || 0
            ) -
            new Date(
              b.createdAt || 0
            )
          );

        case "az":
          return String(
            a.title || ""
          ).localeCompare(
            String(
              b.title || ""
            )
          );

        case "za":
          return String(
            b.title || ""
          ).localeCompare(
            String(
              a.title || ""
            )
          );

        case "newest":
        default:
          return (
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
          );
      }
    });

    return result;
  }, [
    myNotes,
    search,
    courseFilter,
    semesterFilter,
    subjectFilter,
    resourceFilter,
    sortBy,
  ]);

  // =========================================================
  // RECENT NOTES
  // =========================================================

  const recentNotes =
    useMemo(() => {
      return filteredNotes.slice(
        0,
        6
      );
    }, [filteredNotes]);

  // =========================================================
  // STATS
  // =========================================================

  const totalNotes =
    myNotes.length;

  const totalFiles =
    myNotes.filter(
      (note) =>
        note.fileName
    ).length;

  const totalResources =
    myNotes.filter(
      (note) =>
        note.resourceType
    ).length;

  // =========================================================
  // FILTER STATUS
  // =========================================================

  const filtersActive =
    search.trim() !== "" ||
    courseFilter !== "All" ||
    semesterFilter !== "All" ||
    subjectFilter !== "All" ||
    resourceFilter !== "All" ||
    sortBy !== "newest";

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setCourseFilter("All");
    setSemesterFilter("All");
    setSubjectFilter("All");
    setResourceFilter("All");
    setSortBy("newest");
  };

  // =========================================================
  // COURSE CHANGE
  // =========================================================

  const handleCourseChange = (
    value
  ) => {
    setCourseFilter(value);

    // Reset subject because
    // available subjects may change.
    setSubjectFilter("All");
  };

  // =========================================================
  // SEMESTER CHANGE
  // =========================================================

  const handleSemesterChange = (
    value
  ) => {
    setSemesterFilter(value);

    // Reset subject because
    // subjects depend on semester.
    setSubjectFilter("All");
  };

  // =========================================================
  // OPEN ALL NOTES
  // =========================================================

  const openAllNotes = () => {
    setView("all");
  };

  // =========================================================
  // BACK TO MY NOTES
  // =========================================================

  const backToMyNotes = () => {
    clearFilters();
    setView("recent");
  };

  // =========================================================
  // DELETE NOTE
  // =========================================================

  const handleDelete = async (
    id
  ) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this note?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const response =
        await apiFetch(
          `/api/notes/${id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

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

        setNotes(
          (currentNotes) =>
            currentNotes.filter(
              (note) =>
                note._id !== id
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

  // =========================================================
  // RENDER NOTE CARD
  // =========================================================

  const renderNoteCard = (
    note
  ) => {
    return (
      <article
        className="my-note-card"
        key={note._id}
      >

        {/* Card Header */}

        <div className="my-note-card-header">

          <div className="my-note-card-icon">
            📘
          </div>

          <div className="my-note-card-title">

            <h3>
              {note.title}
            </h3>

            <span>
              {note.subject ||
                "General"}
            </span>

          </div>

        </div>

        {/* Meta */}

        <div className="my-note-card-meta">

          <span>
            🎓 {getCourse(note)}
          </span>

          <span>
            📚 {getSemester(note)}
          </span>

          {note.resourceType && (
            <span>
              📄{" "}
              {getResourceLabel(
                note.resourceType
              )}
            </span>
          )}

        </div>

        {/* Content */}

        <div className="my-note-card-content">

          <p>
            {note.content
              ? note.content.length >
                180
                ? `${note.content.substring(
                    0,
                    180
                  )}...`
                : note.content
              : "No description available."}
          </p>

        </div>

        {/* File */}

        {note.fileName && (
          <div className="my-note-card-file">

            <span>
              📎
            </span>

            <span>
              {note.fileName}
            </span>

          </div>
        )}

        {/* Owner */}

        <div className="my-note-card-owner">

          <span>
            Uploaded by
          </span>

          <strong>
            {note.ownerName ||
              "Unknown"}
          </strong>

        </div>

        {/* Actions */}

        <div className="my-note-card-actions">

          <Link
            to={`/note/${note._id}`}
            className="my-note-action my-note-view"
          >
            👁️ View
          </Link>

          <Link
            to={`/note/${note._id}/edit`}
            className="my-note-action my-note-edit"
          >
            ✏️ Edit
          </Link>

          <button
            type="button"
            onClick={() =>
              handleDelete(
                note._id
              )
            }
            className="my-note-action my-note-delete"
          >
            🗑️ Delete
          </button>

        </div>

      </article>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="my-notes-page">

      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div className="my-notes-background">

        <div className="my-notes-glow my-notes-glow-one"></div>

        <div className="my-notes-glow my-notes-glow-two"></div>

        <div className="my-notes-glow my-notes-glow-three"></div>

      </div>

      {/* =====================================================
          MY NOTES WORKSPACE
          ===================================================== */}

      <section className="my-notes-workspace">

        {/* ===================================================
            FLOATING KNOWLEDGE CARDS
            =================================================== */}

        <div
          className="my-notes-floating-cards"
          aria-hidden="true"
        >

          <div className="my-notes-floating-card floating-card-one">

            <span>
              📚
            </span>

            <div>
              <strong>
                Organize Knowledge
              </strong>

              <small>
                Keep your learning structured
              </small>
            </div>

          </div>

          <div className="my-notes-floating-card floating-card-two">

            <span>
              🔎
            </span>

            <div>
              <strong>
                Explore Notes
              </strong>

              <small>
                Discover your knowledge
              </small>
            </div>

          </div>

          <div className="my-notes-floating-card floating-card-three">

            <span>
              🚀
            </span>

            <div>
              <strong>
                Keep Learning
              </strong>

              <small>
                Build your knowledge space
              </small>
            </div>

          </div>

        </div>

        {/* ===================================================
            FLOATING ORB
            =================================================== */}

        <div
          className="my-notes-knowledge-orb"
          aria-hidden="true"
        >

          <div className="my-notes-orb-ring orb-ring-one"></div>

          <div className="my-notes-orb-ring orb-ring-two"></div>

          <div className="my-notes-orb-ring orb-ring-three"></div>

          <div className="my-notes-orb-core">
            📝
          </div>

          <span className="my-notes-orb-dot orb-dot-one">
            ✦
          </span>

          <span className="my-notes-orb-dot orb-dot-two">
            ·
          </span>

          <span className="my-notes-orb-dot orb-dot-three">
            ✦
          </span>

        </div>

        {/* ===================================================
            WORKSPACE CONTENT
            =================================================== */}

        <div className="my-notes-workspace-content">

          <div className="my-notes-badge">
            ✦ YOUR NOTEHUB WORKSPACE
          </div>

          <h1>
            My{" "}
            <span>
              Notes
            </span>
          </h1>

          <p>
            Your personal space to
            organize, manage and
            explore your knowledge.
          </p>

          <div className="my-notes-hero-actions">

            <Link
              to="/create-note"
              className="my-notes-primary-btn"
            >
              ➕ Create Note
            </Link>

            <button
              type="button"
              onClick={openAllNotes}
              className="my-notes-secondary-btn"
            >
              📚 Explore Knowledge
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          KNOWLEDGE LIBRARY
          ===================================================== */}

      <section className="my-notes-section">

        <div className="my-notes-section-header">

          <div className="my-notes-library-heading">

            <h2>
              Your Knowledge Library
            </h2>

            <p>
              {loading
                ? "Loading your notes..."
                : `${totalNotes} ${
                    totalNotes === 1
                      ? "note"
                      : "notes"
                  } in your library`}
            </p>

          </div>

        </div>

        {/* ===================================================
            STATS
            =================================================== */}

        {!loading && (
          <div className="my-notes-stats">

            <div className="my-notes-stat-card">

              <div className="my-notes-stat-icon">
                📝
              </div>

              <div className="my-notes-stat-info">

                <span>
                  Total Notes
                </span>

                <strong>
                  {totalNotes}
                </strong>

              </div>

            </div>

            <div className="my-notes-stat-card">

              <div className="my-notes-stat-icon">
                📎
              </div>

              <div className="my-notes-stat-info">

                <span>
                  Files
                </span>

                <strong>
                  {totalFiles}
                </strong>

              </div>

            </div>

            <div className="my-notes-stat-card">

              <div className="my-notes-stat-icon">
                📚
              </div>

              <div className="my-notes-stat-info">

                <span>
                  Resources
                </span>

                <strong>
                  {totalResources}
                </strong>

              </div>

            </div>

          </div>
        )}

        {/* ===================================================
            CONTENT
            =================================================== */}

        {loading ? (

          <div className="my-notes-state">

            <div className="my-notes-loader">
              ⏳
            </div>

            <h3>
              Loading your notes...
            </h3>

            <p>
              Please wait while we
              fetch your knowledge
              library.
            </p>

          </div>

        ) : myNotes.length === 0 ? (

          <div className="my-notes-state">

            <div className="my-notes-empty-icon">
              📝
            </div>

            <h3>
              No Notes Yet
            </h3>

            <p>
              You haven't uploaded
              any notes yet. Start
              building your personal
              knowledge collection.
            </p>

            <Link
              to="/create-note"
              className="my-notes-empty-btn"
            >
              🚀 Create Your First Note
            </Link>

          </div>

        ) : view === "recent" ? (

          /* =================================================
             RECENT NOTES
             ================================================= */

          <div className="my-notes-recent-section">

            <div className="my-notes-content-header">

              <div>

                <span className="my-notes-content-kicker">
                  ✦ LATEST ADDITIONS
                </span>

                <h3>
                  Recent Notes
                </h3>

                <p>
                  Your latest uploaded
                  notes appear here.
                </p>

              </div>

              <button
                type="button"
                onClick={openAllNotes}
                className="my-notes-view-all-btn"
              >
                View All →
              </button>

            </div>

            {recentNotes.length === 0 ? (

              <div className="my-notes-state my-notes-small-state">

                <div className="my-notes-empty-icon">
                  🔎
                </div>

                <h3>
                  No Matching Notes
                </h3>

                <p>
                  Try opening all notes
                  to search and filter
                  your library.
                </p>

                <button
                  type="button"
                  onClick={openAllNotes}
                  className="my-notes-empty-btn"
                >
                  📚 View All Notes
                </button>

              </div>

            ) : (

              <div className="my-notes-grid">
                {recentNotes.map(
                  renderNoteCard
                )}
              </div>

            )}

          </div>

        ) : (

          /* =================================================
             ALL NOTES VIEW
             ================================================= */

          <div className="my-notes-all-section">

            {/* All Notes Header */}

            <div className="my-notes-content-header">

              <div>

                <button
                  type="button"
                  onClick={
                    backToMyNotes
                  }
                  className="my-notes-back-btn"
                >
                  ← Back to My Notes
                </button>

                <span className="my-notes-content-kicker">
                  ✦ YOUR COMPLETE LIBRARY
                </span>

                <h3>
                  All My Notes
                </h3>

                <p>
                  Search, filter and
                  organize all your
                  uploaded notes.
                </p>

              </div>

            </div>

            {/* =================================================
                FILTER PANEL
                ================================================= */}

            <div className="my-notes-filter-panel">

              {/* Search */}

              <div className="my-notes-search-box">

                <span>
                  🔎
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search title, subject, content, tags..."
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="my-notes-clear-search"
                  >
                    ×
                  </button>
                )}

              </div>

              {/* =================================================
                  FILTER ROW
                  ================================================= */}

              <div className="my-notes-filter-row">

                {/* COURSE */}

                <select
                  value={courseFilter}
                  onChange={(e) =>
                    handleCourseChange(
                      e.target.value
                    )
                  }
                >
                  <option value="All">
                    All Courses
                  </option>

                  {courseOptions.map(
                    (course) => (
                      <option
                        key={course}
                        value={course}
                      >
                        {course}
                      </option>
                    )
                  )}

                </select>

                {/* SEMESTER */}

                <select
                  value={semesterFilter}
                  onChange={(e) =>
                    handleSemesterChange(
                      e.target.value
                    )
                  }
                >
                  <option value="All">
                    All Semesters
                  </option>

                  {semesterOptions.map(
                    (semester) => (
                      <option
                        key={semester}
                        value={semester}
                      >
                        {semester}
                      </option>
                    )
                  )}

                </select>

                {/* SUBJECT */}

                <select
                  value={subjectFilter}
                  onChange={(e) =>
                    setSubjectFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="All">
                    All Subjects
                  </option>

                  {subjectOptions.map(
                    (subject) => (
                      <option
                        key={subject}
                        value={subject}
                      >
                        {subject}
                      </option>
                    )
                  )}

                </select>

                {/* RESOURCE */}

                <select
                  value={resourceFilter}
                  onChange={(e) =>
                    setResourceFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="All">
                    All Resources
                  </option>

                  {resourceOptions.map(
                    (resource) => (
                      <option
                        key={resource}
                        value={resource}
                      >
                        {getResourceLabel(
                          resource
                        )}
                      </option>
                    )
                  )}

                </select>

                {/* SORT */}

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                >
                  <option value="newest">
                    Newest
                  </option>

                  <option value="oldest">
                    Oldest
                  </option>

                  <option value="az">
                    A → Z
                  </option>

                  <option value="za">
                    Z → A
                  </option>

                </select>

              </div>

              {/* =================================================
                  FILTER RESULTS
                  ================================================= */}

              <div className="my-notes-filter-bottom">

                <span>
                  {filteredNotes.length}{" "}
                  {filteredNotes.length === 1
                    ? "result"
                    : "results"}
                </span>

                {filtersActive && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="my-notes-clear-filters"
                  >
                    ✕ Clear Filters
                  </button>
                )}

              </div>

            </div>

            {/* =================================================
                RESULTS
                ================================================= */}

            {filteredNotes.length === 0 ? (

              <div className="my-notes-state">

                <div className="my-notes-empty-icon">
                  🔎
                </div>

                <h3>
                  No Notes Found
                </h3>

                <p>
                  No notes match your
                  current search or
                  filters.
                </p>

                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="my-notes-empty-btn"
                >
                  ✕ Clear Filters
                </button>

              </div>

            ) : (

              <div className="my-notes-grid">
                {filteredNotes.map(
                  renderNoteCard
                )}
              </div>

            )}

          </div>
        )}

      </section>

      {/* =====================================================
          BOTTOM CTA
          ===================================================== */}

      {!loading &&
        myNotes.length > 0 && (
          <section className="my-notes-bottom-cta">

            <div>

              <span>
                💡 KEEP BUILDING YOUR
                KNOWLEDGE
              </span>

              <h2>
                Have something new
                to share?
              </h2>

              <p>
                Create another note
                and add it to your
                personal knowledge
                space.
              </p>

            </div>

            <Link
              to="/create-note"
              className="my-notes-bottom-btn"
            >
              ➕ Create New Note
            </Link>

          </section>
        )}

    </div>
  );
}

export default MyNotes;