const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema(
  {
    registrationEnabled: {
      type: Boolean,
      default: true,
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    platformName: {
      type: String,
      default: "NoteHub",
      trim: true,
      maxlength: 100,
    },

    platformDescription: {
      type: String,
      default: "Your learning resources, all in one place.",
      trim: true,
      maxlength: 500,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PlatformSettings",
  platformSettingsSchema
);
