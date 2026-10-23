
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Event = require("./models/event");
const Registration = require("./models/Registration");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("EventEase backend is running");
});

// Get all events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// Get one event
app.get("/api/events/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

// Add a new event
app.post("/api/events", async (req, res) => {
  try {
    const { title, category, date, location, description } = req.body;

    if (!title || !category || !date || !location || !description) {
      return res.status(400).json({
        message: "Please fill in all event fields"
      });
    }

    const event = await Event.create({
      title,
      category,
      date,
      location,
      description
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: "Failed to create event" });
  }
});

app.post("/api/events/:id/register", async (req, res) => {
  try {
    const { name, email } = req.body;
    const eventId = req.params.id;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        message: "Name and email are required"
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registration = await Registration.create({
      eventId,
      name: name.trim(),
      email: email.trim().toLowerCase()
    });

    res.status(201).json({
      message: "Registration successful!",
      registration
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

// Get the number of registrations for an event
app.get("/api/events/:id/registration-count", async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const count = await Registration.countDocuments({ eventId });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Failed to get registration count" });
  }
});

app.get("/api/registrations", async (req, res) => {
  try {
    const email = (req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email address is required."
      });
    }

    const registrations = await Registration.find({
      email: email
    })
      .populate("eventId")
      .sort({ registeredAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({
      message: "Could not retrieve registrations."
    });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error.message);
  });


