
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const Event = require("./models/Event");
const Registration = require("./models/Registration");

const app = express();

app.use(cors());
app.use(express.json());

let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from environment variables");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
}

app.get("/", async (req, res) => {
  try {
    await connectDB();
    res.json({ message: "EventEase backend is running" });
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    await connectDB();
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error("Fetch events error:", error.message);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Fetch event error:", error.message);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    await connectDB();

    const { title, category, date, location, description } = req.body;

    if (!title || !category || !date || !location || !description) {
      return res.status(400).json({
        error: "Please provide title, category, date, location and description"
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
    console.error("Create event error:", error.message);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.post("/api/events/:id/register", async (req, res) => {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: "Name and email are required"
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const registration = await Registration.create({
      eventId: event._id,
      name,
      email
    });

    res.status(201).json({
      message: "Registration successful",
      registration
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ error: "Failed to register for event" });
  }
});

app.get("/api/events/:id/registration-count", async (req, res) => {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const count = await Registration.countDocuments({
      eventId: req.params.id
    });

    res.json({ count });
  } catch (error) {
    console.error("Registration count error:", error.message);
    res.status(500).json({ error: "Failed to get registration count" });
  }
});

app.get("/api/registrations", async (req, res) => {
  try {
    await connectDB();

    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const registrations = await Registration.find({
      email: new RegExp(
        "^" + email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
        "i"
      )
    }).populate("eventId");

    res.json(registrations);
  } catch (error) {
    console.error("Fetch registrations error:", error.message);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// Local development only
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      console.log("MongoDB connected successfully");

      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
}

module.exports = app;
