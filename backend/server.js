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


// ======================================================
// JWT AUTHENTICATION MIDDLEWARE
// ======================================================

const authenticateToken = (req, res, next) => {

  const authHeader =
    req.headers["authorization"];

  const token =
    authHeader &&
    authHeader.split(" ")[1];


  if (!token) {

    return res.status(401).json({
      message:
        "Access denied. Token required ❌"
    });

  }


  try {

    const user =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = user;

    next();

  } catch (error) {

    return res.status(403).json({
      message:
        "Invalid or expired token ❌"
    });

  }

};


// ======================================================
// MONGODB CONNECTION
// ======================================================

mongoose
  .connect(
    process.env.MONGODB_URI
  )
  .then(() => {

    console.log(
      "MongoDB connected successfully 🥳"
    );

  })
  .catch((error) => {

    console.error(
      "MongoDB connection error:",
      error
    );

  });


// ======================================================
// REGISTER API
// ======================================================

app.post(
  "/api/register",
  async (req, res) => {

    try {

      const {
        name,
        email,
        password
      } = req.body;


      const existingUser =
        await User.findOne({
          email
        });


      if (existingUser) {

        return res.status(400).json({
          message:
            "User already exists ❌"
        });

      }


      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      const newUser =
        new User({
          name,
          email,
          password:
            hashedPassword
        });


      const savedUser =
        await newUser.save();


      res.status(201).json({

        message:
          "User registered successfully 🚀",

        user: {
          id:
            savedUser._id,

          name:
            savedUser.name,

          email:
            savedUser.email
        }

      });

    } catch (error) {

      console.error(
        "Error registering user:",
        error
      );

      res.status(500).json({
        message:
          "Failed to register user ❌"
      });

    }

  }
);


// ======================================================
// LOGIN API
// ======================================================

app.post(
  "/api/login",
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;


      const user =
        await User.findOne({
          email
        });


      if (!user) {

        return res.status(401).json({
          message:
            "Invalid email or password!"
        });

      }


      const isPasswordCorrect =
        await bcrypt.compare(
          password,
          user.password
        );


      if (!isPasswordCorrect) {

        return res.status(401).json({
          message:
            "Invalid email or password!"
        });

      }


      const token =
        jwt.sign(

          {
            id:
              user._id,

            email:
              user.email
          },

          JWT_SECRET,

          {
            expiresIn:
              "1d"
          }

        );


      res.json({

        message:
          "Login successful! 🚀",

        token,

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email
        }

      });

    } catch (error) {

      console.error(
        "Error logging in:",
        error
      );

      res.status(500).json({
        message:
          "Login failed ❌"
      });

    }

  }
);


// ======================================================
// GET CURRENT USER PROFILE
// JWT PROTECTED
// ======================================================

app.get(
  "/api/profile",
  authenticateToken,
  async (req, res) => {

    try {

      const user =
        await User.findById(
          req.user.id
        ).select(
          "-password"
        );


      if (!user) {

        return res.status(404).json({
          message:
            "User not found ❌"
        });

      }


      res.json({

        user: {

          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          createdAt:
            user.createdAt

        }

      });

    } catch (error) {

      console.error(
        "Error fetching profile:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch profile ❌"
      });

    }

  }
);


// ======================================================
// UPDATE CURRENT USER PROFILE
// JWT PROTECTED
// ======================================================

app.put(
  "/api/profile",
  authenticateToken,
  async (req, res) => {

    try {

      const {
        name
      } = req.body;


      // --------------------------------------------------
      // Validate name
      // --------------------------------------------------

      if (
        !name ||
        !name.trim()
      ) {

        return res.status(400).json({
          message:
            "Name is required ❌"
        });

      }


      const cleanName =
        name.trim();


      if (
        cleanName.length < 2
      ) {

        return res.status(400).json({
          message:
            "Name must contain at least 2 characters ❌"
        });

      }


      if (
        cleanName.length > 50
      ) {

        return res.status(400).json({
          message:
            "Name cannot exceed 50 characters ❌"
        });

      }


      // --------------------------------------------------
      // Find logged-in user
      // --------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        );


      if (!user) {

        return res.status(404).json({
          message:
            "User not found ❌"
        });

      }


      // --------------------------------------------------
      // Update name
      // --------------------------------------------------

      user.name =
        cleanName;


      const updatedUser =
        await user.save();


      res.json({

        message:
          "Profile updated successfully ✅",

        user: {

          id:
            updatedUser._id,

          name:
            updatedUser.name,

          email:
            updatedUser.email,

          createdAt:
            updatedUser.createdAt

        }

      });

    } catch (error) {

      console.error(
        "Error updating profile:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update profile ❌"
      });

    }

  }
);


// ======================================================
// CREATE NOTE API
// JWT PROTECTED
// ======================================================
//
// Supports:
// - Title
// - Stream
// - Semester
// - Subject
// - Tags
// - Content
// - File
// ======================================================

app.post(
  "/api/notes",
  authenticateToken,
  async (req, res) => {

    try {

      const {
        title,
        stream,
        semester,
        subject,
        tags,
        content,
        fileName,
        fileData
      } = req.body;


      // --------------------------------------------------
      // Find verified user
      // --------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        );


      if (!user) {

        return res.status(401).json({
          message:
            "User not found ❌"
        });

      }


      // --------------------------------------------------
      // Basic validation
      // --------------------------------------------------

      if (
        !title ||
        !title.trim()
      ) {

        return res.status(400).json({
          message:
            "Note title is required ❌"
        });

      }


      if (
        !stream ||
        !stream.trim()
      ) {

        return res.status(400).json({
          message:
            "Stream is required ❌"
        });

      }


      if (
        !semester ||
        !semester.trim()
      ) {

        return res.status(400).json({
          message:
            "Semester is required ❌"
        });

      }


      if (
        !subject ||
        !subject.trim()
      ) {

        return res.status(400).json({
          message:
            "Subject is required ❌"
        });

      }


      if (
        !content ||
        !content.trim()
      ) {

        return res.status(400).json({
          message:
            "Note content is required ❌"
        });

      }


      // --------------------------------------------------
      // Clean tags
      // --------------------------------------------------

      const cleanTags =
        Array.isArray(tags)

          ? tags
              .map((tag) =>
                String(tag).trim()
              )
              .filter(
                (tag) =>
                  tag.length > 0
              )

          : [];


      // --------------------------------------------------
      // Create new note
      // --------------------------------------------------

      const newNote =
        new Note({

          title:
            title.trim(),

          stream:
            stream.trim(),

          semester:
            semester.trim(),

          subject:
            subject.trim(),

          tags:
            cleanTags,

          content:
            content.trim(),

          fileName,

          fileData,

          // Owner comes from
          // verified JWT user
          ownerEmail:
            user.email,

          ownerName:
            user.name

        });


      // --------------------------------------------------
      // Save note
      // --------------------------------------------------

      const savedNote =
        await newNote.save();


      res.status(201).json({

        message:
          "Note created successfully 🚀",

        note:
          savedNote

      });

    } catch (error) {

      console.error(
        "Error creating note:",
        error
      );

      res.status(500).json({
        message:
          "Failed to create note ❌"
      });

    }

  }
);


// ======================================================
// GET ALL NOTES
// ======================================================
//
// NOTES PAGE FEATURES:
//
// 1. Advanced Search
// 2. Stream Filter
// 3. Semester Filter
// 4. Subject Filter
// 5. Tag Filter
// 6. Sorting
//
// fileData is excluded from listing response
// for better performance.
// ======================================================

app.get(
  "/api/notes",
  async (req, res) => {

    try {

      const {
        search,
        stream,
        semester,
        subject,
        tag,
        sort
      } = req.query;


      // --------------------------------------------------
      // MongoDB filter
      // --------------------------------------------------

      const filter = {};


      // --------------------------------------------------
      // ADVANCED SEARCH
      // --------------------------------------------------
      //
      // Search across:
      // - Title
      // - Subject
      // - Content
      // - Owner name
      // - Stream
      // - Semester
      // --------------------------------------------------

      if (
        search &&
        search.trim()
      ) {

        const searchRegex =
          new RegExp(
            search.trim(),
            "i"
          );


        filter.$or = [

          {
            title:
              searchRegex
          },

          {
            subject:
              searchRegex
          },

          {
            content:
              searchRegex
          },

          {
            ownerName:
              searchRegex
          },

          {
            stream:
              searchRegex
          },

          {
            semester:
              searchRegex
          }

        ];

      }


      // --------------------------------------------------
      // STREAM FILTER
      // --------------------------------------------------

      if (
        stream &&
        stream.trim()
      ) {

        filter.stream =
          stream.trim();

      }


      // --------------------------------------------------
      // SEMESTER FILTER
      // --------------------------------------------------

      if (
        semester &&
        semester.trim()
      ) {

        filter.semester =
          semester.trim();

      }


      // --------------------------------------------------
      // SUBJECT FILTER
      // --------------------------------------------------

      if (
        subject &&
        subject.trim()
      ) {

        filter.subject =
          subject.trim();

      }


      // --------------------------------------------------
      // TAG FILTER
      // --------------------------------------------------

      if (
        tag &&
        tag.trim()
      ) {

        filter.tags = {

          $in: [
            tag.trim()
          ]

        };

      }


      // --------------------------------------------------
      // SORTING
      // --------------------------------------------------
      //
      // Supported values:
      //
      // newest
      // oldest
      // title-asc
      // title-desc
      // --------------------------------------------------

      let sortOption = {
        createdAt: -1
      };


      if (
        sort === "oldest"
      ) {

        sortOption = {
          createdAt: 1
        };

      } else if (
        sort === "title-asc"
      ) {

        sortOption = {
          title: 1
        };

      } else if (
        sort === "title-desc"
      ) {

        sortOption = {
          title: -1
        };

      }


      // --------------------------------------------------
      // Fetch notes
      // --------------------------------------------------

      const notes =
        await Note.find(
          filter
        )
          .select(
            "-fileData"
          )
          .sort(
            sortOption
          )
          .lean();


      // --------------------------------------------------
      // Send response
      // --------------------------------------------------

      res.json(
        notes
      );

    } catch (error) {

      console.error(
        "Error fetching notes:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch notes ❌"
      });

    }

  }
);


// ======================================================
// GET SINGLE NOTE
// ======================================================

app.get(
  "/api/notes/:id",
  async (req, res) => {

    try {

      const note =
        await Note.findById(
          req.params.id
        );


      if (!note) {

        return res.status(404).json({
          message:
            "Note not found ❌"
        });

      }


      res.json(
        note
      );

    } catch (error) {

      console.error(
        "Error fetching note:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch note ❌"
      });

    }

  }
);


// ======================================================
// UPDATE NOTE
// ======================================================
//
// JWT + OWNER PROTECTED
//
// Supports:
// - Title
// - Stream
// - Semester
// - Subject
// - Tags
// - Content
// - File
// ======================================================

app.put(
  "/api/notes/:id",
  authenticateToken,
  async (req, res) => {

    try {

      const note =
        await Note.findById(
          req.params.id
        );


      if (!note) {

        return res.status(404).json({
          message:
            "Note not found ❌"
        });

      }


      // --------------------------------------------------
      // Check ownership
      // --------------------------------------------------

      if (
        note.ownerEmail !==
        req.user.email
      ) {

        return res.status(403).json({
          message:
            "You can only edit your own notes ❌"
        });

      }


      // --------------------------------------------------
      // Prepare tags
      // --------------------------------------------------

      const cleanTags =
        Array.isArray(
          req.body.tags
        )

          ? req.body.tags
              .map((tag) =>
                String(tag).trim()
              )
              .filter(
                (tag) =>
                  tag.length > 0
              )

          : [];


      // --------------------------------------------------
      // Prepare updated note
      // --------------------------------------------------

      const updatedNote =
        await Note.findByIdAndUpdate(

          req.params.id,

          {

            title:
              req.body.title,

            stream:
              req.body.stream,

            semester:
              req.body.semester,

            subject:
              req.body.subject,

            tags:
              cleanTags,

            content:
              req.body.content,

            fileName:
              req.body.fileName,

            fileData:
              req.body.fileData

          },

          {
            new: true,
            runValidators: true
          }

        );


      res.json({

        message:
          "Note updated successfully ✏️",

        note:
          updatedNote

      });

    } catch (error) {

      console.error(
        "Error updating note:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update note ❌"
      });

    }

  }
);


// ======================================================
// DELETE NOTE
// ======================================================
//
// JWT + OWNER PROTECTED
// ======================================================

app.delete(
  "/api/notes/:id",
  authenticateToken,
  async (req, res) => {

    try {

      const note =
        await Note.findById(
          req.params.id
        );


      if (!note) {

        return res.status(404).json({
          message:
            "Note not found ❌"
        });

      }


      // --------------------------------------------------
      // Check ownership
      // --------------------------------------------------

      if (
        note.ownerEmail !==
        req.user.email
      ) {

        return res.status(403).json({
          message:
            "You can only delete your own notes ❌"
        });

      }


      // --------------------------------------------------
      // Delete note
      // --------------------------------------------------

      const deletedNote =
        await Note.findByIdAndDelete(
          req.params.id
        );


      res.json({

        message:
          "Note deleted successfully 🗑️",

        note:
          deletedNote

      });

    } catch (error) {

      console.error(
        "Error deleting note:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete note ❌"
      });

    }

  }
);


// ======================================================
// TEST API
// ======================================================

app.post(
  "/api/test",
  (req, res) => {

    console.log(
      req.body
    );


    res.json({

      message:
        "Data received successfully 🚀",

      data:
        req.body

    });

  }
);


// ======================================================
// ROOT ROUTE
// ======================================================

app.get(
  "/",
  (req, res) => {

    res.send(
      "NoteHub Backend is Running 🚀"
    );

  }
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);