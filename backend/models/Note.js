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
    // ACADEMIC INFORMATION
    // Used for Stream + Semester filtering
    // =========================================

    stream: {
      type: String,
      required: true,
      trim: true,
    },

    semester: {
      type: String,
      required: true,
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

module.exports = mongoose.model("Note", noteSchema);