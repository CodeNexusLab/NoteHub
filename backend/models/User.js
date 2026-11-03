const mongoose = require("mongoose");

// =========================================
// USER SCHEMA
// =========================================
const userSchema = new mongoose.Schema(
  {
    // =========================================
    // USER NAME
    // =========================================
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    // =========================================
    // USER EMAIL
    // =========================================
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
    },

    // =========================================
    // USER PASSWORD
    // Stored as a bcrypt hash by the backend
    // =========================================
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    // =========================================
    // USER ROLE
    // user       → Normal NoteHub user
    // admin      → Administrator
    // superadmin → Full platform control
    // =========================================
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "superadmin"],
        message: "Invalid user role",
      },
      default: "user",
      required: true,
    },

    // =========================================
    // ACCOUNT STATUS
    // active    → Account can be used
    // suspended → Account access restricted
    // =========================================
    accountStatus: {
      type: String,
      enum: {
        values: ["active", "suspended"],
        message: "Invalid account status",
      },
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================
// USER MODEL
// =========================================
module.exports = mongoose.model("User", userSchema);
