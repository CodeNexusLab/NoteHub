const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "login_success",
        "login_failed",
        "account_suspended",
        "account_reactivated",
        "admin_action",
      ],
    },

    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actorName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: null,
    },

    actorRole: {
      type: String,
      enum: ["user", "admin", "superadmin", "unknown"],
      default: "unknown",
    },

    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    targetEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: null,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    ipAddress: {
      type: String,
      maxlength: 100,
      default: null,
    },

    userAgent: {
      type: String,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Efficient filtering and newest-first event retrieval.
securityLogSchema.index({ createdAt: -1 });
securityLogSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model(
  "SecurityLog",
  securityLogSchema
);