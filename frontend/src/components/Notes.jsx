import "./Notes.css";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { apiFetch } from "../api";


/* =========================================================
   NOTEHUB ACADEMIC STRUCTURE
   ---------------------------------------------------------
   Kept outside the component so the structure is not
   recreated on every render.
========================================================= */

const STREAM_OPTIONS = [
  "BCA",
  "BBA",
  "B.Com",
  "BA",
  "B.Sc",
  "Other",
];


const SEMESTER_OPTIONS = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "Other",
];


/* =========================================================
   BCA SUBJECT STRUCTURE
   ---------------------------------------------------------
   NoteHub uses short/general subject names.
========================================================= */

const BCA_SUBJECTS = {
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


/* =========================================================
   RESOURCE TYPES
========================================================= */

const RESOURCE_TYPES = [
  {
    name: "Notes",
    icon: "📝",
    shortName: "Notes",
  },

  {
    name: "Previous Year Question Paper",
    icon: "📄",
    shortName: "PYQ",
  },

  {
    name: "Study Material",
    icon: "📚",
    shortName: "Study Material",
  },

  {
    name: "Other",
    icon: "📦",
    shortName: "Other",
  },
];


function Notes() {
  const navigate = useNavigate();


  // ========================================================
  // DATA
  // ========================================================

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ========================================================
  // SEARCH
  // ========================================================

  const [search, setSearch] = useState("");


  // ========================================================
  // FILTERS
  // ========================================================

  const [streamFilter, setStreamFilter] =
    useState("");

  const [semesterFilter, setSemesterFilter] =
    useState("");

  const [subjectFilter, setSubjectFilter] =
    useState("");

  const [resourceTypeFilter, setResourceTypeFilter] =
    useState("");

  const [tagFilter, setTagFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("newest");


  // ========================================================
  // FILTER PANEL
  // ========================================================

  const [showFilters, setShowFilters] =
    useState(false);


  // ========================================================
  // LIBRARY NAVIGATION
  // ========================================================

  const [selectedStream, setSelectedStream] =
    useState("");

  const [selectedSemester, setSelectedSemester] =
    useState("");

  const [selectedSubject, setSelectedSubject] =
    useState("");

  const [selectedResourceType, setSelectedResourceType] =
    useState("");


  // ========================================================
  // FETCH RESOURCES
  // ========================================================

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await apiFetch("/api/notes");

        const data =
          await response.json();

        if (!response.ok) {
          setNotes([]);

          setError(
            data.message ||
              "Unable to load library resources."
          );

          return;
        }

        setNotes(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (fetchError) {
        console.error(
          "Error fetching library resources:",
          fetchError
        );

        setNotes([]);

        setError(
          "Unable to connect to the NoteHub server."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);


  // ========================================================
  // NORMALIZE TAGS
  // ========================================================

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


  // ========================================================
  // UNIQUE TAGS
  // ========================================================

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

    return [...tagSet].sort(
      (a, b) =>
        a.localeCompare(b)
    );

  }, [notes]);


  // ========================================================
  // SUBJECT FILTER OPTIONS
  // ========================================================

  const subjectOptions = useMemo(() => {
    const subjectSet = new Set();

    notes.forEach((note) => {
      if (note.subject) {
        subjectSet.add(
          String(note.subject).trim()
        );
      }
    });

    /*
     * When filtering BCA by a specific semester,
     * also show the official NoteHub subject structure.
     */
    if (
      streamFilter === "BCA" &&
      semesterFilter &&
      BCA_SUBJECTS[semesterFilter]
    ) {
      BCA_SUBJECTS[
        semesterFilter
      ].forEach((subject) => {
        subjectSet.add(subject);
      });
    }

    return [...subjectSet].sort(
      (a, b) =>
        a.localeCompare(b)
    );

  }, [
    notes,
    streamFilter,
    semesterFilter,
  ]);


  // ========================================================
  // FILTER + SEARCH + LIBRARY RESULT ENGINE
  // ========================================================

  const filteredResources = useMemo(() => {
    let result = [...notes];

    const searchTerm =
      search.trim().toLowerCase();


    // ------------------------------------------------------
    // SEARCH
    // ------------------------------------------------------

    if (searchTerm) {
      result = result.filter((note) => {
        const searchableText = [
          note.title,
          note.subject,
          note.content,
          note.ownerName,
          note.ownerEmail,
          note.stream,
          note.semester,
          note.resourceType,
          ...getNoteTags(note),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          searchTerm
        );
      });
    }


    // ------------------------------------------------------
    // STREAM FILTER
    // ------------------------------------------------------

    if (streamFilter) {
      result = result.filter(
        (note) =>
          note.stream ===
          streamFilter
      );
    }


    // ------------------------------------------------------
    // SEMESTER FILTER
    // ------------------------------------------------------

    if (semesterFilter) {
      result = result.filter(
        (note) =>
          note.semester ===
          semesterFilter
      );
    }


    // ------------------------------------------------------
    // SUBJECT FILTER
    // ------------------------------------------------------

    if (subjectFilter) {
      result = result.filter(
        (note) =>
          note.subject ===
          subjectFilter
      );
    }


    // ------------------------------------------------------
    // RESOURCE TYPE FILTER
    // ------------------------------------------------------

    if (resourceTypeFilter) {
      result = result.filter(
        (note) =>
          (
            note.resourceType ||
            "Other"
          ) ===
          resourceTypeFilter
      );
    }


    // ------------------------------------------------------
    // TAG FILTER
    // ------------------------------------------------------

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


    // ------------------------------------------------------
    // LIBRARY SELECTION
    // ------------------------------------------------------

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
          ) ===
          selectedResourceType
      );
    }


    // ------------------------------------------------------
    // SORT
    // ------------------------------------------------------

    result.sort((a, b) => {

      if (sortBy === "newest") {
        return (
          new Date(
            b.createdAt || 0
          ) -
          new Date(
            a.createdAt || 0
          )
        );
      }


      if (sortBy === "oldest") {
        return (
          new Date(
            a.createdAt || 0
          ) -
          new Date(
            b.createdAt || 0
          )
        );
      }


      if (sortBy === "az") {
        return String(
          a.title || ""
        ).localeCompare(
          String(
            b.title || ""
          )
        );
      }


      if (sortBy === "za") {
        return String(
          b.title || ""
        ).localeCompare(
          String(
            a.title || ""
          )
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


  // ========================================================
  // CURRENT SUBJECT LIST
  // ========================================================

  const currentSubjects = useMemo(() => {

    if (
      selectedStream === "BCA" &&
      selectedSemester
    ) {
      return (
        BCA_SUBJECTS[
          selectedSemester
        ] || []
      );
    }


    return [
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
    ].sort(
      (a, b) =>
        a.localeCompare(b)
    );

  }, [
    notes,
    selectedStream,
    selectedSemester,
  ]);


  // ========================================================
  // LIBRARY COUNTS
  // ========================================================

  const getStreamCount = (stream) => {
    return notes.filter(
      (note) =>
        note.stream === stream
    ).length;
  };


  const getSemesterCount = (
    semester
  ) => {
    return notes.filter(
      (note) =>
        note.stream ===
          selectedStream &&
        note.semester ===
          semester
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
        note.subject ===
          subject
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
        ) ===
          resourceType
    ).length;
  };


  const getSubjectResourceCount =
    () => {
      return notes.filter(
        (note) =>
          note.stream ===
            selectedStream &&
          note.semester ===
            selectedSemester &&
          note.subject ===
            selectedSubject
      ).length;
    };


  // ========================================================
  // ACTIVE FILTER COUNT
  // ========================================================

  const activeFilterCount = [
    streamFilter,
    semesterFilter,
    subjectFilter,
    resourceTypeFilter,
    tagFilter,
  ].filter(Boolean).length;


  // ========================================================
  // SEARCH / FILTER MODE
  // ========================================================

  const hasSearch =
    search.trim() !== "";


  const hasFilters =
    activeFilterCount > 0 ||
    sortBy !== "newest";


  const hasDirectDiscovery =
    hasSearch ||
    hasFilters;


  // ========================================================
  // LIBRARY BROWSING STATE
  // ========================================================

  const isLibraryHome =
    !selectedStream;


  const isSemesterLevel =
    selectedStream &&
    !selectedSemester;


  const isSubjectLevel =
    selectedStream &&
    selectedSemester &&
    !selectedSubject;


  const isResourceLevel =
    selectedStream &&
    selectedSemester &&
    selectedSubject;


  // ========================================================
  // NAVIGATION HANDLERS
  // ========================================================

  const selectStream = (
    stream
  ) => {
    setSelectedStream(stream);

    setSelectedSemester("");
    setSelectedSubject("");
    setSelectedResourceType("");
  };


  const selectSemester = (
    semester
  ) => {
    setSelectedSemester(
      semester
    );

    setSelectedSubject("");
    setSelectedResourceType("");
  };


  const selectSubject = (
    subject
  ) => {
    setSelectedSubject(
      subject
    );

    setSelectedResourceType("");
  };


  const selectResourceType = (
    resourceType
  ) => {
    setSelectedResourceType(
      resourceType
    );
  };


  // ========================================================
  // GO TO LIBRARY HOME
  // ========================================================

  const goToLibraryHome = () => {
    setSelectedStream("");
    setSelectedSemester("");
    setSelectedSubject("");
    setSelectedResourceType("");
  };


  // ========================================================
  // BACK THROUGH LIBRARY LEVELS
  // ========================================================

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


    navigate(-1);
  };


  // ========================================================
  // FILTER RESET
  // ========================================================

  const resetFilters = () => {
    setSearch("");

    setStreamFilter("");
    setSemesterFilter("");
    setSubjectFilter("");
    setResourceTypeFilter("");
    setTagFilter("");

    setSortBy("newest");
  };


  // ========================================================
  // RESOURCE TYPE LABEL
  // ========================================================

  const getResourceIcon = (
    type
  ) => {
    const match =
      RESOURCE_TYPES.find(
        (resource) =>
          resource.name === type
      );

    return (
      match?.icon ||
      "📄"
    );
  };


  // ========================================================
  // RESOURCE CARD
  // ========================================================

  const renderResourceCard = (
    note
  ) => {

    const noteTags =
      getNoteTags(note);

    const resourceType =
      note.resourceType ||
      "Other";


    return (
      <article
        key={note._id}
        className="resource-card"
      >

        {/* --------------------------------------------------
            TOP ROW
        -------------------------------------------------- */}

        <div className="resource-card-top">

          <span className="resource-type-pill">
            {getResourceIcon(
              resourceType
            )}{" "}
            {resourceType}
          </span>

          <span className="resource-card-symbol">
            ↗
          </span>

        </div>


        {/* --------------------------------------------------
            TITLE
        -------------------------------------------------- */}

        <h3 className="resource-card-title">
          {note.title}
        </h3>


        {/* --------------------------------------------------
            ACADEMIC PATH
        -------------------------------------------------- */}

        <div className="resource-card-path">

          {note.stream && (
            <span>
              {note.stream}
            </span>
          )}

          {note.semester && (
            <span>
              {note.semester}
            </span>
          )}

          {note.subject && (
            <span>
              {note.subject}
            </span>
          )}

        </div>


        {/* --------------------------------------------------
            CONTENT PREVIEW
        -------------------------------------------------- */}

        {note.content && (
          <p className="resource-card-description">
            {String(
              note.content
            ).length > 125
              ? `${String(
                  note.content
                ).slice(
                  0,
                  125
                )}...`
              : note.content}
          </p>
        )}


        {/* --------------------------------------------------
            TAGS
        -------------------------------------------------- */}

        {noteTags.length >
          0 && (

          <div className="resource-card-tags">

            {noteTags
              .slice(0, 3)
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


        {/* --------------------------------------------------
            BOTTOM ROW
        -------------------------------------------------- */}

        <div className="resource-card-bottom">

          <div className="resource-owner">

            <span>
              {(note.ownerName ||
                "U")
                .charAt(0)
                .toUpperCase()}
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
            className="resource-open-button"
          >
            Open
            <span>
              →
            </span>
          </Link>

        </div>

      </article>
    );
  };


  // ========================================================
  // RENDER
  // ========================================================

  return (
    <main className="library-page">


      {/* ====================================================
          COMMAND HEADER
      ==================================================== */}

      <header className="library-header">

        {/* ==================================================
            FLOATING LIBRARY ICON
            --------------------------------------------------
            Visual accent for the Explore your knowledge hero.
            Its glow/animation is controlled from Notes.css.
        ================================================== */}
        <div
          className="library-floating-icon"
          aria-hidden="true"
        >
          📚
        </div>

        <div className="library-header-main">

          <div className="library-brand">

            <span className="library-kicker">
              📚 NOTEHUB LIBRARY
            </span>

            <h1>
              Explore your knowledge.
            </h1>

            <p>
              Browse academic resources by
              course, semester, subject and type.
            </p>

          </div>

        </div>


        <div className="library-header-stat">

          <strong>
            {notes.length}
          </strong>

          <span>
            resources
          </span>

        </div>

      </header>

        {/* ==================================================
            LIBRARY BACK NAVIGATION
            --------------------------------------------------
            This stays below the hero so the Back button does
            not interfere with the hero layout.
        ================================================== */}
        <div className="library-back-area">
  <button
    type="button"
    className="library-back-button"
    onClick={goBack}
  >
    ←
    <span>Back</span>
  </button>
</div>

      {/* ====================================================
          SMART SEARCH BAR
      ==================================================== */}

      <section className="library-search-area">

        <div className="library-search-bar">

          <span className="library-search-icon">
            🔎
          </span>

          <input
            type="text"
            value={search}
            placeholder="Search the NoteHub library..."
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />


          {search && (
            <button
              type="button"
              className="library-search-clear"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              ×
            </button>
          )}

        </div>


        <div className="library-search-actions">

          <button
            type="button"
            className={
              showFilters
                ? "library-filter-toggle active"
                : "library-filter-toggle"
            }
            onClick={() =>
              setShowFilters(
                (current) =>
                  !current
              )
            }
          >
            🎛️

            <span>
              Filters
            </span>

            {activeFilterCount >
              0 && (
              <strong>
                {activeFilterCount}
              </strong>
            )}
          </button>


          {(hasSearch ||
            hasFilters ||
            activeFilterCount >
              0) && (

            <button
              type="button"
              className="library-reset-button"
              onClick={
                resetFilters
              }
            >
              Reset
            </button>

          )}

        </div>

      </section>


      {/* ====================================================
          COLLAPSIBLE FILTER PANEL
      ==================================================== */}

      {showFilters && (

        <section className="library-filter-panel">

          <div className="library-filter-heading">

            <div>

              <span>
                ADVANCED FILTERS
              </span>

              <h2>
                Refine your search
              </h2>

            </div>

            <small>
              {filteredResources.length} matching
            </small>

          </div>


          <div className="library-filter-grid">


            {/* STREAM */}

            <label className="library-filter-field">

              <span>
                Stream
              </span>

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

                {STREAM_OPTIONS.map(
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

            </label>


            {/* SEMESTER */}

            <label className="library-filter-field">

              <span>
                Semester
              </span>

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

                {SEMESTER_OPTIONS.map(
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

            </label>


            {/* SUBJECT */}

            <label className="library-filter-field">

              <span>
                Subject
              </span>

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

            </label>


            {/* RESOURCE TYPE */}

            <label className="library-filter-field">

              <span>
                Resource Type
              </span>

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

                {RESOURCE_TYPES.map(
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

            </label>


            {/* TAG */}

            <label className="library-filter-field">

              <span>
                Tag
              </span>

              <select
                value={
                  tagFilter
                }
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

            </label>


            {/* SORT */}

            <label className="library-filter-field">

              <span>
                Sort
              </span>

              <select
                value={
                  sortBy
                }
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

            </label>

          </div>

        </section>

      )}


      {/* ====================================================
          SEARCH RESULTS MODE
          ----------------------------------------------------
          When user is searching/filtering directly, the
          academic browsing cards are hidden so the page
          remains compact.
      ==================================================== */}

      {hasDirectDiscovery &&
        !isResourceLevel ? (

        <section className="library-results-view">

          <div className="library-results-head">

            <div>

              <span>
                SEARCH RESULTS
              </span>

              <h2>
                Matching resources
              </h2>

              <p>
                Results from the NoteHub library
                matching your search and filters.
              </p>

            </div>

            <strong>
              {filteredResources.length}
            </strong>

          </div>


          {loading ? (

            <div className="library-state">

              <div className="library-state-icon">
                ⏳
              </div>

              <h3>
                Loading resources...
              </h3>

              <p>
                Preparing the library.
              </p>

            </div>

          ) : error ? (

            <div className="library-state library-error">

              <div className="library-state-icon">
                ⚠️
              </div>

              <h3>
                Library unavailable
              </h3>

              <p>
                {error}
              </p>

            </div>

          ) : filteredResources.length ===
            0 ? (

            <div className="library-state">

              <div className="library-state-icon">
                🔎
              </div>

              <h3>
                No matching resources
              </h3>

              <p>
                Try a different search or
                adjust your filters.
              </p>

              <button
                type="button"
                onClick={
                  resetFilters
                }
              >
                Clear Search & Filters
              </button>

            </div>

          ) : (

            <div className="resource-grid">

              {filteredResources.map(
                renderResourceCard
              )}

            </div>

          )}

        </section>

      ) : (


        /* ==================================================
           ACADEMIC LIBRARY MODE
        ================================================== */

        <section className="library-browser">


          {/* =================================================
              LIBRARY PATH
          ================================================= */}

          <div className="library-path-bar">

            <button
              type="button"
              onClick={
                goToLibraryHome
              }
              className={
                isLibraryHome
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
                  onClick={() => {

                    setSelectedSemester("");
                    setSelectedSubject("");
                    setSelectedResourceType("");

                  }}
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
                  onClick={() => {

                    setSelectedSubject("");
                    setSelectedResourceType("");

                  }}
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
                  onClick={() => {

                    setSelectedResourceType("");

                  }}
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
              LEVEL 1 — COURSE
          ================================================= */}

          {isLibraryHome && (

            <div className="library-level">

              <div className="library-level-heading library-level-heading-centered">

                <div>

                  <span>
                    STEP 01
                  </span>

                  <h2>
                    Choose your course
                  </h2>

                  <p>
                    Start with an academic stream.
                  </p>

                </div>

              </div>


              <div className="course-grid">

                {STREAM_OPTIONS.map(
                  (stream) => {

                    const count =
                      getStreamCount(
                        stream
                      );

                    return (
                      <button
                        type="button"
                        key={stream}
                        className="course-tile"
                        onClick={() =>
                          selectStream(
                            stream
                          )
                        }
                      >

                        <span className="course-tile-index">
                          0
                          {STREAM_OPTIONS.indexOf(
                            stream
                          ) + 1}
                        </span>

                        <div className="course-tile-main">

                          <small>
                            COURSE
                          </small>

                          <strong>
                            {stream}
                          </strong>

                          <span>
                            {count}{" "}
                            resource
                            {count !== 1
                              ? "s"
                              : ""}
                          </span>

                        </div>

                        <span className="course-tile-arrow">
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
              LEVEL 2 — SEMESTER
          ================================================= */}

          {isSemesterLevel && (

            <div className="library-level">

              <div className="library-level-heading">

                <div>

                  <span>
                    STEP 02 · {selectedStream}
                  </span>

                  <h2>
                    Choose a semester
                  </h2>

                  <p>
                    Select the semester you want
                    to explore.
                  </p>

                </div>

                <button
                  type="button"
                  className="library-inline-back"
                  onClick={
                    goToLibraryHome
                  }
                >
                  ← Courses
                </button>

              </div>


              <div className="semester-grid">

                {SEMESTER_OPTIONS.map(
                  (semester) => {

                    const count =
                      getSemesterCount(
                        semester
                      );

                    return (
                      <button
                        type="button"
                        key={semester}
                        className="semester-tile"
                        onClick={() =>
                          selectSemester(
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
                          {count}{" "}
                          resource
                          {count !== 1
                            ? "s"
                            : ""}
                        </small>

                        <b>
                          →
                        </b>

                      </button>
                    );

                  }
                )}

              </div>

            </div>

          )}


          {/* =================================================
              LEVEL 3 — SUBJECT
          ================================================= */}

          {isSubjectLevel && (

            <div className="library-level">

              <div className="library-level-heading">

                <div>

                  <span>
                    STEP 03 ·{" "}
                    {selectedStream} ·{" "}
                    {selectedSemester}
                  </span>

                  <h2>
                    Choose a subject
                  </h2>

                  <p>
                    Select a subject to view
                    its resources.
                  </p>

                </div>

                <button
                  type="button"
                  className="library-inline-back"
                  onClick={() => {

                    setSelectedSemester("");
                    setSelectedSubject("");
                    setSelectedResourceType("");

                  }}
                >
                  ← Semesters
                </button>

              </div>


              {currentSubjects.length ===
                0 ? (

                <div className="library-state">

                  <div className="library-state-icon">
                    📚
                  </div>

                  <h3>
                    No subjects available
                  </h3>

                  <p>
                    There are currently no
                    subjects mapped to this
                    semester.
                  </p>

                </div>

              ) : (

                <div className="subject-grid">

                  {currentSubjects.map(
                    (subject) => {

                      const count =
                        getSubjectCount(
                          subject
                        );

                      return (
                        <button
                          type="button"
                          key={subject}
                          className="subject-tile"
                          onClick={() =>
                            selectSubject(
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
                            {count}{" "}
                            resource
                            {count !== 1
                              ? "s"
                              : ""}
                          </small>

                          <b>
                            →
                          </b>

                        </button>
                      );

                    }
                  )}

                </div>

              )}

            </div>

          )}


          {/* =================================================
              LEVEL 4 — RESOURCES
          ================================================= */}

          {isResourceLevel && (

            <div className="library-level">


              {/* ---------------------------------------------
                  RESOURCE HEADER
              --------------------------------------------- */}

              <div className="resource-level-header">

                <div>

                  <span>
                    STEP 04 · RESOURCE LIBRARY
                  </span>

                  <h2>
                    {selectedSubject}
                  </h2>

                  <p>
                    {selectedStream} ·{" "}
                    {selectedSemester}
                  </p>

                </div>


                <div className="resource-level-count">

                  <strong>
                    {
                      getSubjectResourceCount()
                    }
                  </strong>

                  <span>
                    resources
                  </span>

                </div>

              </div>


              {/* ---------------------------------------------
                  RESOURCE TYPE PILLS
              --------------------------------------------- */}

              <div className="resource-type-switcher">

                <button
                  type="button"
                  className={
                    selectedResourceType === ""
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    selectResourceType("")
                  }
                >
                  🗂️ All
                </button>


                {RESOURCE_TYPES.map(
                  (resource) => {

                    const count =
                      getResourceTypeCount(
                        resource.name
                      );

                    return (
                      <button
                        type="button"
                        key={
                          resource.name
                        }
                        className={
                          selectedResourceType ===
                          resource.name
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          selectResourceType(
                            resource.name
                          )
                        }
                      >

                        {resource.icon}{" "}
                        {resource.shortName}

                        <span>
                          {count}
                        </span>

                      </button>
                    );

                  }
                )}

              </div>


              {/* ---------------------------------------------
                  RESOURCE RESULTS
              --------------------------------------------- */}

              <div className="resource-results-header">

                <div>

                  <span>
                    {selectedResourceType ||
                      "ALL RESOURCES"}
                  </span>

                  <h3>
                    Available resources
                  </h3>

                </div>

                <strong>
                  {filteredResources.length}
                </strong>

              </div>


              {loading ? (

                <div className="library-state">

                  <div className="library-state-icon">
                    ⏳
                  </div>

                  <h3>
                    Loading resources...
                  </h3>

                  <p>
                    Preparing your subject library.
                  </p>

                </div>

              ) : error ? (

                <div className="library-state library-error">

                  <div className="library-state-icon">
                    ⚠️
                  </div>

                  <h3>
                    Unable to load resources
                  </h3>

                  <p>
                    {error}
                  </p>

                </div>

              ) : filteredResources.length ===
                0 ? (

                <div className="library-state">

                  <div className="library-state-icon">
                    📭
                  </div>

                  <h3>
                    No resources available
                  </h3>

                  <p>
                    No resource has been added
                    to this subject yet.
                  </p>

                  {selectedResourceType && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedResourceType("")
                      }
                    >
                      View All Resources
                    </button>
                  )}

                </div>

              ) : (

                <div className="resource-grid">

                  {filteredResources.map(
                    renderResourceCard
                  )}

                </div>

              )}

            </div>

          )}

        </section>

      )}


      {/* ====================================================
          FOOTER WATERMARK
      ==================================================== */}

      <footer className="library-watermark">

        <span className="watermark-symbol">
          ✦
        </span>

        <span>
          Organized knowledge
        </span>

        <i>
          •
        </i>

        <span>
          Better learning
        </span>

        <span className="watermark-symbol">
          ✦
        </span>

      </footer>

    </main>
  );
}


export default Notes;