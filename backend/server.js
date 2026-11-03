require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/Note");
const User = require("./models/User");
const SecurityLog = require("./models/SecurityLog");
const PlatformSettings = require("./models/PlatformSettings");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

const allowedOrigins = [
  "https://notehub-frontend-254v.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));

// LOGIN RATE LIMITER 🔐
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || !process.env.MONGODB_URI) {
  console.error("JWT_SECRET or MONGODB_URI is missing.");
  process.exit(1);
}

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// SECURITY LOGGING HELPER
const logSecurityEvent = async ({
  eventType,
  actorUserId = null,
  actorName = null,
  actorEmail = null,
  actorRole = "unknown",
  targetUserId = null,
  targetEmail = null,
  description,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await SecurityLog.create({
      eventType,
      actorUserId,
      actorName,
      actorEmail,
      actorRole,
      targetUserId,
      targetEmail,
      description,
      ipAddress,
      userAgent,
    });

    return true;
  } catch (error) {
    // Security logging failures must not crash the application.
    console.error(
      "Security event logging failed:",
      error.message
    );

    return false;
  }
};

const initializeSuperAdmin = async () => {
  const email = process.env.SUPERADMIN_EMAIL?.trim();

  // Never modify roles if the environment variable is missing.
  if (!email) {
    console.error(
      "SUPERADMIN_EMAIL is missing. Super Admin initialization aborted."
    );
    return;
  }

  try {
    // Find the designated Super Admin account.
    const user = await User.findOne({
      email: new RegExp(`^${escapeRegex(email)}$`, "i"),
    });

    // Do not change any roles if the configured account is missing.
    if (!user) {
      console.error(
        "Configured Super Admin account not found. Initialization aborted."
      );
      return;
    }

    // Never grant Super Admin privileges to a suspended account.
    if (user.accountStatus === "suspended") {
      console.error(
        "Configured Super Admin account is suspended. Initialization aborted."
      );
      return;
    }

    // Ensure the designated account has the Super Admin role first.
    if (user.role !== "superadmin") {
      user.role = "superadmin";
      await user.save();

      console.log(
        "Designated Super Admin role initialized successfully."
      );
    }

    // Demote every other Super Admin account to a normal user.
    const result = await User.updateMany(
      {
        _id: { $ne: user._id },
        role: "superadmin",
      },
      {
        $set: { role: "user" },
      }
    );

    if (result.modifiedCount > 0) {
      console.warn(
        `${result.modifiedCount} other Super Admin account(s) were demoted.`
      );
    }

    console.log(
      "Single Super Admin initialization completed successfully."
    );
  } catch (error) {
    console.error(
      "Super Admin initialization error:",
      error.message
    );
  }
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Token required ❌",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.id || !mongoose.isValidObjectId(decoded.id)) {
      return res.status(401).json({
        message: "Invalid authentication token ❌",
      });
    }

    const user = await User.findById(decoded.id).select(
      "_id name email role accountStatus"
    );

    if (!user) {
      return res.status(401).json({
        message: "User account not found ❌",
      });
    }

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        message: "This account has been suspended ❌",
      });
    }

    const allowedRoles = ["user", "admin", "superadmin"];

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: allowedRoles.includes(user.role) ? user.role : "user",
      accountStatus: user.accountStatus || "active",
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token ❌",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Authentication failed ❌",
    });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required ❌",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Permission denied ❌",
      });
    }

    next();
  };
};

// 🔧 Maintenance Mode Middleware
const maintenanceModeMiddleware = async (req, res, next) => {
  try {
    // Keep the backend health check accessible
    if (req.path === "/api/health") {
      return next();
    }

    // Allow public maintenance status checks
if (req.path === "/api/maintenance-status") {
  return next();
}

    // Allow login so the superadmin can authenticate
    if (req.path === "/api/login" && req.method === "POST") {
      return next();
    }

    // Allow superadmin verification and settings access.
    // These routes must retain their existing authentication
    // and authorizeRoles("superadmin") middleware.
    const isSuperadminControlRoute =
      req.path === "/api/admin/verify" ||
      (
        req.path === "/api/admin/settings" &&
        ["GET", "PUT"].includes(req.method)
      );

    if (isSuperadminControlRoute) {
      return next();
    }

    // Check the current maintenance setting
    const settings = await PlatformSettings.findOne()
      .select("maintenanceMode")
      .lean();

    // Continue normally when maintenance is disabled
    if (!settings?.maintenanceMode) {
      return next();
    }

    // Block other API requests during maintenance
    if (req.path.startsWith("/api/")) {
      return res.status(503).json({
        maintenanceMode: true,
        message:
          "NoteHub is temporarily under maintenance. Please try again later. 🛠️",
      });
    }

    next();
  } catch (error) {
    console.error("Maintenance Mode Middleware Error:", error);

    return res.status(503).json({
      maintenanceMode: true,
      message:
        "Unable to verify platform availability. Please try again later.",
    });
  }
};

app.use(maintenanceModeMiddleware);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected successfully 🥳");
    await initializeSuperAdmin();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// REGISTER

app.post("/api/register", async (req, res) => {
  try {

    const settings = await PlatformSettings.findOne();

if (settings && settings.registrationEnabled === false) {
  return res.status(403).json({
    message: "New registrations are currently disabled ❌",
  });
}

    const { name, email, password } = req.body;

        // Check whether new user registration is enabled
    const platformSettings = await PlatformSettings.findOne();

    if (
      platformSettings &&
      platformSettings.registrationEnabled === false
    ) {
      return res.status(403).json({
        message:
          "New registrations are currently disabled by the administrator ❌",
      });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email and password are required ❌",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (cleanName.length < 2 || cleanName.length > 50) {
      return res.status(400).json({
        message: "Name must contain 2–50 characters ❌",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address ❌",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long ❌",
      });
    }

    const existingUser = await User.findOne({
      email: new RegExp(`^${escapeRegex(cleanEmail)}$`, "i"),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists ❌",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: "user",
      accountStatus: "active",
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "User registered successfully 🚀",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(error.code === 11000 ? 409 : 500).json({
      message:
        error.code === 11000
          ? "An account with this email already exists ❌"
          : "Failed to register user ❌",
    });
  }
});

// LOGIN

app.post("/api/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Email and password are required ❌",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({
      email: new RegExp(
        `^${escapeRegex(normalizedEmail)}$`,
        "i"
      ),
    }).select("+password");

    // Record failed login without storing the password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await logSecurityEvent({
        eventType: "login_failed",
        actorEmail: normalizedEmail,
        actorRole: "unknown",
        description: "Login failed: invalid email or password.",
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || null,
      });

      return res.status(401).json({
        message: "Invalid email or password!",
      });
    }

    // Record attempts against suspended accounts
    if (user.accountStatus === "suspended") {
      await logSecurityEvent({
        eventType: "login_failed",
        actorUserId: user._id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role || "user",
        description: "Login blocked: account is suspended.",
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || null,
      });

      return res.status(403).json({
        message: "This account has been suspended ❌",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Record successful login
    await logSecurityEvent({
      eventType: "login_success",
      actorUserId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role || "user",
      description: "User logged in successfully.",
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || null,
    });

    // Preserve existing response structure
    return res.json({
      message: "Login successful! 🚀",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        accountStatus: user.accountStatus || "active",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed ❌",
    });
  }
});


// GET PROFILE

app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found ❌",
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        role: user.role || "user",
        accountStatus: user.accountStatus || "active",
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);

    return res.status(500).json({
      message: "Failed to fetch profile ❌",
    });
  }
});

// UPDATE PROFILE

app.put("/api/profile", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Name is required ❌",
      });
    }

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 50) {
      return res.status(400).json({
        message: "Name must contain 2–50 characters ❌",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found ❌",
      });
    }

    user.name = cleanName;

    const updatedUser = await user.save();

    return res.json({
      message: "Profile updated successfully ✅",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        role: updatedUser.role || "user",
        accountStatus: updatedUser.accountStatus || "active",
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      message: "Failed to update profile ❌",
    });
  }
});

// CREATE NOTE

app.post("/api/notes", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      course,
      stream,
      semester,
      subject,
      resourceType,
      visibility, // NEW
      tags,
      content,
      fileName,
      fileData,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found ❌",
      });
    }

    const requiredFields = {
      title,
      course,
      stream,
      semester,
      subject,
      content,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          message: `${field} is required ❌`,
        });
      }
    }

    // RESOURCE TYPE VALIDATION
    const allowedTypes = ["note", "previous-paper", "other"];

    const cleanResourceType = allowedTypes.includes(resourceType)
      ? resourceType
      : "note";

    // NEW: VISIBILITY VALIDATION
    const allowedVisibilities = ["public", "private"];

    if (
      visibility !== undefined &&
      !allowedVisibilities.includes(visibility)
    ) {
      return res.status(400).json({
        message: "Invalid note visibility ❌",
      });
    }

    const cleanVisibility = visibility || "public";

    // TAGS
    const cleanTags = Array.isArray(tags)
      ? tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [];

    const newNote = new Note({
      title: title.trim(),
      course: course.trim(),
      stream: stream.trim(),
      semester: semester.trim(),
      subject: subject.trim(),
      resourceType: cleanResourceType,
      visibility: cleanVisibility, // NEW
      tags: cleanTags,
      content: content.trim(),
      fileName,
      fileData,
      ownerEmail: user.email,
      ownerName: user.name,
    });

    const savedNote = await newNote.save();

    return res.status(201).json({
      message: "Note created successfully 🚀",
      note: savedNote,
    });
  } catch (error) {
    console.error("Create note error:", error);

    return res.status(500).json({
      message: "Failed to create note ❌",
    });
  }
});

// GET ALL PUBLIC NOTES
// Disabled notes are excluded. Legacy records without status remain visible.

app.get("/api/notes", async (req, res) => {
  try {
    const {
      search,
      course,
      stream,
      semester,
      subject,
      resourceType,
      tag,
      sort,
    } = req.query;

    // Only active notes and legacy notes without status
    const filter = {
      $and: [
        {
          $or: [
            { status: "active" },
            { status: { $exists: false } },
            { status: null },
          ],
        },

        // Only public notes and legacy notes without visibility
        {
          $or: [
            { visibility: "public" },
            { visibility: { $exists: false } },
            { visibility: null },
          ],
        },
      ],
    };

    // SEARCH
    if (typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");

      filter.$and.push({
        $or: [
          { title: searchRegex },
          { subject: searchRegex },
          { content: searchRegex },
          { ownerName: searchRegex },
          { course: searchRegex },
          { stream: searchRegex },
          { semester: searchRegex },
          { tags: searchRegex },
        ],
      });
    }

    // COURSE FILTER
    if (typeof course === "string" && course.trim()) {
      filter.course = course.trim();
    }

    // STREAM FILTER
    if (typeof stream === "string" && stream.trim()) {
      filter.stream = stream.trim();
    }

    // SEMESTER FILTER
    if (typeof semester === "string" && semester.trim()) {
      filter.semester = semester.trim();
    }

    // SUBJECT FILTER
    if (typeof subject === "string" && subject.trim()) {
      filter.subject = subject.trim();
    }

    // RESOURCE TYPE FILTER
    if (typeof resourceType === "string" && resourceType.trim()) {
      filter.resourceType = resourceType.trim();
    }

    // TAG FILTER
    if (typeof tag === "string" && tag.trim()) {
      filter.tags = { $in: [tag.trim()] };
    }

    // SORTING
    let sortOption = { createdAt: -1 };

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "title-asc") {
      sortOption = { title: 1 };
    } else if (sort === "title-desc") {
      sortOption = { title: -1 };
    }

    // FETCH NOTES
    const notes = await Note.find(filter)
      .select("-fileData")
      .sort(sortOption)
      .lean();

    return res.json(notes);

  } catch (error) {
    console.error("Fetch notes error:", error);

    return res.status(500).json({
      message: "Failed to fetch notes ❌",
    });
  }
});

// GET MY NOTES
// Returns all notes (public + private + admin-disabled)
// belonging only to the authenticated user.

app.get("/api/my-notes", authenticateToken, async (req, res) => {
  try {
    const notes = await Note.find({
      ownerEmail: req.user.email,
    })
      .select("-fileData")
      .sort({ createdAt: -1 })
      .lean();

    res.set("Cache-Control", "no-store");

    return res.json(notes);

  } catch (error) {
    console.error("Fetch my notes error:", error);

    return res.status(500).json({
      message: "Failed to fetch your notes ❌",
    });
  }
});

// GET SINGLE PUBLIC NOTE
// Disabled notes cannot be opened through this route.

app.get("/api/notes/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid note ID ❌",
      });
    }

    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { status: "active" },
        { status: { $exists: false } },
        { status: null },
      ],
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found ❌",
      });
    }

    // PRIVATE NOTE ACCESS CHECK
    if (note.visibility === "private") {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({
          message: "This is a private note 🔒",
        });
      }

      try {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user || user.email !== note.ownerEmail) {
          return res.status(403).json({
            message: "You are not authorized to view this private note 🔒",
          });
        }
      } catch (authError) {
        return res.status(403).json({
          message: "Invalid or expired authentication token ❌",
        });
      }
    }

    return res.json(note);

  } catch (error) {
    console.error("Fetch single note error:", error);

    return res.status(500).json({
      message: "Failed to fetch note ❌",
    });
  }
});

// UPDATE NOTE — OWNER ONLY

app.put("/api/notes/:id", authenticateToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid note ID ❌",
      });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found ❌",
      });
    }

    if (note.ownerEmail !== req.user.email) {
      return res.status(403).json({
        message: "You can only edit your own notes ❌",
      });
    }

    const allowedTypes = ["note", "previous-paper", "other"];

    const cleanResourceType = allowedTypes.includes(
      req.body.resourceType
    )
      ? req.body.resourceType
      : "note";

    const cleanTags = Array.isArray(req.body.tags)
      ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [];

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        course: req.body.course,
        stream: req.body.stream,
        semester: req.body.semester,
        subject: req.body.subject,
        resourceType: cleanResourceType,
        tags: cleanTags,
        content: req.body.content,
        fileName: req.body.fileName,
        fileData: req.body.fileData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.json({
      message: "Note updated successfully ✏️",
      note: updatedNote,
    });
  } catch (error) {
    console.error("Update note error:", error);

    return res.status(500).json({
      message: "Failed to update note ❌",
    });
  }
});

// DELETE NOTE — OWNER ONLY

app.delete("/api/notes/:id", authenticateToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid note ID ❌",
      });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found ❌",
      });
    }

    if (note.ownerEmail !== req.user.email) {
      return res.status(403).json({
        message: "You can only delete your own notes ❌",
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Note deleted successfully 🗑️",
    });
  } catch (error) {
    console.error("Delete note error:", error);

    return res.status(500).json({
      message: "Failed to delete note ❌",
    });
  }
});

// ADMIN: GET ALL NOTES — SUPERADMIN ONLY

app.get(
  "/api/admin/notes",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const page = Math.max(
        1,
        parseInt(req.query.page, 10) || 1
      );

      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit, 10) || 10)
      );

      const skip = (page - 1) * limit;
      const search = String(req.query.search || "").trim();
      const filter = {};

      if (search) {
        const searchRegex = new RegExp(escapeRegex(search), "i");

        filter.$or = [
          { title: searchRegex },
          { subject: searchRegex },
          { ownerName: searchRegex },
          { ownerEmail: searchRegex },
          { course: searchRegex },
          { semester: searchRegex },
          { stream: searchRegex },
        ];
      }

      const allowedStatuses = ["active", "disabled"];

      if (req.query.status) {
        if (!allowedStatuses.includes(req.query.status)) {
          return res.status(400).json({
            message: "Invalid note status.",
          });
        }

        if (req.query.status === "active") {
          filter.$and = [
            {
              $or: [
                { status: "active" },
                { status: { $exists: false } },
                { status: null },
              ],
            },
          ];
        } else {
          filter.status = "disabled";
        }
      }

      const allowedTypes = ["note", "previous-paper", "other"];

      if (req.query.resourceType) {
        if (!allowedTypes.includes(req.query.resourceType)) {
          return res.status(400).json({
            message: "Invalid resource type.",
          });
        }

        filter.resourceType = req.query.resourceType;
      }

      // FIX: Course filter ignores case and extra outer spaces.
      const course = String(req.query.course || "").trim();

      if (course) {
        filter.course = {
          $regex: `^\\s*${escapeRegex(course)}\\s*$`,
          $options: "i",
        };
      }

      // FIX: Semester filter ignores case and extra outer spaces.
      const semester = String(req.query.semester || "").trim();

      if (semester) {
        filter.semester = {
          $regex: `^\\s*${escapeRegex(semester)}\\s*$`,
          $options: "i",
        };
      }

      const sortOrder = req.query.sort === "oldest" ? 1 : -1;

      const [notes, totalNotes] = await Promise.all([
        Note.aggregate([
          { $match: filter },
          { $project: { fileData: 0 } },
          {
            $sort: {
              createdAt: sortOrder,
              _id: sortOrder,
            },
          },
          { $skip: skip },
          { $limit: limit },
        ]).allowDiskUse(true),

        Note.countDocuments(filter),
      ]);

      return res.status(200).json({
        message: "Admin notes fetched successfully.",
        notes,
        pagination: {
          page,
          limit,
          totalNotes,
          totalPages: Math.ceil(totalNotes / limit),
        },
      });
    } catch (error) {
      console.error("Admin fetch notes error:", error);

      return res.status(500).json({
        message: "Failed to fetch notes.",
      });
    }
  }
);

// ADMIN: GET COURSE AND SEMESTER OPTIONS — SUPERADMIN ONLY

app.get(
  "/api/admin/note-filter-options",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const pairs = await Note.aggregate([
        {
          $project: {
            course: {
              $trim: {
                input: {
                  $ifNull: ["$course", ""],
                },
              },
            },
            semester: {
              $trim: {
                input: {
                  $ifNull: ["$semester", ""],
                },
              },
            },
          },
        },
        {
          $match: {
            course: { $ne: "" },
            semester: { $ne: "" },
          },
        },
        {
          $group: {
            _id: {
              course: "$course",
              semester: "$semester",
            },
          },
        },
        {
          $project: {
            _id: 0,
            course: "$_id.course",
            semester: "$_id.semester",
          },
        },
        {
          $sort: {
            course: 1,
            semester: 1,
          },
        },
      ]).allowDiskUse(true);

      return res.status(200).json({
        message: "Course and semester options fetched successfully.",
        pairs,
      });
    } catch (error) {
      console.error(
        "Admin note filter options error:",
        error
      );

      return res.status(500).json({
        message: "Failed to fetch course and semester options.",
      });
    }
  }
);

// ADMIN: HIDE / RESTORE NOTE — SUPERADMIN ONLY
// PATCH /api/admin/notes/:id/status
// Body: { "status": "disabled" } or { "status": "active" }

app.patch(
  "/api/admin/notes/:id/status",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid note ID ❌",
        });
      }

      if (!["active", "disabled"].includes(status)) {
        return res.status(400).json({
          message: 'Invalid status. Use "active" or "disabled" ❌',
        });
      }

      const note = await Note.findById(id);

      if (!note) {
        return res.status(404).json({
          message: "Note not found ❌",
        });
      }

      const previousStatus = note.status || "active";

      // Avoid duplicate logs when the status has not changed.
      if (previousStatus === status) {
        return res.status(200).json({
          message:
            status === "disabled"
              ? "Note is already hidden."
              : "Note is already active.",
          note: {
            _id: note._id,
            title: note.title,
            resourceType: note.resourceType,
            status: note.status,
          },
        });
      }

      // Update only the note status.
// This avoids validating unrelated legacy fields.
const updatedNote = await Note.findByIdAndUpdate(
  id,
  {
    $set: { status },
  },
  {
    new: true,
    runValidators: true,
  }
);

if (!updatedNote) {
  return res.status(404).json({
    message: "Note not found ❌",
  });
}

// Keep the in-memory note updated for the response and security log.
note.status = updatedNote.status;

      // Record the administrative action.
      await logSecurityEvent({
        eventType: "admin_action",
        actorUserId: req.user.id,
        actorName: req.user.name,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        targetUserId: note.userId || null,
        description:
          status === "disabled"
            ? `Super Admin hid note "${note.title}".`
            : `Super Admin restored note "${note.title}".`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || null,
      });

      return res.status(200).json({
        message:
          status === "disabled"
            ? "Note hidden successfully ✅"
            : "Note restored successfully ✅",
        note: {
          _id: note._id,
          title: note.title,
          resourceType: note.resourceType,
          status: note.status,
        },
      });
    } catch (error) {
      console.error("Admin note status update error:", error);

      const response = {
        message: "Failed to update note status ❌",
      };

      // Detailed error is returned only outside production.
      if (process.env.NODE_ENV !== "production") {
        response.error = error.message;
      }

      return res.status(500).json(response);
    }
  }
);


// ADMIN: GET ALL USERS — SUPERADMIN ONLY

app.get(
  "/api/admin/users",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const users = await User.find({})
        .select("_id name email role accountStatus createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean();

      const safeUsers = users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "user",
        accountStatus: user.accountStatus || "active",
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
      }));

      return res.status(200).json({
        message: "Users fetched successfully ✅",
        totalUsers: safeUsers.length,
        users: safeUsers,
      });
    } catch (error) {
      console.error("Fetch admin users error:", error);

      return res.status(500).json({
        message: "Failed to fetch users ❌",
      });
    }
  }
);

// ADMIN: SUSPEND / REACTIVATE USER — SUPERADMIN ONLY

app.patch(
  "/api/admin/users/:id/status",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { accountStatus } = req.body;

      // Validate user ID
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid user ID ❌",
        });
      }

      // Validate requested status
      if (!["active", "suspended"].includes(accountStatus)) {
        return res.status(400).json({
          message:
            'Invalid account status. Use "active" or "suspended" ❌',
        });
      }

      // Prevent Super Admin from changing their own status
      if (id === req.user.id) {
        return res.status(403).json({
          message: "You cannot change your own account status ❌",
        });
      }

      // Find target user
      const targetUser = await User.findById(id);

      if (!targetUser) {
        return res.status(404).json({
          message: "User not found ❌",
        });
      }

      // Protect Super Admin accounts from suspension
      if (
        targetUser.role === "superadmin" &&
        accountStatus === "suspended"
      ) {
        return res.status(403).json({
          message: "Super Admin accounts cannot be suspended ❌",
        });
      }

      // Avoid duplicate events when the status is unchanged
      const previousStatus = targetUser.accountStatus || "active";

      if (previousStatus === accountStatus) {
        return res.status(200).json({
          message: `User account is already ${accountStatus}.`,
          user: {
            id: targetUser._id.toString(),
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role || "user",
            accountStatus: previousStatus,
            createdAt: targetUser.createdAt || null,
            updatedAt: targetUser.updatedAt || null,
          },
        });
      }

      // Update account status
      targetUser.accountStatus = accountStatus;
      await targetUser.save();

      // Record the security event
      await logSecurityEvent({
        eventType:
          accountStatus === "suspended"
            ? "account_suspended"
            : "account_reactivated",

        actorUserId: req.user.id,
        actorName: req.user.name,
        actorEmail: req.user.email,
        actorRole: req.user.role,

        targetUserId: targetUser._id,
        targetEmail: targetUser.email,

        description:
          accountStatus === "suspended"
            ? `Super Admin suspended the account of ${targetUser.name}.`
            : `Super Admin reactivated the account of ${targetUser.name}.`,

        ipAddress: req.ip,
        userAgent: req.get("user-agent") || null,
      });

      // Return updated user
      return res.status(200).json({
        message:
          accountStatus === "suspended"
            ? "User suspended successfully 🚫"
            : "User reactivated successfully ✅",

        user: {
          id: targetUser._id.toString(),
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role || "user",
          accountStatus: targetUser.accountStatus || "active",
          createdAt: targetUser.createdAt || null,
          updatedAt: targetUser.updatedAt || null,
        },
      });
    } catch (error) {
      console.error("Update account status error:", error);

      return res.status(500).json({
        message: "Failed to update account status ❌",
      });
    }
  }
);


// ADMIN: PLATFORM ANALYTICS — SUPERADMIN ONLY
app.get(
  "/api/admin/analytics",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      // Generate daily date ranges using local server dates.
      const getDateRange = (days) => {
        const dates = [];
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);

          dates.push({
            date,
            key: [
              date.getFullYear(),
              String(date.getMonth() + 1).padStart(2, "0"),
              String(date.getDate()).padStart(2, "0"),
            ].join("-"),
          });
        }

        return dates;
      };

      // Aggregate documents by calendar day.
      const getDailyCounts = async (Model, days) => {
        const dates = getDateRange(days);
        const startDate = dates[0].date;

        const results = await Model.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        const countMap = new Map(
          results.map((item) => [item._id, item.count])
        );

        return dates.map(({ key }) => ({
          date: key,
          count: countMap.get(key) ?? 0,
        }));
      };

      const [
        totalUsers,
        activeUsers,
        suspendedUsers,
        adminUsers,
        superAdminUsers,
        totalResources,
        activeResources,
        disabledResources,
        resourceTypeDistribution,
        courseDistribution,
        semesterDistribution,
        userRegistration7Days,
        userRegistration30Days,
        resourceUpload7Days,
        resourceUpload30Days,
      ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ accountStatus: "active" }),
        User.countDocuments({ accountStatus: "suspended" }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "superadmin" }),

        Note.countDocuments({}),

        Note.countDocuments({
          $or: [
            { status: "active" },
            { status: { $exists: false } },
            { status: null },
          ],
        }),

        Note.countDocuments({ status: "disabled" }),

        Note.aggregate([
          {
            $group: {
              _id: { $ifNull: ["$resourceType", "note"] },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              resourceType: "$_id",
              count: 1,
            },
          },
          { $sort: { count: -1 } },
        ]),

        Note.aggregate([
          { $match: { course: { $exists: true, $ne: "" } } },
          {
            $group: {
              _id: { $trim: { input: "$course" } },
              count: { $sum: 1 },
            },
          },
          { $match: { _id: { $ne: "" } } },
          {
            $project: {
              _id: 0,
              course: "$_id",
              count: 1,
            },
          },
          { $sort: { count: -1 } },
        ]),

        Note.aggregate([
          { $match: { semester: { $exists: true, $ne: "" } } },
          {
            $group: {
              _id: { $trim: { input: "$semester" } },
              count: { $sum: 1 },
            },
          },
          { $match: { _id: { $ne: "" } } },
          {
            $project: {
              _id: 0,
              semester: "$_id",
              count: 1,
            },
          },
          { $sort: { count: -1 } },
        ]),

        getDailyCounts(User, 7),
        getDailyCounts(User, 30),
        getDailyCounts(Note, 7),
        getDailyCounts(Note, 30),
      ]);

      return res.status(200).json({
        message: "Platform analytics fetched successfully.",

        overview: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          adminUsers,
          superAdminUsers,
          totalResources,
          activeResources,
          disabledResources,
        },

        resourceTypeDistribution,
        courseDistribution,
        semesterDistribution,

        trends: {
          userRegistrations: {
            last7Days: userRegistration7Days,
            last30Days: userRegistration30Days,
          },

          resourceUploads: {
            last7Days: resourceUpload7Days,
            last30Days: resourceUpload30Days,
          },
        },

        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Platform analytics error:", error);

      return res.status(500).json({
        message: "Failed to fetch platform analytics.",
      });
    }
  }
);


// ADMIN: SECURITY ACTIVITY — SUPERADMIN ONLY
app.get(
  "/api/admin/security-logs",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      // =========================================
      // 1. VALIDATE LIMIT
      // =========================================

      const parsedLimit = Number.parseInt(req.query.limit, 10);

      const limit = Number.isFinite(parsedLimit)
        ? Math.min(Math.max(parsedLimit, 1), 100)
        : 50;

      // =========================================
      // 2. READ DATE FILTERS
      // =========================================

      const { startDate, endDate } = req.query;

      const hasStartDate = startDate !== undefined;
      const hasEndDate = endDate !== undefined;

      // Validate YYYY-MM-DD format and actual calendar date.
      const parseDate = (value, fieldName) => {
        if (
          typeof value !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
          const error = new Error(
            `${fieldName} must use YYYY-MM-DD format.`
          );

          error.statusCode = 400;
          throw error;
        }

        const parsedDate = new Date(`${value}T00:00:00.000Z`);

        if (
          Number.isNaN(parsedDate.getTime()) ||
          parsedDate.toISOString().slice(0, 10) !== value
        ) {
          const error = new Error(
            `${fieldName} is not a valid calendar date.`
          );

          error.statusCode = 400;
          throw error;
        }

        return parsedDate;
      };

      // =========================================
      // 3. BUILD MONGODB FILTER
      // =========================================

      const filter = {};

      let parsedStartDate = null;
      let parsedEndDate = null;

      if (hasStartDate) {
        parsedStartDate = parseDate(startDate, "startDate");
      }

      if (hasEndDate) {
        parsedEndDate = parseDate(endDate, "endDate");
      }

      if (
        parsedStartDate &&
        parsedEndDate &&
        parsedStartDate > parsedEndDate
      ) {
        return res.status(400).json({
          message: "startDate cannot be later than endDate.",
        });
      }

      const createdAtFilter = {};

      if (parsedStartDate) {
        createdAtFilter.$gte = parsedStartDate;
      }

      if (parsedEndDate) {
        // Include the entire end date by using the next day
        // as an exclusive upper boundary.
        const exclusiveEndDate = new Date(parsedEndDate);

        exclusiveEndDate.setUTCDate(
          exclusiveEndDate.getUTCDate() + 1
        );

        createdAtFilter.$lt = exclusiveEndDate;
      }

      if (Object.keys(createdAtFilter).length > 0) {
        filter.createdAt = createdAtFilter;
      }

      // =========================================
      // 4. FETCH FILTERED SECURITY LOGS
      // =========================================

      const [logs, totalLogs] = await Promise.all([
        SecurityLog.find(filter)
          .select(
            "eventType actorUserId actorName actorEmail actorRole targetUserId targetEmail description createdAt"
          )
          .sort({ createdAt: -1, _id: -1 })
          .limit(limit)
          .lean(),

        SecurityLog.countDocuments(filter),
      ]);

      // =========================================
      // 5. SEND RESPONSE
      // =========================================

      return res.status(200).json({
        message: "Security activity fetched successfully.",

        totalLogs,

        returnedLogs: logs.length,

        logs,

        filters: {
          startDate: hasStartDate ? startDate : null,
          endDate: hasEndDate ? endDate : null,
        },

        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      // Invalid date parameters return HTTP 400.
      if (error.statusCode === 400) {
        return res.status(400).json({
          message: error.message,
        });
      }

      console.error("Security activity fetch error:", error);

      return res.status(500).json({
        message: "Failed to fetch security activity.",
      });
    }
  }
);

// ADMIN: EXPORT SECURITY ACTIVITY CSV — SUPERADMIN ONLY
app.get(
  "/api/admin/security-logs/export",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        eventType = "all",
        search = "",
      } = req.query;

      // 1. Validate event type
      const allowedEventTypes = [
        "login_success",
        "login_failed",
        "account_suspended",
        "account_reactivated",
        "admin_action",
      ];

      if (
        eventType !== "all" &&
        !allowedEventTypes.includes(eventType)
      ) {
        return res.status(400).json({
          message: "Invalid event type.",
        });
      }

      // 2. Validate dates
      const parseDate = (value, fieldName) => {
        if (
          typeof value !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
          const error = new Error(
            `${fieldName} must use YYYY-MM-DD format.`
          );
          error.statusCode = 400;
          throw error;
        }

        const date = new Date(`${value}T00:00:00.000Z`);

        if (
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== value
        ) {
          const error = new Error(
            `${fieldName} is not a valid calendar date.`
          );
          error.statusCode = 400;
          throw error;
        }

        return date;
      };

      const filter = {};
      let parsedStartDate = null;
      let parsedEndDate = null;

      if (startDate !== undefined) {
        parsedStartDate = parseDate(startDate, "startDate");
      }

      if (endDate !== undefined) {
        parsedEndDate = parseDate(endDate, "endDate");
      }

      if (
        parsedStartDate &&
        parsedEndDate &&
        parsedStartDate > parsedEndDate
      ) {
        return res.status(400).json({
          message: "startDate cannot be later than endDate.",
        });
      }

      // 3. Apply date filter
      const createdAtFilter = {};

      if (parsedStartDate) {
        createdAtFilter.$gte = parsedStartDate;
      }

      if (parsedEndDate) {
        const exclusiveEndDate = new Date(parsedEndDate);
        exclusiveEndDate.setUTCDate(
          exclusiveEndDate.getUTCDate() + 1
        );

        createdAtFilter.$lt = exclusiveEndDate;
      }

      if (Object.keys(createdAtFilter).length > 0) {
        filter.createdAt = createdAtFilter;
      }

      // 4. Apply event type filter
      if (eventType !== "all") {
        filter.eventType = eventType;
      }

      // 5. Apply safe text search
      if (typeof search !== "string" || search.length > 100) {
        return res.status(400).json({
          message: "Search must be a string of at most 100 characters.",
        });
      }

      const searchTerm = search.trim();

      if (searchTerm) {
        // Escape regex metacharacters so search input is treated literally.
        const escapedSearch = searchTerm.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        const searchRegex = new RegExp(escapedSearch, "i");

        filter.$or = [
          { actorName: searchRegex },
          { actorEmail: searchRegex },
          { actorRole: searchRegex },
          { targetEmail: searchRegex },
          { description: searchRegex },
          { eventType: searchRegex },
        ];
      }

      // 6. Set CSV headers
      const filename = `NoteHub_Security_Activity_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Cache-Control", "no-store");

      // UTF-8 BOM helps Microsoft Excel display characters correctly.
      res.write("\uFEFF");

      const escapeCSV = (value) => {
        let text = value == null ? "" : String(value);

        // Prevent spreadsheet formula injection.
        if (/^[\s]*[=+\-@\t\r]/.test(text)) {
          text = `'${text}`;
        }

        return `"${text.replace(/"/g, '""')}"`;
      };

      const headers = [
        "Event Type",
        "Actor",
        "Email",
        "Role",
        "Description",
        "Target",
        "Date & Time",
      ];

      res.write(headers.map(escapeCSV).join(",") + "\r\n");

      // 7. Stream all matching records without a 100-record limit.
      const cursor = SecurityLog.find(filter)
        .select(
          "eventType actorName actorEmail actorRole targetEmail description createdAt"
        )
        .sort({ createdAt: -1, _id: -1 })
        .lean()
        .cursor();

      for await (const log of cursor) {
        const row = [
          log.eventType || "Unknown",
          log.actorName || log.actorEmail || "Unknown actor",
          log.actorEmail || "",
          log.actorRole || "",
          log.description || "",
          log.targetEmail || "",
          log.createdAt
            ? new Date(log.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "UTC",
              })
            : "",
        ];

        if (!res.write(row.map(escapeCSV).join(",") + "\r\n")) {
          await new Promise((resolve) => res.once("drain", resolve));
        }
      }

      await cursor.close();
      res.end();
    } catch (error) {
      console.error("Security activity CSV export error:", error);

      if (res.headersSent) {
        return res.destroy(error);
      }

      if (error.statusCode === 400) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to export security activity.",
      });
    }
  }
);

// ==========================================
// ADMIN PLATFORM SETTINGS — SUPERADMIN ONLY
// ==========================================

// GET PLATFORM SETTINGS
app.get(
  "/api/admin/settings",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      let settings = await PlatformSettings.findOne();

      // Create default settings if none exist
      if (!settings) {
        settings = await PlatformSettings.create({
          platformName: "NoteHub",
          platformDescription:
            "Your learning resources, all in one place.",
          registrationEnabled: true,
          maintenanceMode: false,
          updatedBy: req.user.id,
        });
      }

      return res.status(200).json({
        message: "Platform settings fetched successfully ✅",
        settings: {
          platformName: settings.platformName,
          platformDescription: settings.platformDescription,
          registrationEnabled: settings.registrationEnabled,
          maintenanceMode: settings.maintenanceMode,
          updatedAt: settings.updatedAt,
        },
      });
    } catch (error) {
      console.error("Fetch platform settings error:", error);

      return res.status(500).json({
        message: "Failed to fetch platform settings ❌",
      });
    }
  }
);

// UPDATE PLATFORM SETTINGS
app.put(
  "/api/admin/settings",
  authenticateToken,
  authorizeRoles("superadmin"),
  async (req, res) => {
    try {
      const {
        platformName,
        platformDescription,
        registrationEnabled,
        maintenanceMode,
      } = req.body;

      const updates = {};

      // Validate platform name
      if (platformName !== undefined) {
        if (
          typeof platformName !== "string" ||
          platformName.trim().length < 2 ||
          platformName.trim().length > 100
        ) {
          return res.status(400).json({
            message:
              "Platform name must contain 2–100 characters ❌",
          });
        }

        updates.platformName = platformName.trim();
      }

      // Validate platform description
      if (platformDescription !== undefined) {
        if (
          typeof platformDescription !== "string" ||
          platformDescription.trim().length > 500
        ) {
          return res.status(400).json({
            message:
              "Description must contain at most 500 characters ❌",
          });
        }

        updates.platformDescription =
          platformDescription.trim();
      }

      // Validate registration toggle
      if (registrationEnabled !== undefined) {
        if (typeof registrationEnabled !== "boolean") {
          return res.status(400).json({
            message:
              "Registration setting must be true or false ❌",
          });
        }

        updates.registrationEnabled = registrationEnabled;
      }

      // Validate maintenance toggle
      if (maintenanceMode !== undefined) {
        if (typeof maintenanceMode !== "boolean") {
          return res.status(400).json({
            message:
              "Maintenance setting must be true or false ❌",
          });
        }

        updates.maintenanceMode = maintenanceMode;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          message: "No valid settings provided ❌",
        });
      }

      updates.updatedBy = req.user.id;

      const settings = await PlatformSettings.findOneAndUpdate(
        {},
        { $set: updates },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      return res.status(200).json({
        message: "Platform settings updated successfully ✅",
        settings: {
          platformName: settings.platformName,
          platformDescription: settings.platformDescription,
          registrationEnabled: settings.registrationEnabled,
          maintenanceMode: settings.maintenanceMode,
          updatedAt: settings.updatedAt,
        },
      });
    } catch (error) {
      console.error("Update platform settings error:", error);

      return res.status(500).json({
        message: "Failed to update platform settings ❌",
      });
    }
  }
);

// ADMIN VERIFICATION

app.get(
  "/api/admin/verify",
  authenticateToken,
  authorizeRoles("superadmin"),
  (req, res) => {
    return res.json({
      message: "Super Admin access verified successfully 👑",
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);


// ROOT ROUTE

app.get("/", (req, res) => {
  res.send("NoteHub Backend is Running 🚀");
});

// HEALTH CHECK

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    message: "NoteHub backend is running 🚀",
  });
});

/* ==========================================
   PUBLIC MAINTENANCE STATUS
========================================== */

app.get("/api/maintenance-status", async (req, res) => {
  try {
    const settings = await PlatformSettings.findOne()
      .select("maintenanceMode")
      .lean();

    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      maintenanceMode: Boolean(settings?.maintenanceMode),
    });
  } catch (error) {
    console.error("Maintenance status check failed:", error);

    return res.status(503).json({
      message: "Unable to check maintenance status.",
    });
  }
});

// START SERVER

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = {
  app,
  authenticateToken,
  authorizeRoles,
};