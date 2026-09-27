import { apiFetch } from "../api";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

function Notes() {
  // ======================================================
  // NOTES DATA
  // ======================================================

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);


  // ======================================================
  // SEARCH + FILTER STATES
  // ======================================================

  const [search, setSearch] = useState("");

  const [streamFilter, setStreamFilter] =
    useState("");

  const [semesterFilter, setSemesterFilter] =
    useState("");

  const [tagFilter, setTagFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("newest");


  // ======================================================
  // FIXED STREAM OPTIONS
  // ======================================================

  const streamOptions = [
    "BCA",
    "BBA",
    "B.Com",
    "BA",
    "B.Sc",
    "Other",
  ];


  // ======================================================
  // FIXED SEMESTER OPTIONS
  // ======================================================

  const semesterOptions = [
    "1st Semester",
    "2nd Semester",
    "3rd Semester",
    "4th Semester",
    "5th Semester",
    "6th Semester",
    "Other",
  ];


  // ======================================================
  // FETCH ALL NOTES
  // ======================================================

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response =
          await apiFetch("/api/notes");

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            data.message ||
              "Failed to fetch notes ❌"
          );

          setNotes([]);
          return;
        }

        if (Array.isArray(data)) {
          setNotes(data);
        } else {
          console.error(
            "Invalid notes data received from API."
          );

          setNotes([]);
        }

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


  // ======================================================
  // CREATE UNIQUE TAG LIST
  // ======================================================

  const tags = useMemo(() => {
    const allTags = [];

    notes.forEach((note) => {
      if (Array.isArray(note.tags)) {
        note.tags.forEach((tag) => {
          if (tag) {
            allTags.push(
              String(tag)
                .trim()
                .toLowerCase()
            );
          }
        });
      }
    });

    return [
      ...new Set(allTags)
    ].sort();

  }, [notes]);


  // ======================================================
  // FILTER + SEARCH + SORT NOTES
  // ======================================================

  const filteredNotes = useMemo(() => {

    const searchText =
      search.trim().toLowerCase();


    const filtered = notes.filter((note) => {

      const title =
        String(note.title || "")
          .toLowerCase();

      const subject =
        String(note.subject || "")
          .toLowerCase();

      const content =
        String(note.content || "")
          .toLowerCase();

      const owner =
        String(
          note.ownerName ||
          note.ownerEmail ||
          ""
        ).toLowerCase();

      const noteTags =
        Array.isArray(note.tags)
          ? note.tags
              .map((tag) =>
                String(tag).toLowerCase()
              )
              .join(" ")
          : "";


      // SEARCH
      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        subject.includes(searchText) ||
        content.includes(searchText) ||
        owner.includes(searchText) ||
        noteTags.includes(searchText);


      // STREAM
      const matchesStream =
        !streamFilter ||
        note.stream === streamFilter;


      // SEMESTER
      const matchesSemester =
        !semesterFilter ||
        note.semester === semesterFilter;


      // TAG
      const matchesTag =
        !tagFilter ||
        (
          Array.isArray(note.tags) &&
          note.tags.some(
            (tag) =>
              String(tag)
                .toLowerCase() ===
              tagFilter.toLowerCase()
          )
        );


      return (
        matchesSearch &&
        matchesStream &&
        matchesSemester &&
        matchesTag
      );
    });


    // ==================================================
    // SORT
    // ==================================================

    const sortedNotes =
      [...filtered].sort((a, b) => {

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
          return (
            String(a.title || "")
              .localeCompare(
                String(b.title || "")
              )
          );
        }


        if (sortBy === "za") {
          return (
            String(b.title || "")
              .localeCompare(
                String(a.title || "")
              )
          );
        }


        return 0;
      });


    return sortedNotes;

  }, [
    notes,
    search,
    streamFilter,
    semesterFilter,
    tagFilter,
    sortBy,
  ]);


  // ======================================================
  // CLEAR FILTERS
  // ======================================================

  const clearFilters = () => {
    setSearch("");
    setStreamFilter("");
    setSemesterFilter("");
    setTagFilter("");
    setSortBy("newest");
  };


  // ======================================================
  // ACTIVE FILTER CHECK
  // ======================================================

  const hasActiveFilters =
    search.trim() !== "" ||
    streamFilter !== "" ||
    semesterFilter !== "" ||
    tagFilter !== "" ||
    sortBy !== "newest";


  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="notes-page">


      {/* ==================================================
          NOTES HERO / HEADER
      ================================================== */}

      <section className="notes-hero">

        <div className="notes-hero-content">

          <span className="notes-eyebrow">
            📚 NOTEHUB LIBRARY
          </span>

          <h1>
            Explore Notes
          </h1>

          <p>
            Discover useful notes, study material,
            and learning resources shared by the
            NoteHub community.
          </p>

        </div>

      </section>


      {/* ==================================================
          SEARCH + FILTER AREA
      ================================================== */}

      <section className="notes-explorer">

        {/* ================================================
            SEARCH HEADER
        ================================================= */}

        <div className="notes-search-section">

          <div className="notes-search-title">

            <h2>
              Find the right notes
            </h2>

            <p>
              Search by title, subject, content,
              tags, or user.
            </p>

          </div>


          {/* ==============================================
              SEARCH BOX
          ============================================== */}

          <div className="notes-search-box">

            <span
              className="notes-search-icon"
              aria-hidden="true"
            >
              🔍
            </span>

            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="notes-search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                ✕
              </button>
            )}

          </div>

        </div>


        {/* =================================================
            FILTER TOOLBAR
        ================================================= */}

        <div className="notes-filter-section">

          <div className="notes-filter-heading">

            <div>
              <h3>
                Filter & Sort
              </h3>

              <span>
                Refine your results
              </span>
            </div>


            {hasActiveFilters && (
              <button
                type="button"
                className="notes-clear-filters"
                onClick={clearFilters}
              >
                Reset Filters
              </button>
            )}

          </div>


          <div className="notes-filter-grid">


            {/* ============================================
                STREAM
            ============================================ */}

            <div className="notes-filter-item">

              <label htmlFor="notes-stream">
                Stream
              </label>

              <select
                id="notes-stream"
                value={streamFilter}
                onChange={(e) =>
                  setStreamFilter(
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Streams
                </option>

                {streamOptions.map(
                  (stream) => (
                    <option
                      value={stream}
                      key={stream}
                    >
                      {stream}
                    </option>
                  )
                )}

              </select>

            </div>


            {/* ============================================
                SEMESTER
            ============================================ */}

            <div className="notes-filter-item">

              <label htmlFor="notes-semester">
                Semester
              </label>

              <select
                id="notes-semester"
                value={semesterFilter}
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
                      value={semester}
                      key={semester}
                    >
                      {semester}
                    </option>
                  )
                )}

              </select>

            </div>


            {/* ============================================
                TAG
            ============================================ */}

            <div className="notes-filter-item">

              <label htmlFor="notes-tag">
                Tag
              </label>

              <select
                id="notes-tag"
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

                {tags.map(
                  (tag) => (
                    <option
                      value={tag}
                      key={tag}
                    >
                      #{tag}
                    </option>
                  )
                )}

              </select>

            </div>


            {/* ============================================
                SORT
            ============================================ */}

            <div className="notes-filter-item">

              <label htmlFor="notes-sort">
                Sort By
              </label>

              <select
                id="notes-sort"
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
                  A → Z
                </option>

                <option value="za">
                  Z → A
                </option>

              </select>

            </div>

          </div>

        </div>


        {/* =================================================
            RESULTS BAR
        ================================================= */}

        {!loading && (

          <div className="notes-results-bar">

            <div className="notes-results-info">

              <span className="notes-results-icon">
                📖
              </span>

              <span>
                Showing{" "}
                <strong>
                  {filteredNotes.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {notes.length}
                </strong>{" "}
                notes
              </span>

            </div>


            {hasActiveFilters && (
              <span className="notes-filter-active">
                Filters applied
              </span>
            )}

          </div>

        )}

      </section>


      {/* ==================================================
          NOTES CONTENT
      ================================================== */}

      <section className="notes-content">


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="notes-state">

            <div className="notes-loading-icon">
              ⏳
            </div>

            <h3>
              Loading notes...
            </h3>

            <p>
              Please wait while we fetch the
              latest notes.
            </p>

          </div>


        ) : filteredNotes.length === 0 ? (


          /* ===============================================
             EMPTY STATE
          =============================================== */

          <div className="notes-state notes-empty-state">

            <div className="notes-empty-icon">
              🔍
            </div>

            <h3>
              No notes found
            </h3>

            <p>
              We couldn't find any notes matching
              your search or filters.
            </p>

            {hasActiveFilters && (

              <button
                type="button"
                className="notes-empty-reset"
                onClick={clearFilters}
              >
                Clear Filters
              </button>

            )}

          </div>


        ) : (


          /* ===============================================
             NOTE GRID
          =============================================== */

          <div className="notes-grid">


            {filteredNotes.map(
              (note) => (

                <article
                  className="note-card"
                  key={note._id}
                >


                  {/* ======================================
                      CARD TOP
                  ====================================== */}

                  <div className="note-card-top">

                    <span className="note-card-type">
                      📄 NOTE
                    </span>

                    {note.stream && (
                      <span className="note-card-stream">
                        {note.stream}
                      </span>
                    )}

                  </div>


                  {/* ======================================
                      TITLE
                  ====================================== */}

                  <h3 className="note-card-title">
                    {note.title}
                  </h3>


                  {/* ======================================
                      SUBJECT
                  ====================================== */}

                  {note.subject && (

                    <div className="note-card-subject">

                      <span>
                        Subject
                      </span>

                      <strong>
                        {note.subject}
                      </strong>

                    </div>

                  )}


                  {/* ======================================
                      ACADEMIC META
                  ====================================== */}

                  <div className="note-card-meta">

                    {note.semester && (
                      <span>
                        🎓 {note.semester}
                      </span>
                    )}

                    {note.createdAt && (
                      <span>
                        📅{" "}
                        {new Date(
                          note.createdAt
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    )}

                  </div>


                  {/* ======================================
                      CONTENT PREVIEW
                  ====================================== */}

                  {note.content && (

                    <p className="note-card-content">
                      {note.content}
                    </p>

                  )}


                  {/* ======================================
                      TAGS
                  ====================================== */}

                  {Array.isArray(note.tags) &&
                    note.tags.length > 0 && (

                      <div className="note-card-tags">

                        {note.tags.map(
                          (tag, index) => (

                            <span
                              key={`${tag}-${index}`}
                            >
                              #{tag}
                            </span>

                          )
                        )}

                      </div>

                    )}


                  {/* ======================================
                      CARD FOOTER
                  ====================================== */}

                  <div className="note-card-footer">


                    {/* ------------------------------------
                        OWNER
                    ------------------------------------ */}

                    <div className="note-card-owner">

                      <span className="note-owner-avatar">
                        {(note.ownerName ||
                          "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <div>

                        <span>
                          Uploaded by
                        </span>

                        <strong>
                          {note.ownerName ||
                            "Unknown"}
                        </strong>

                      </div>

                    </div>


                    {/* ------------------------------------
                        FILE
                    ------------------------------------ */}

                    {note.fileName && (

                      <span
                        className="note-card-file"
                        title={note.fileName}
                      >
                        📎{" "}
                        {note.fileName}
                      </span>

                    )}

                  </div>


                  {/* ======================================
                      VIEW NOTE
                  ====================================== */}

                  <Link
                    to={`/note/${note._id}`}
                    className="note-view-btn"
                  >
                    <span>
                      View Note
                    </span>

                    <span
                      aria-hidden="true"
                    >
                      →
                    </span>

                  </Link>

                </article>

              )
            )}

          </div>

        )}

      </section>

    </div>
  );
}

export default Notes;