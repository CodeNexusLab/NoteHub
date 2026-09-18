require("dotenv").config();

const express = require("express");
const Note = require("./models/Note");
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET;

// ===============================
// JWT AUTHENTICATION MIDDLEWARE
// ===============================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Token required ❌"
    });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);

    req.user = user;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token ❌"
    });
  }
};

// ===============================
// MONGODB CONNECTION
// ===============================

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully 🥳");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// ===============================
// REGISTER API
// ===============================

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists ❌"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User registered successfully 🚀",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email
      }
    });

  } catch (error) {
    console.error("Error registering user:", error);

    res.status(500).json({
      message: "Failed to register user ❌"
    });
  }
});

// ===============================
// LOGIN API
// ===============================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password!"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password!"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      message: "Login successful! 🚀",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Error logging in:", error);

    res.status(500).json({
      message: "Login failed ❌"
    });
  }
});

// ===============================
// CREATE NOTE API
// JWT PROTECTED
// ===============================

app.post("/api/notes", authenticateToken, async (req, res) => {
  try {

    const {
      title,
      subject,
      content,
      fileName,
      fileData
    } = req.body;

    // Find the verified user from JWT
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found ❌"
      });
    }

    const newNote = new Note({
      title,
      subject,
      content,
      fileName,
      fileData,

      // Owner comes from verified backend user
      ownerEmail: user.email,
      ownerName: user.name
    });

    const savedNote = await newNote.save();

    res.status(201).json({
      message: "Note created successfully 🚀",
      note: savedNote
    });

  } catch (error) {
    console.error("Error creating note:", error);

    res.status(500).json({
      message: "Failed to create note ❌"
    });
  }
});

// ===============================
// GET ALL NOTES
// ===============================

app.get("/api/notes", async (req, res) => {
  try {
    const notes = await Note.find();

    res.json(notes);

  } catch (error) {
    console.error("Error fetching notes:", error);

    res.status(500).json({
      message: "Failed to fetch notes ❌"
    });
  }
});

// ===============================
// GET SINGLE NOTE
// ===============================

app.get("/api/notes/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found ❌"
      });
    }

    res.json(note);

  } catch (error) {
    console.error("Error fetching note:", error);

    res.status(500).json({
      message: "Failed to fetch note ❌"
    });
  }
});

// ===============================
// UPDATE NOTE
// ===============================

// UPDATE NOTE - JWT + OWNER PROTECTED
app.put("/api/notes/:id", authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found ❌"
      });
    }

    // Check note ownership
    if (note.ownerEmail !== req.user.email) {
      return res.status(403).json({
        message: "You can only edit your own notes ❌"
      });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        subject: req.body.subject,
        content: req.body.content,
        fileName: req.body.fileName,
        fileData: req.body.fileData
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      message: "Note updated successfully ✏️",
      note: updatedNote
    });

  } catch (error) {
    console.error("Error updating note:", error);

    res.status(500).json({
      message: "Failed to update note ❌"
    });
  }
});

// ===============================
// DELETE NOTE
// ===============================

// DELETE NOTE - JWT + OWNER PROTECTED
app.delete("/api/notes/:id", authenticateToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found ❌"
      });
    }

    // Check note ownership
    if (note.ownerEmail !== req.user.email) {
      return res.status(403).json({
        message: "You can only delete your own notes ❌"
      });
    }

    const deletedNote = await Note.findByIdAndDelete(req.params.id);

    res.json({
      message: "Note deleted successfully 🗑️",
      note: deletedNote
    });

  } catch (error) {
    console.error("Error deleting note:", error);

    res.status(500).json({
      message: "Failed to delete note ❌"
    });
  }
});

// ===============================
// TEST API
// ===============================

app.post("/api/test", (req, res) => {
  console.log(req.body);

  res.json({
    message: "Data received successfully 🚀",
    data: req.body
  });
});

// ===============================
// ROOT ROUTE
// ===============================

app.get("/", (req, res) => {
  res.send("NoteHub Backend is Running 🚀");
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});