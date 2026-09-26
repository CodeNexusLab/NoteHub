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

        // Make sure API returned an array
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
  // Tags remain dynamic because users can create
  // different tags while uploading notes.
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


    // ----------------------------------------------------
    // FILTER NOTES
    // ----------------------------------------------------

    const filtered = notes.filter((note) => {

      // ----------------------------------------------
      // TITLE
      // ----------------------------------------------

      const title =
        String(note.title || "")
          .toLowerCase();


      // ----------------------------------------------
      // SUBJECT
      // ----------------------------------------------

      const subject =
        String(note.subject || "")
          .toLowerCase();


      // ----------------------------------------------
      // CONTENT
      // ----------------------------------------------

      const content =
        String(note.content || "")
          .toLowerCase();


      // ----------------------------------------------
      // OWNER / USER
      // ----------------------------------------------

      const owner =
        String(
          note.ownerName ||
          note.ownerEmail ||
          ""
        ).toLowerCase();


      // ----------------------------------------------
      // TAGS
      // ----------------------------------------------

      const noteTags =
        Array.isArray(note.tags)
          ? note.tags
              .map((tag) =>
                String(tag).toLowerCase()
              )
              .join(" ")
          : "";


      // ----------------------------------------------
      // SEARCH
      // ----------------------------------------------

      const matchesSearch =
        !searchText ||
        title.includes(searchText) ||
        subject.includes(searchText) ||
        content.includes(searchText) ||
        owner.includes(searchText) ||
        noteTags.includes(searchText);


      // ----------------------------------------------
      // STREAM FILTER
      // ----------------------------------------------

      const matchesStream =
        !streamFilter ||
        note.stream === streamFilter;


      // ----------------------------------------------
      // SEMESTER FILTER
      // ----------------------------------------------

      const matchesSemester =
        !semesterFilter ||
        note.semester === semesterFilter;


      // ----------------------------------------------
      // TAG FILTER
      // ----------------------------------------------

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


      // ----------------------------------------------
      // FINAL FILTER RESULT
      // ----------------------------------------------

      return (
        matchesSearch &&
        matchesStream &&
        matchesSemester &&
        matchesTag
      );

    });


    // ==================================================
    // SORT NOTES
    // ==================================================

    const sortedNotes =
      [...filtered].sort((a, b) => {

        // ----------------------------------------------
        // NEWEST FIRST
        // ----------------------------------------------

        if (sortBy === "newest") {
          return (
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
          );
        }


        // ----------------------------------------------
        // OLDEST FIRST
        // ----------------------------------------------

        if (sortBy === "oldest") {
          return (
            new Date(a.createdAt || 0) -
            new Date(b.createdAt || 0)
          );
        }


        // ----------------------------------------------
        // A → Z
        // ----------------------------------------------

        if (sortBy === "az") {
          return (
            String(a.title || "")
              .localeCompare(
                String(b.title || "")
              )
          );
        }


        // ----------------------------------------------
        // Z → A
        // ----------------------------------------------

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


        {/* =================================================
            ADVANCED SEARCH
        ================================================= */}

        <input
          type="text"
          placeholder="Search by title, subject, content, tags, user..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />


        {/* =================================================
            FILTER CONTROLS
        ================================================= */}

        <div className="notes-filters">


          {/* ===============================================
              STREAM FILTER
          =============================================== */}

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


          {/* ===============================================
              SEMESTER FILTER
          =============================================== */}

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


          {/* ===============================================
              TAG FILTER
          =============================================== */}

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


          {/* ===============================================
              SORT
          =============================================== */}

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


          {/* ===============================================
              CLEAR FILTERS
          =============================================== */}

          {hasActiveFilters && (

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>

          )}

        </div>


        {/* =================================================
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

          filteredNotes.map(
            (note) => (

              <div
                className="note-card"
                key={note._id}
              >


                {/* -----------------------------------------
                    NOTE TITLE
                ----------------------------------------- */}

                <h3>
                  {note.title}
                </h3>


                {/* -----------------------------------------
                    SUBJECT
                ----------------------------------------- */}

                <p>

                  <strong>
                    Subject:
                  </strong>{" "}

                  {note.subject}

                </p>


                {/* -----------------------------------------
                    STREAM
                ----------------------------------------- */}

                {note.stream && (

                  <p>

                    <strong>
                      Stream:
                    </strong>{" "}

                    {note.stream}

                  </p>

                )}


                {/* -----------------------------------------
                    SEMESTER
                ----------------------------------------- */}

                {note.semester && (

                  <p>

                    <strong>
                      Semester:
                    </strong>{" "}

                    {note.semester}

                  </p>

                )}


                {/* -----------------------------------------
                    UPLOADED BY
                ----------------------------------------- */}

                <p>

                  <strong>
                    Uploaded by:
                  </strong>{" "}

                  {note.ownerName ||
                    "Unknown"}

                </p>


                {/* -----------------------------------------
                    NOTE CONTENT
                ----------------------------------------- */}

                <p>
                  {note.content}
                </p>


                {/* -----------------------------------------
                    TAGS
                ----------------------------------------- */}

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


                {/* -----------------------------------------
                    FILE NAME
                ----------------------------------------- */}

                {note.fileName && (

                  <p>
                    📎 {note.fileName}
                  </p>

                )}


                {/* -----------------------------------------
                    CREATED DATE
                ----------------------------------------- */}

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


                {/* -----------------------------------------
                    VIEW NOTE
                ----------------------------------------- */}

                <Link
                  to={`/note/${note._id}`}
                >

                  <button>
                    View Note →
                  </button>

                </Link>

              </div>

            )
          )

        )}

      </div>

    </div>
  );
}

export default Notes;