const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    ownerEmail: {
      type: String,
      required: true,
    },

    ownerName: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
    },

    fileData: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Note", noteSchema);