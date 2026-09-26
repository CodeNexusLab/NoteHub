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


  // ======================================================
  // CREATE UNIQUE STREAM LIST
  // ======================================================

  const streams = useMemo(() => {
    return [
      ...new Set(
        notes
          .map((note) => note.stream)
          .filter(Boolean)
      ),
    ].sort();

  }, [notes]);


  // ======================================================
  // CREATE UNIQUE SEMESTER LIST
  // ======================================================

  const semesters = useMemo(() => {
    return [
      ...new Set(
        notes
          .map((note) => note.semester)
          .filter(Boolean)
      ),
    ];

  }, [notes]);


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
              tag.toLowerCase()
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


    // ----------------------------------------------------
    // SEARCH + FILTER
    // ----------------------------------------------------

    const filtered = notes.filter((note) => {

      const title =
        (note.title || "")
          .toLowerCase();

      const subject =
        (note.subject || "")
          .toLowerCase();

      const content =
        (note.content || "")
          .toLowerCase();

      const owner =
        (note.ownerName || "")
          .toLowerCase();

      const noteTags =
        Array.isArray(note.tags)
          ? note.tags
              .join(" ")
              .toLowerCase()
          : "";


      // Advanced search
      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        subject.includes(searchText) ||
        content.includes(searchText) ||
        owner.includes(searchText) ||
        noteTags.includes(searchText);


      // Stream filter
      const matchesStream =
        !streamFilter ||
        note.stream === streamFilter;


      // Semester filter
      const matchesSemester =
        !semesterFilter ||
        note.semester === semesterFilter;


      // Tag filter
      const matchesTag =
        !tagFilter ||
        (
          Array.isArray(note.tags) &&
          note.tags.some(
            (tag) =>
              tag.toLowerCase() ===
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


    // ----------------------------------------------------
    // SORT NOTES
    // ----------------------------------------------------

    const sortedNotes =
      [...filtered].sort((a, b) => {

        // Newest first
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt) -
            new Date(a.createdAt)
          );
        }


        // Oldest first
        if (sortBy === "oldest") {
          return (
            new Date(a.createdAt) -
            new Date(b.createdAt)
          );
        }


        // A → Z
        if (sortBy === "az") {
          return (
            (a.title || "")
              .localeCompare(
                b.title || ""
              )
          );
        }


        // Z → A
        if (sortBy === "za") {
          return (
            (b.title || "")
              .localeCompare(
                a.title || ""
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
  // CLEAR ALL FILTERS
  // ======================================================

  const clearFilters = () => {
    setSearch("");
    setStreamFilter("");
    setSemesterFilter("");
    setTagFilter("");
    setSortBy("newest");
  };


  // ======================================================
  // CHECK WHETHER ANY FILTER IS ACTIVE
  // ======================================================

  const hasActiveFilters =
    search !== "" ||
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
          NOTES HEADER
      ================================================== */}

      <div className="notes-header">

        <h1>
          Explore Notes
        </h1>

        <p>
          Discover useful notes and
          learning resources.
        </p>


        {/* ================================================
            ADVANCED SEARCH
        ================================================= */}

        <input
          type="text"
          placeholder="Search by title, subject, content, tags..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />


        {/* ================================================
            FILTER CONTROLS
        ================================================= */}

        <div className="notes-filters">


          {/* ----------------------------------------------
              STREAM FILTER
          ---------------------------------------------- */}

          <select
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

            {streams.map((stream) => (
              <option
                value={stream}
                key={stream}
              >
                {stream}
              </option>
            ))}

          </select>


          {/* ----------------------------------------------
              SEMESTER FILTER
          ---------------------------------------------- */}

          <select
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

            {semesters.map((semester) => (
              <option
                value={semester}
                key={semester}
              >
                {semester}
              </option>
            ))}

          </select>


          {/* ----------------------------------------------
              TAG FILTER
          ---------------------------------------------- */}

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

            {tags.map((tag) => (
              <option
                value={tag}
                key={tag}
              >
                #{tag}
              </option>
            ))}

          </select>


          {/* ----------------------------------------------
              SORT
          ---------------------------------------------- */}

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
              A → Z
            </option>

            <option value="za">
              Z → A
            </option>

          </select>


          {/* ----------------------------------------------
              CLEAR FILTERS
          ---------------------------------------------- */}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}

        </div>


        {/* ================================================
            RESULT COUNT
        ================================================= */}

        {!loading && (
          <p className="notes-result-count">
            Showing{" "}
            <strong>
              {filteredNotes.length}
            </strong>{" "}
            of{" "}
            <strong>
              {notes.length}
            </strong>{" "}
            notes
          </p>
        )}

      </div>


      {/* ==================================================
          NOTES GRID
      ================================================== */}

      <div className="notes-grid">


        {/* =================================================
            LOADING STATE
        ================================================= */}

        {loading ? (

          <p className="no-notes">
            Loading notes... ⏳
          </p>


        ) : filteredNotes.length === 0 ? (


          /* ===============================================
             EMPTY STATE
          =============================================== */

          <div className="no-notes">

            <h3>
              No notes found 🔍
            </h3>

            <p>
              Try changing your search
              or filters.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}

          </div>


        ) : (


          /* ===============================================
             NOTE CARDS
          =============================================== */

          filteredNotes.map((note) => (

            <div
              className="note-card"
              key={note._id}
            >


              {/* -------------------------------------------
                  NOTE TITLE
              ------------------------------------------- */}

              <h3>
                {note.title}
              </h3>


              {/* -------------------------------------------
                  SUBJECT
              ------------------------------------------- */}

              <p>
                <strong>
                  Subject:
                </strong>{" "}
                {note.subject}
              </p>


              {/* -------------------------------------------
                  STREAM
              ------------------------------------------- */}

              {note.stream && (
                <p>
                  <strong>
                    Stream:
                  </strong>{" "}
                  {note.stream}
                </p>
              )}


              {/* -------------------------------------------
                  SEMESTER
              ------------------------------------------- */}

              {note.semester && (
                <p>
                  <strong>
                    Semester:
                  </strong>{" "}
                  {note.semester}
                </p>
              )}


              {/* -------------------------------------------
                  UPLOADED BY
              ------------------------------------------- */}

              <p>
                <strong>
                  Uploaded by:
                </strong>{" "}
                {note.ownerName ||
                  "Unknown"}
              </p>


              {/* -------------------------------------------
                  NOTE CONTENT
              ------------------------------------------- */}

              <p>
                {note.content}
              </p>


              {/* -------------------------------------------
                  TAGS
              ------------------------------------------- */}

              {Array.isArray(note.tags) &&
                note.tags.length > 0 && (

                  <div className="note-tags">

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


              {/* -------------------------------------------
                  FILE NAME
              ------------------------------------------- */}

              {note.fileName && (
                <p>
                  📎 {note.fileName}
                </p>
              )}


              {/* -------------------------------------------
                  CREATED DATE
              ------------------------------------------- */}

              {note.createdAt && (
                <p>
                  <strong>
                    Added:
                  </strong>{" "}
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
                </p>
              )}


              {/* -------------------------------------------
                  VIEW NOTE
              ------------------------------------------- */}

              <Link
                to={`/note/${note._id}`}
              >
                <button>
                  View Note →
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