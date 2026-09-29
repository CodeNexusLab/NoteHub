import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";

function Notes() {
  // =========================================================
  // DATA
  // =========================================================

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // SEARCH + FILTERS
  // =========================================================

  const [search, setSearch] = useState("");
  const [streamFilter, setStreamFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] =
    useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // =========================================================
  // LIBRARY NAVIGATION
  // =========================================================

  const [selectedStream, setSelectedStream] = useState("");
  const [selectedSemester, setSelectedSemester] =
    useState("");
  const [selectedSubject, setSelectedSubject] =
    useState("");
  const [selectedResourceType, setSelectedResourceType] =
    useState("");

  // =========================================================
  // STREAMS
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
  // SEMESTERS
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
    {
      name: "Notes",
      icon: "📝",
      description: "Class notes and explanations",
    },

    {
      name: "Previous Year Question Paper",
      icon: "📄",
      description: "Previous examination papers",
    },

    {
      name: "Study Material",
      icon: "📚",
      description: "Additional learning material",
    },

    {
      name: "Other",
      icon: "📦",
      description: "Other useful resources",
    },
  ];

  // =========================================================
  // FETCH NOTES
  // =========================================================

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);

        const response =
          await apiFetch("/api/notes");

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            data.message ||
              "Failed to load notes ❌"
          );

          setNotes([]);
          return;
        }

        setNotes(
          Array.isArray(data)
            ? data
            : []
        );
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
  // NORMALIZE TAGS
  // =========================================================

  const getNoteTags = (note) => {
    if (Array.isArray(note.tags)) {
      return note.tags;
    }

    if (typeof note.tags === "string") {
      return note.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    return [];
  };

  // =========================================================
  // ALL TAGS
  // =========================================================

  const allTags = useMemo(() => {
    const tagSet = new Set();

    notes.forEach((note) => {
      getNoteTags(note).forEach((tag) => {
        if (tag) {
          tagSet.add(
            String(tag).trim()
          );
        }
      });
    });

    return [...tagSet].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [notes]);

  // =========================================================
  // SUBJECT OPTIONS
  // =========================================================

  const subjectOptions = useMemo(() => {
    const subjects = new Set();

    notes.forEach((note) => {
      if (note.subject) {
        subjects.add(note.subject);
      }
    });

    if (
      streamFilter === "BCA" &&
      semesterFilter &&
      bcaSubjects[semesterFilter]
    ) {
      bcaSubjects[semesterFilter].forEach(
        (subject) => subjects.add(subject)
      );
    }

    return [...subjects].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [
    notes,
    streamFilter,
    semesterFilter,
  ]);

  // =========================================================
  // CHECK WHETHER NOTE IS CATEGORIZED
  // =========================================================

  const isCategorizedNote = (note) => {
    if (
      !note.stream ||
      !note.semester ||
      !note.subject
    ) {
      return false;
    }

    if (note.stream !== "BCA") {
      return true;
    }

    const subjects =
      bcaSubjects[note.semester];

    if (!subjects) {
      return false;
    }

    return subjects.includes(
      note.subject
    );
  };

  // =========================================================
  // FILTER + SEARCH + SORT
  // =========================================================

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    const searchTerm =
      search.trim().toLowerCase();

    // -------------------------------------------------------
    // SEARCH
    // -------------------------------------------------------

    if (searchTerm) {
      result = result.filter((note) => {
        const title =
          String(note.title || "")
            .toLowerCase();

        const subject =
          String(note.subject || "")
            .toLowerCase();

        const content =
          String(note.content || "")
            .toLowerCase();

        const ownerName =
          String(note.ownerName || "")
            .toLowerCase();

        const ownerEmail =
          String(note.ownerEmail || "")
            .toLowerCase();

        const stream =
          String(note.stream || "")
            .toLowerCase();

        const semester =
          String(note.semester || "")
            .toLowerCase();

        const resourceType =
          String(note.resourceType || "")
            .toLowerCase();

        const tags =
          getNoteTags(note)
            .join(" ")
            .toLowerCase();

        return (
          title.includes(searchTerm) ||
          subject.includes(searchTerm) ||
          content.includes(searchTerm) ||
          ownerName.includes(searchTerm) ||
          ownerEmail.includes(searchTerm) ||
          stream.includes(searchTerm) ||
          semester.includes(searchTerm) ||
          resourceType.includes(searchTerm) ||
          tags.includes(searchTerm)
        );
      });
    }

    // -------------------------------------------------------
    // STREAM FILTER
    // -------------------------------------------------------

    if (streamFilter) {
      result = result.filter(
        (note) =>
          note.stream ===
          streamFilter
      );
    }

    // -------------------------------------------------------
    // SEMESTER FILTER
    // -------------------------------------------------------

    if (semesterFilter) {
      result = result.filter(
        (note) =>
          note.semester ===
          semesterFilter
      );
    }

    // -------------------------------------------------------
    // SUBJECT FILTER
    // -------------------------------------------------------

    if (subjectFilter) {
      result = result.filter(
        (note) =>
          note.subject ===
          subjectFilter
      );
    }

    // -------------------------------------------------------
    // RESOURCE TYPE FILTER
    // -------------------------------------------------------

    if (resourceTypeFilter) {
      result = result.filter(
        (note) =>
          (
            note.resourceType ||
            "Other"
          ) === resourceTypeFilter
      );
    }

    // -------------------------------------------------------
    // TAG FILTER
    // -------------------------------------------------------

    if (tagFilter) {
      result = result.filter((note) =>
        getNoteTags(note).some(
          (tag) =>
            String(tag)
              .toLowerCase() ===
            tagFilter.toLowerCase()
        )
      );
    }

    // -------------------------------------------------------
    // LIBRARY SELECTION
    // -------------------------------------------------------

    if (selectedStream) {
      result = result.filter(
        (note) =>
          note.stream ===
          selectedStream
      );
    }

    if (selectedSemester) {
      result = result.filter(
        (note) =>
          note.semester ===
          selectedSemester
      );
    }

    if (selectedSubject) {
      result = result.filter(
        (note) =>
          note.subject ===
          selectedSubject
      );
    }

    if (selectedResourceType) {
      result = result.filter(
        (note) =>
          (
            note.resourceType ||
            "Other"
          ) === selectedResourceType
      );
    }

    // -------------------------------------------------------
    // SORT
    // -------------------------------------------------------

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt || 0) -
          new Date(b.createdAt || 0)
        );
      }

      if (sortBy === "az") {
        return String(
          a.title || ""
        ).localeCompare(
          String(b.title || "")
        );
      }

      if (sortBy === "za") {
        return String(
          b.title || ""
        ).localeCompare(
          String(a.title || "")
        );
      }

      return 0;
    });

    return result;
  }, [
    notes,
    search,
    streamFilter,
    semesterFilter,
    subjectFilter,
    resourceTypeFilter,
    tagFilter,
    sortBy,
    selectedStream,
    selectedSemester,
    selectedSubject,
    selectedResourceType,
  ]);

  // =========================================================
  // UNCATEGORIZED NOTES
  // =========================================================

  const uncategorizedNotes = useMemo(() => {
    return filteredNotes.filter(
      (note) =>
        !isCategorizedNote(note)
    );
  }, [filteredNotes]);

  // =========================================================
  // LIBRARY COUNTS
  // =========================================================

  const getCourseCount = (course) => {
    return notes.filter(
      (note) =>
        note.stream === course
    ).length;
  };

  const getSemesterCount = (
    semester
  ) => {
    return notes.filter(
      (note) =>
        note.stream ===
          selectedStream &&
        note.semester === semester
    ).length;
  };

  const getSubjectCount = (
    subject
  ) => {
    return notes.filter(
      (note) =>
        note.stream ===
          selectedStream &&
        note.semester ===
          selectedSemester &&
        note.subject === subject
    ).length;
  };

  const getResourceTypeCount = (
    resourceType
  ) => {
    return notes.filter(
      (note) =>
        note.stream ===
          selectedStream &&
        note.semester ===
          selectedSemester &&
        note.subject ===
          selectedSubject &&
        (
          note.resourceType ||
          "Other"
        ) === resourceType
    ).length;
  };

  // =========================================================
  // CURRENT SUBJECTS
  // =========================================================

  const currentSubjects =
    selectedStream === "BCA"
      ? (
          bcaSubjects[
            selectedSemester
          ] || []
        )
      : [
          ...new Set(
            notes
              .filter(
                (note) =>
                  note.stream ===
                    selectedStream &&
                  note.semester ===
                    selectedSemester
              )
              .map(
                (note) =>
                  note.subject
              )
              .filter(Boolean)
          ),
        ];

  // =========================================================
  // RECENT NOTES
  // =========================================================

  const recentNotes = useMemo(() => {
    return [...notes]
      .sort(
        (a, b) =>
          new Date(
            b.createdAt || 0
          ) -
          new Date(
            a.createdAt || 0
          )
      )
      .slice(0, 6);
  }, [notes]);

  // =========================================================
  // LIBRARY NAVIGATION
  // =========================================================

  const handleCourseSelect = (
    course
  ) => {
    setSelectedStream(course);
    setSelectedSemester("");
    setSelectedSubject("");
    setSelectedResourceType("");
  };

  const handleSemesterSelect = (
    semester
  ) => {
    setSelectedSemester(
      semester
    );
    setSelectedSubject("");
    setSelectedResourceType("");
  };

  const handleSubjectSelect = (
    subject
  ) => {
    setSelectedSubject(
      subject
    );
    setSelectedResourceType("");
  };

  const handleResourceTypeSelect = (
    resourceType
  ) => {
    setSelectedResourceType(
      resourceType
    );
  };

  // =========================================================
  // BACK NAVIGATION
  // =========================================================

  const goBack = () => {
    if (selectedResourceType) {
      setSelectedResourceType("");
      return;
    }

    if (selectedSubject) {
      setSelectedSubject("");
      return;
    }

    if (selectedSemester) {
      setSelectedSemester("");
      return;
    }

    if (selectedStream) {
      setSelectedStream("");
      return;
    }

    window.history.back();
  };

  const goToLibraryHome = () => {
    setSelectedStream("");
    setSelectedSemester("");
    setSelectedSubject("");
    setSelectedResourceType("");
  };

  const goToStream = () => {
    setSelectedSemester("");
    setSelectedSubject("");
    setSelectedResourceType("");
  };

  const goToSemester = () => {
    setSelectedSubject("");
    setSelectedResourceType("");
  };

  const goToSubject = () => {
    setSelectedResourceType("");
  };

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearch("");
    setStreamFilter("");
    setSemesterFilter("");
    setSubjectFilter("");
    setResourceTypeFilter("");
    setTagFilter("");
    setSortBy("newest");
  };

  // =========================================================
  // CLEAR EVERYTHING
  // =========================================================

  const clearAll = () => {
    resetFilters();

    setSelectedStream("");
    setSelectedSemester("");
    setSelectedSubject("");
    setSelectedResourceType("");
  };

  // =========================================================
  // ACTIVE FILTERS
  // =========================================================

  const hasActiveFilters =
    search.trim() !== "" ||
    streamFilter !== "" ||
    semesterFilter !== "" ||
    subjectFilter !== "" ||
    resourceTypeFilter !== "" ||
    tagFilter !== "" ||
    sortBy !== "newest";

  // =========================================================
  // LIBRARY SELECTION ACTIVE?
  // =========================================================

  const hasLibrarySelection =
    Boolean(
      selectedStream ||
      selectedSemester ||
      selectedSubject ||
      selectedResourceType
    );

  // =========================================================
  // SHOW RESULTS
  // =========================================================

  const shouldShowResults =
    Boolean(
      hasActiveFilters ||
      hasLibrarySelection
    );

  // =========================================================
  // CURRENT LIBRARY LEVEL
  // =========================================================

  const currentLibraryLevel =
    selectedResourceType
      ? "RESOURCE"
      : selectedSubject
      ? "SUBJECT"
      : selectedSemester
      ? "SEMESTER"
      : selectedStream
      ? "COURSE"
      : "LIBRARY";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="notes-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="notes-hero">

        <div className="notes-hero-content">

          <button
            type="button"
            className="notes-back-button"
            onClick={goBack}
          >
            ← Back
          </button>

          <span className="notes-eyebrow">
            📚 NOTEHUB ACADEMIC LIBRARY
          </span>

          <h1>
            Explore the Library
          </h1>

          <p>
            Find notes, previous year question
            papers, study material and other
            academic resources — organized
            by course, semester and subject.
          </p>

        </div>

      </section>


      {/* =====================================================
          SEARCH + FILTER
      ===================================================== */}

      <section className="notes-explorer">

        <div className="notes-search-section">

          <div className="notes-search-title">

            <span>
              SMART RESOURCE SEARCH
            </span>

            <h2>
              Find what you need.
            </h2>

            <p>
              Search across your entire
              NoteHub academic library.
            </p>

          </div>


          <div className="notes-search-box">

            <span>
              🔎
            </span>

            <input
              type="text"
              placeholder="Search notes, subjects, tags, users..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="notes-search-clear"
              >
                ✕
              </button>
            )}

          </div>


          {/* =================================================
              FILTER TOOLBAR
          ================================================= */}

          <div className="notes-filter-section">

            <div className="notes-filter-heading">

              <div>

                <span>
                  FILTER & SORT
                </span>

                <h3>
                  Refine your resources
                </h3>

              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="notes-reset-btn"
                  onClick={
                    resetFilters
                  }
                >
                  Reset Filters
                </button>
              )}

            </div>


            <div className="notes-filter-grid">

              {/* STREAM */}

              <div className="notes-filter-field">

                <label>
                  STREAM
                </label>

                <select
                  value={
                    streamFilter
                  }
                  onChange={(e) => {

                    setStreamFilter(
                      e.target.value
                    );

                    setSemesterFilter("");
                    setSubjectFilter("");

                  }}
                >

                  <option value="">
                    All Streams
                  </option>

                  {streamOptions.map(
                    (stream) => (
                      <option
                        key={stream}
                        value={stream}
                      >
                        {stream}
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* SEMESTER */}

              <div className="notes-filter-field">

                <label>
                  SEMESTER
                </label>

                <select
                  value={
                    semesterFilter
                  }
                  onChange={(e) =>
                    setSemesterFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="">
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

              </div>


              {/* SUBJECT */}

              <div className="notes-filter-field">

                <label>
                  SUBJECT
                </label>

                <select
                  value={
                    subjectFilter
                  }
                  onChange={(e) =>
                    setSubjectFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="">
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

              </div>


              {/* RESOURCE TYPE */}

              <div className="notes-filter-field">

                <label>
                  RESOURCE
                </label>

                <select
                  value={
                    resourceTypeFilter
                  }
                  onChange={(e) =>
                    setResourceTypeFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    All Resources
                  </option>

                  {resourceTypes.map(
                    (resource) => (
                      <option
                        key={
                          resource.name
                        }
                        value={
                          resource.name
                        }
                      >
                        {resource.name}
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* TAG */}

              <div className="notes-filter-field">

                <label>
                  TAG
                </label>

                <select
                  value={tagFilter}
                  onChange={(e) =>
                    setTagFilter(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    All Tags
                  </option>

                  {allTags.map(
                    (tag) => (
                      <option
                        key={tag}
                        value={tag}
                      >
                        #{tag}
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* SORT */}

              <div className="notes-filter-field">

                <label>
                  SORT
                </label>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                >

                  <option value="newest">
                    Newest First
                  </option>

                  <option value="oldest">
                    Oldest First
                  </option>

                  <option value="az">
                    Title A → Z
                  </option>

                  <option value="za">
                    Title Z → A
                  </option>

                </select>

              </div>

            </div>


            <div className="notes-results-count">

              📚

              <span>
                Showing{" "}
                <strong>
                  {filteredNotes.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {notes.length}
                </strong>{" "}
                resources
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          ACADEMIC LIBRARY
      ===================================================== */}

      <section className="notes-library">

        <div className="notes-library-header">

          <div>

            <span className="notes-library-badge">
              ACADEMIC LIBRARY
            </span>

            <h2>
              Browse your knowledge.
            </h2>

            <p>
              Navigate through your academic
              resources step by step.
            </p>

          </div>


          {hasLibrarySelection && (
            <button
              type="button"
              className="notes-library-home-btn"
              onClick={
                goToLibraryHome
              }
            >
              🏠 Library Home
            </button>
          )}

        </div>


        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div className="notes-library-breadcrumb">

          <button
            type="button"
            onClick={
              goToLibraryHome
            }
            className={
              !selectedStream
                ? "active"
                : ""
            }
          >
            Library
          </button>


          {selectedStream && (
            <>
              <span>
                /
              </span>

              <button
                type="button"
                onClick={
                  goToStream
                }
                className={
                  !selectedSemester
                    ? "active"
                    : ""
                }
              >
                {selectedStream}
              </button>
            </>
          )}


          {selectedSemester && (
            <>
              <span>
                /
              </span>

              <button
                type="button"
                onClick={
                  goToSemester
                }
                className={
                  !selectedSubject
                    ? "active"
                    : ""
                }
              >
                {selectedSemester}
              </button>
            </>
          )}


          {selectedSubject && (
            <>
              <span>
                /
              </span>

              <button
                type="button"
                onClick={
                  goToSubject
                }
                className={
                  !selectedResourceType
                    ? "active"
                    : ""
                }
              >
                {selectedSubject}
              </button>
            </>
          )}


          {selectedResourceType && (
            <>
              <span>
                /
              </span>

              <span className="current">
                {selectedResourceType}
              </span>
            </>
          )}

        </div>


        {/* =================================================
            LIBRARY HOME — COURSES
        ================================================= */}

        {!selectedStream && (
          <div className="notes-library-level">

            <div className="notes-library-step">
              01 · COURSE
            </div>

            <h3>
              Choose your course
            </h3>

            <p>
              Start by selecting an academic
              course.
            </p>


            <div className="notes-course-grid">

              {streamOptions.map(
                (course) => {

                  const courseCount =
                    getCourseCount(
                      course
                    );

                  return (
                    <button
                      type="button"
                      key={course}
                      className="notes-course-card"
                      onClick={() =>
                        handleCourseSelect(
                          course
                        )
                      }
                    >

                      <span className="notes-card-label">
                        COURSE
                      </span>

                      <strong>
                        {course}
                      </strong>

                      <small>
                        {courseCount}{" "}
                        resource
                        {courseCount !== 1
                          ? "s"
                          : ""}
                      </small>

                      <span className="notes-card-arrow">
                        →
                      </span>

                    </button>
                  );

                }
              )}

            </div>

          </div>
        )}


        {/* =================================================
            SEMESTERS
        ================================================= */}

        {selectedStream &&
          !selectedSemester && (

            <div className="notes-library-level">

              <div className="notes-library-step">
                02 · SEMESTER
              </div>

              <h3>
                Explore {selectedStream}
              </h3>

              <p>
                Choose a semester to continue.
              </p>


              <div className="notes-semester-grid">

                {semesterOptions.map(
                  (semester) => {

                    const semesterCount =
                      getSemesterCount(
                        semester
                      );

                    return (
                      <button
                        type="button"
                        key={semester}
                        className="notes-semester-card"
                        onClick={() =>
                          handleSemesterSelect(
                            semester
                          )
                        }
                      >

                        <span>
                          SEMESTER
                        </span>

                        <strong>
                          {semester}
                        </strong>

                        <small>
                          {semesterCount}{" "}
                          resource
                          {semesterCount !== 1
                            ? "s"
                            : ""}
                        </small>

                        <span className="notes-card-arrow">
                          →
                        </span>

                      </button>
                    );

                  }
                )}

              </div>

            </div>
          )}


        {/* =================================================
            SUBJECTS
        ================================================= */}

        {selectedStream &&
          selectedSemester &&
          !selectedSubject && (

            <div className="notes-library-level">

              <div className="notes-library-step">
                03 · SUBJECT
              </div>

              <h3>
                Choose a subject
              </h3>

              <p>
                Explore subjects in{" "}
                {selectedSemester}.
              </p>


              <div className="notes-subject-grid">

                {currentSubjects.map(
                  (subject) => {

                    const subjectCount =
                      getSubjectCount(
                        subject
                      );

                    return (
                      <button
                        type="button"
                        key={subject}
                        className="notes-subject-card"
                        onClick={() =>
                          handleSubjectSelect(
                            subject
                          )
                        }
                      >

                        <span>
                          SUBJECT
                        </span>

                        <strong>
                          {subject}
                        </strong>

                        <small>
                          {subjectCount}{" "}
                          resource
                          {subjectCount !== 1
                            ? "s"
                            : ""}
                        </small>

                        <span className="notes-card-arrow">
                          →
                        </span>

                      </button>
                    );

                  }
                )}

              </div>

            </div>
          )}


        {/* =================================================
            SUBJECT RESOURCE EXPLORER
        ================================================= */}

        {selectedStream &&
          selectedSemester &&
          selectedSubject && (

            <div className="notes-library-level">

              <div className="notes-library-step">
                04 · RESOURCES
              </div>

              <div className="notes-subject-heading">

                <div>

                  <span className="notes-eyebrow">
                    {selectedStream} •{" "}
                    {selectedSemester}
                  </span>

                  <h3>
                    {selectedSubject}
                  </h3>

                  <p>
                    Browse all resources for
                    this subject.
                  </p>

                </div>

              </div>


              {/* =========================================
                  RESOURCE TYPE QUICK FILTERS
              ========================================= */}

              <div className="notes-resource-type-grid">

                <button
                  type="button"
                  className={
                    selectedResourceType === ""
                      ? "notes-resource-type-card active"
                      : "notes-resource-type-card"
                  }
                  onClick={() =>
                    setSelectedResourceType("")
                  }
                >

                  <div className="notes-resource-icon">
                    🗂️
                  </div>

                  <strong>
                    All Resources
                  </strong>

                  <small>
                    {
                      notes.filter(
                        (note) =>
                          note.stream ===
                            selectedStream &&
                          note.semester ===
                            selectedSemester &&
                          note.subject ===
                            selectedSubject
                      ).length
                    }{" "}
                    resources
                  </small>

                </button>


                {resourceTypes.map(
                  (resource) => {

                    const resourceCount =
                      getResourceTypeCount(
                        resource.name
                      );

                    return (
                      <button
                        type="button"
                        key={resource.name}
                        className={
                          selectedResourceType ===
                          resource.name
                            ? "notes-resource-type-card active"
                            : "notes-resource-type-card"
                        }
                        onClick={() =>
                          handleResourceTypeSelect(
                            resource.name
                          )
                        }
                      >

                        <div className="notes-resource-icon">
                          {resource.icon}
                        </div>

                        <strong>
                          {resource.name}
                        </strong>

                        <small>
                          {resourceCount}{" "}
                          resource
                          {resourceCount !== 1
                            ? "s"
                            : ""}
                        </small>

                        <span>
                          →
                        </span>

                      </button>
                    );

                  }
                )}

              </div>


              {/* =========================================
                  SUBJECT RESOURCES
              ========================================= */}

              <div className="notes-inline-results">

                <div className="notes-inline-results-header">

                  <div>

                    <span>
                      {selectedResourceType ||
                        "ALL RESOURCES"}
                    </span>

                    <h3>
                      Resources
                    </h3>

                  </div>

                  <strong>
                    {filteredNotes.length}
                  </strong>

                </div>


                {loading ? (

                  <div className="notes-loading">

                    <div className="notes-loading-icon">
                      ⏳
                    </div>

                    <h3>
                      Loading library...
                    </h3>

                    <p>
                      Preparing your learning
                      resources.
                    </p>

                  </div>

                ) : filteredNotes.length === 0 ? (

                  <div className="notes-empty">

                    <div className="notes-empty-icon">
                      📭
                    </div>

                    <h3>
                      No resources here yet
                    </h3>

                    <p>
                      This category does not
                      have any resources yet.
                    </p>

                    {selectedResourceType && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedResourceType(
                            ""
                          )
                        }
                      >
                        View All Resources
                      </button>
                    )}

                  </div>

                ) : (

                  <div className="notes-grid">

                    {filteredNotes.map(
                      (note) => {

                        const noteTags =
                          getNoteTags(
                            note
                          );

                        return (
                          <article
                            key={note._id}
                            className="note-card"
                          >

                            {/* CARD HEADER */}

                            <div className="note-card-header">

                              <span className="note-resource-badge">
                                {note.resourceType ||
                                  "Other"}
                              </span>

                              <span className="note-card-icon">
                                📄
                              </span>

                            </div>


                            {/* TITLE */}

                            <h3>
                              {note.title}
                            </h3>


                            {/* ACADEMIC INFO */}

                            <div className="note-academic-info">

                              {note.stream && (
                                <span>
                                  🎓{" "}
                                  {note.stream}
                                </span>
                              )}

                              {note.semester && (
                                <span>
                                  📚{" "}
                                  {note.semester}
                                </span>
                              )}

                              {note.subject && (
                                <span>
                                  📖{" "}
                                  {note.subject}
                                </span>
                              )}

                            </div>


                            {/* CONTENT */}

                            {note.content && (
                              <p className="note-card-content">
                                {String(
                                  note.content
                                ).length > 140
                                  ? `${String(
                                      note.content
                                    ).slice(
                                      0,
                                      140
                                    )}...`
                                  : note.content}
                              </p>
                            )}


                            {/* TAGS */}

                            {noteTags.length >
                              0 && (

                              <div className="note-card-tags">

                                {noteTags
                                  .slice(
                                    0,
                                    4
                                  )
                                  .map(
                                    (
                                      tag,
                                      index
                                    ) => (
                                      <span
                                        key={`${tag}-${index}`}
                                      >
                                        #
                                        {tag}
                                      </span>
                                    )
                                  )}

                              </div>

                            )}


                            {/* FOOTER */}

                            <div className="note-card-footer">

                              <div className="note-card-owner">

                                <span>
                                  👤
                                </span>

                                <div>

                                  <small>
                                    Uploaded by
                                  </small>

                                  <strong>
                                    {note.ownerName ||
                                      "Unknown"}
                                  </strong>

                                </div>

                              </div>


                              <Link
                                to={`/note/${note._id}`}
                                className="note-view-btn"
                              >
                                View Note →
                              </Link>

                            </div>

                          </article>
                        );

                      }
                    )}

                  </div>

                )}

              </div>

            </div>
          )}

      </section>


      {/* =====================================================
          SEARCH / FILTER RESULTS
      ===================================================== */}

      {shouldShowResults &&
        !(
          selectedStream &&
          selectedSemester &&
          selectedSubject
        ) && (

          <section className="notes-results-section">

            <div className="notes-results-header">

              <div>

                <span>
                  {currentLibraryLevel}
                </span>

                <h2>
                  {search.trim()
                    ? "Search Results"
                    : "Filtered Resources"}
                </h2>

                <p>
                  Resources matching your
                  current search and filters.
                </p>

              </div>

              <div className="notes-results-total">
                {filteredNotes.length}
              </div>

            </div>


            {loading ? (

              <div className="notes-loading">

                <div className="notes-loading-icon">
                  ⏳
                </div>

                <h3>
                  Loading library...
                </h3>

                <p>
                  Preparing your resources.
                </p>

              </div>

            ) : filteredNotes.length === 0 ? (

              <div className="notes-empty">

                <div className="notes-empty-icon">
                  🔎
                </div>

                <h3>
                  No resources found
                </h3>

                <p>
                  Try changing your search
                  or filters.
                </p>

                <button
                  type="button"
                  onClick={clearAll}
                >
                  Clear Everything
                </button>

              </div>

            ) : (

              <div className="notes-grid">

                {filteredNotes.map(
                  (note) => {

                    const noteTags =
                      getNoteTags(
                        note
                      );

                    return (
                      <article
                        key={note._id}
                        className="note-card"
                      >

                        <div className="note-card-header">

                          <span className="note-resource-badge">
                            {note.resourceType ||
                              "Other"}
                          </span>

                          <span className="note-card-icon">
                            📄
                          </span>

                        </div>


                        <h3>
                          {note.title}
                        </h3>


                        <div className="note-academic-info">

                          {note.stream && (
                            <span>
                              🎓{" "}
                              {note.stream}
                            </span>
                          )}

                          {note.semester && (
                            <span>
                              📚{" "}
                              {note.semester}
                            </span>
                          )}

                          {note.subject && (
                            <span>
                              📖{" "}
                              {note.subject}
                            </span>
                          )}

                        </div>


                        {note.content && (
                          <p className="note-card-content">
                            {String(
                              note.content
                            ).length > 140
                              ? `${String(
                                  note.content
                                ).slice(
                                  0,
                                  140
                                )}...`
                              : note.content}
                          </p>
                        )}


                        {noteTags.length >
                          0 && (

                          <div className="note-card-tags">

                            {noteTags
                              .slice(
                                0,
                                4
                              )
                              .map(
                                (
                                  tag,
                                  index
                                ) => (
                                  <span
                                    key={`${tag}-${index}`}
                                  >
                                    #{tag}
                                  </span>
                                )
                              )}

                          </div>

                        )}


                        <div className="note-card-footer">

                          <div className="note-card-owner">

                            <span>
                              👤
                            </span>

                            <div>

                              <small>
                                Uploaded by
                              </small>

                              <strong>
                                {note.ownerName ||
                                  "Unknown"}
                              </strong>

                            </div>

                          </div>


                          <Link
                            to={`/note/${note._id}`}
                            className="note-view-btn"
                          >
                            View Note →
                          </Link>

                        </div>

                      </article>
                    );

                  }
                )}

              </div>

            )}

          </section>
        )}


      {/* =====================================================
          UNCATEGORIZED RESOURCES
      ===================================================== */}

      {!loading &&
        !hasLibrarySelection &&
        !hasActiveFilters &&
        uncategorizedNotes.length >
          0 && (

          <section className="notes-uncategorized">

            <div className="notes-section-heading">

              <span>
                OTHER RESOURCES
              </span>

              <h2>
                Uncategorized Resources
              </h2>

              <p>
                Resources that are not currently
                mapped to the academic library
                structure.
              </p>

            </div>


            <div className="notes-grid">

              {uncategorizedNotes
                .slice(0, 6)
                .map((note) => (

                  <article
                    key={note._id}
                    className="note-card"
                  >

                    <div className="note-card-header">

                      <span className="note-resource-badge">
                        {note.resourceType ||
                          "Other"}
                      </span>

                      <span className="note-card-icon">
                        📦
                      </span>

                    </div>


                    <h3>
                      {note.title}
                    </h3>


                    {note.content && (
                      <p className="note-card-content">
                        {String(
                          note.content
                        ).length > 140
                          ? `${String(
                              note.content
                            ).slice(
                              0,
                              140
                            )}...`
                          : note.content}
                      </p>
                    )}


                    <div className="note-card-footer">

                      <div className="note-card-owner">

                        <span>
                          👤
                        </span>

                        <div>

                          <small>
                            Uploaded by
                          </small>

                          <strong>
                            {note.ownerName ||
                              "Unknown"}
                          </strong>

                        </div>

                      </div>


                      <Link
                        to={`/note/${note._id}`}
                        className="note-view-btn"
                      >
                        View Note →
                      </Link>

                    </div>

                  </article>

                ))}

            </div>

          </section>
        )}


      {/* =====================================================
          RECENT RESOURCES — LIBRARY HOME
      ===================================================== */}

      {!loading &&
        !hasLibrarySelection &&
        !hasActiveFilters &&
        recentNotes.length > 0 && (

          <section className="notes-recent-section">

            <div className="notes-section-heading">

              <span>
                LATEST ADDITIONS
              </span>

              <h2>
                Recently added resources
              </h2>

              <p>
                Fresh resources available
                in the NoteHub library.
              </p>

            </div>


            <div className="notes-recent-grid">

              {recentNotes.map(
                (note) => (

                  <Link
                    key={note._id}
                    to={`/note/${note._id}`}
                    className="notes-recent-card"
                  >

                    <span>
                      {note.resourceType ||
                        "Other"}
                    </span>

                    <h3>
                      {note.title}
                    </h3>

                    <p>
                      {note.subject ||
                        "Academic Resource"}
                    </p>

                    <strong>
                      View Resource →
                    </strong>

                  </Link>

                )
              )}

            </div>

          </section>
        )}


      {/* =====================================================
          EMPTY LIBRARY
      ===================================================== */}

      {!loading &&
        notes.length === 0 && (

          <section className="notes-library-empty">

            <div>
              📚
            </div>

            <h3>
              Your academic library is waiting.
            </h3>

            <p>
              No resources have been added yet.
              Create the first resource and
              start building NoteHub.
            </p>

            <Link to="/create-note">
              Create Your First Resource →
            </Link>

          </section>
        )}


      {/* =====================================================
          FOOTER WATERMARK
      ===================================================== */}

      <div className="notes-page-footer">

        <span>
          ✦
        </span>

        Organized knowledge

        <span>
          •
        </span>

        Better learning

        <span>
          ✦
        </span>

      </div>

    </div>
  );
}

export default Notes;