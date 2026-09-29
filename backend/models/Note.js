const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    // =========================================
    // BASIC NOTE INFORMATION
    // =========================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },


    // =========================================
    // ACADEMIC COURSE
    // Example:
    // BCA
    // =========================================

    course: {
      type: String,
      required: true,
      trim: true,
    },


    // =========================================
    // SEMESTER
    // Example:
    // 1st Semester
    // 2nd Semester
    // ...
    // 6th Semester
    // =========================================

    semester: {
      type: String,
      required: true,
      trim: true,
    },


    // =========================================
    // ACADEMIC STREAM
    // Kept for backward compatibility
    // with existing NoteHub notes.
    // Example:
    // BCA
    // =========================================

    stream: {
      type: String,
      required: true,
      trim: true,
    },


    // =========================================
    // RESOURCE TYPE
    //
    // note            → Normal study note
    // previous-paper  → Previous year question paper
    // other            → Other / uncategorized
    // =========================================

    resourceType: {
      type: String,
      enum: [
        "note",
        "previous-paper",
        "other",
      ],
      default: "note",
      trim: true,
    },


    // =========================================
    // NOTE TAGS
    // Example:
    // ["javascript", "react", "frontend"]
    // =========================================

    tags: {
      type: [String],
      default: [],
    },


    // =========================================
    // NOTE OWNER INFORMATION
    // =========================================

    ownerEmail: {
      type: String,
      required: true,
    },

    ownerName: {
      type: String,
      required: true,
    },


    // =========================================
    // OPTIONAL FILE INFORMATION
    // =========================================

    fileName: {
      type: String,
    },

    fileData: {
      type: String,
    },
  },

  {
    // Automatically creates:
    // createdAt
    // updatedAt
    timestamps: true,
  }
);


// =========================================
// EXPORT NOTE MODEL
// =========================================

module.exports = mongoose.model(
  "Note",
  noteSchema
);