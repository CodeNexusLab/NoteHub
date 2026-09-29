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
//
// - Title
// - Course
// - Stream
// - Semester
// - Subject
// - Resource Type
// - Tags
// - Content
// - File
//
// Resource Types:
//
// note
// previous-paper
// other
// ======================================================

app.post(
  "/api/notes",
  authenticateToken,
  async (req, res) => {

    try {

      const {
        title,
        course,
        stream,
        semester,
        subject,
        resourceType,
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


      // --------------------------------------------------
      // COURSE
      // --------------------------------------------------

      if (
        !course ||
        !course.trim()
      ) {

        return res.status(400).json({
          message:
            "Course is required ❌"
        });

      }


      // --------------------------------------------------
      // STREAM
      // --------------------------------------------------

      if (
        !stream ||
        !stream.trim()
      ) {

        return res.status(400).json({
          message:
            "Stream is required ❌"
        });

      }


      // --------------------------------------------------
      // SEMESTER
      // --------------------------------------------------

      if (
        !semester ||
        !semester.trim()
      ) {

        return res.status(400).json({
          message:
            "Semester is required ❌"
        });

      }


      // --------------------------------------------------
      // SUBJECT
      // --------------------------------------------------

      if (
        !subject ||
        !subject.trim()
      ) {

        return res.status(400).json({
          message:
            "Subject is required ❌"
        });

      }


      // --------------------------------------------------
      // CONTENT
      // --------------------------------------------------

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
      // RESOURCE TYPE
      // --------------------------------------------------

      const allowedResourceTypes = [
        "note",
        "previous-paper",
        "other",
      ];


      const cleanResourceType =
        resourceType &&
        allowedResourceTypes.includes(
          resourceType
        )
          ? resourceType
          : "note";


      // --------------------------------------------------
      // CLEAN TAGS
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
      // CREATE NEW NOTE
      // --------------------------------------------------

      const newNote =
        new Note({

          title:
            title.trim(),

          course:
            course.trim(),

          stream:
            stream.trim(),

          semester:
            semester.trim(),

          subject:
            subject.trim(),

          resourceType:
            cleanResourceType,

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
      // SAVE NOTE
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
// Supports:
//
// 1. Advanced Search
// 2. Course Filter
// 3. Stream Filter
// 4. Semester Filter
// 5. Subject Filter
// 6. Resource Type Filter
// 7. Tag Filter
// 8. Sorting
//
// fileData is excluded from listing response.
// ======================================================

app.get(
  "/api/notes",
  async (req, res) => {

    try {

      const {
        search,
        course,
        stream,
        semester,
        subject,
        resourceType,
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
      //
      // - Title
      // - Subject
      // - Content
      // - Owner
      // - Course
      // - Stream
      // - Semester
      // - Tags
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
            course:
              searchRegex
          },

          {
            stream:
              searchRegex
          },

          {
            semester:
              searchRegex
          },

          {
            tags:
              searchRegex
          }

        ];

      }


      // --------------------------------------------------
      // COURSE FILTER
      // --------------------------------------------------

      if (
        course &&
        course.trim()
      ) {

        filter.course =
          course.trim();

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
      // RESOURCE TYPE FILTER
      // --------------------------------------------------

      if (
        resourceType &&
        resourceType.trim()
      ) {

        filter.resourceType =
          resourceType.trim();

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
      // Supported:
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
      // FETCH NOTES
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
      // SEND RESPONSE
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
//
// - Title
// - Course
// - Stream
// - Semester
// - Subject
// - Resource Type
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
      // CHECK OWNERSHIP
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
      // PREPARE TAGS
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
      // RESOURCE TYPE
      // --------------------------------------------------

      const allowedResourceTypes = [
        "note",
        "previous-paper",
        "other",
      ];


      const cleanResourceType =
        req.body.resourceType &&
        allowedResourceTypes.includes(
          req.body.resourceType
        )
          ? req.body.resourceType
          : "note";


      // --------------------------------------------------
      // PREPARE UPDATED NOTE
      // --------------------------------------------------

      const updatedNote =
        await Note.findByIdAndUpdate(

          req.params.id,

          {

            title:
              req.body.title,

            course:
              req.body.course,

            stream:
              req.body.stream,

            semester:
              req.body.semester,

            subject:
              req.body.subject,

            resourceType:
              cleanResourceType,

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
      // CHECK OWNERSHIP
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
      // DELETE NOTE
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