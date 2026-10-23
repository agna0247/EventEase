
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useParams,
  useNavigate
} from "react-router-dom";
import "./App.css";

const API = "http://localhost:5000/api/events";

const categories = [
  "Technology",
  "Music",
  "Education",
  "Business",
  "Sports",
  "Arts & Culture",
  "Other"
];

const emptyForm = {
  title: "",
  category: "Technology",
  date: "",
  location: "",
  description: ""
};

async function getData(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid server response. Check your backend.");
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark event-navbar">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          EventEase
        </Link>

        <div className="d-flex gap-3 align-items-center">
          <Link className="nav-link text-white" to="/">
            Home
          </Link>
          <Link className="nav-link text-white" to="/registrations">
            My Registrations
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Home() {
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("date");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadEvents() {
    setLoading(true);

    try {
      const response = await fetch(API);
      const data = await getData(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not load events.");
      }

      if (!Array.isArray(data)) {
        throw new Error("The events API did not return a list.");
      }

      setEvents(data);
      setMessage("");

      const results = await Promise.all(
        data.map(async (event) => {
          try {
            const res = await fetch(
              `${API}/${event._id}/registration-count`
            );

            if (!res.ok) return [event._id, 0];

            const result = await getData(res);

            return [
              event._id,
              result.count ?? result.registrationCount ?? 0
            ];
          } catch {
            return [event._id, 0];
          }
        })
      );

      setCounts(Object.fromEntries(results));
    } catch (error) {
      setMessage(error.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function addEvent(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await getData(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not add event.");
      }

      setForm(emptyForm);
      setShowForm(false);
      setMessage("Event added successfully!");
      await loadEvents();
    } catch (error) {
      setMessage(error.message || "Could not add event.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = events
    .filter((event) => {
      const term = search.trim().toLowerCase();

      const matchesSearch =
        (event.title || "").toLowerCase().includes(term) ||
        (event.location || "").toLowerCase().includes(term) ||
        (event.description || "").toLowerCase().includes(term);

      const matchesCategory =
        category === "All" || event.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }

      if (sort === "popular") {
        return (counts[b._id] || 0) - (counts[a._id] || 0);
      }

      return new Date(a.date) - new Date(b.date);
    });

  return (
    <>
      <header className="hero-section" id="home">
        <div className="container">
          <p className="hero-label">DISCOVER • CONNECT • CELEBRATE</p>
          <h1>
            Find your next
            <br />
            unforgettable experience.
          </h1>
          <p className="hero-description">
            Discover events, meet people, and make every moment count.
          </p>
          <a href="#events" className="btn explore-btn">
            Explore Events
          </a>
        </div>
      </header>

      <main className="container py-5" id="events">
        {message && (
          <div className="alert alert-info" role="status">
            {message}
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <p className="section-label">WHAT'S HAPPENING</p>
            <h2 className="section-title mb-0">Upcoming Events</h2>
          </div>

          <button
            className="btn submit-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Close Form" : "+ Add Event"}
          </button>
        </div>

        {showForm && (
          <section className="event-form-section mb-5">
            <h3 className="section-title">Create an Event</h3>

            <form onSubmit={addEvent}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Event Title</label>
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Date and Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Location</label>
                  <input
                    className="form-control"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-12">
                  <button className="btn submit-btn" disabled={saving}>
                    {saving ? "Saving..." : "Save Event"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="popular">Most Registrations</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading events...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state text-center">
            <h4>No matching events</h4>
            <p>Try changing your search or category.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map((event) => (
              <div className="col-md-6 col-lg-4" key={event._id}>
                <article className="event-card h-100">
                  <div className="event-card-top">
                    <span className="category-tag">{event.category}</span>
                    <span className="calendar-day">
                      {formatDate(event.date)}
                    </span>
                  </div>

                  <div className="event-card-body">
                    <h3>{event.title}</h3>
                    <p className="event-location">{event.location}</p>
                    <p className="event-description">
                      {event.description}
                    </p>

                    <p className="text-muted">
                      {counts[event._id] ?? 0} registered
                    </p>

                    <div className="event-card-footer">
                      <span>{formatTime(event.date)}</span>
                      <span className="event-status">
                        {new Date(event.date) >= new Date()
                          ? "Upcoming"
                          : "Past Event"}
                      </span>
                    </div>

                    <Link
                      className="btn submit-btn w-100 mt-3"
                      to={`/events/${event._id}`}
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [count, setCount] = useState(0);
  const [form, setForm] = useState({ name: "", email: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);

      try {
        const response = await fetch(`${API}/${id}`);
        const data = await getData(response);

        if (!response.ok) {
          throw new Error(data.message || "Event not found.");
        }

        setEvent(data);

        const countResponse = await fetch(
          `${API}/${id}/registration-count`
        );

        if (countResponse.ok) {
          const countData = await getData(countResponse);
          setCount(
            countData.count ?? countData.registrationCount ?? 0
          );
        }
      } catch (error) {
        setMessage(error.message || "Could not load event.");
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  async function register(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/${id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await getData(response);

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      setCount((previous) => previous + 1);
      setMessage(
        "Registration successful! You can view your registrations using your email."
      );
      setForm({ name: "", email: "" });
    } catch (error) {
      setMessage(error.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="container py-5">Loading event...</main>;
  }

  if (!event) {
    return (
      <main className="container py-5">
        <div className="alert alert-warning">
          {message || "Event not found."}
        </div>
        <Link to="/" className="btn submit-btn">Back to Home</Link>
      </main>
    );
  }

  const isUpcoming = new Date(event.date) >= new Date();

  return (
    <main className="container py-5">
      <button
        className="btn btn-outline-secondary mb-4"
        onClick={() => navigate("/")}
      >
        ← Back to Events
      </button>

      <section className="event-form-section">
        <span className="category-tag">{event.category}</span>
        <h1 className="section-title mt-3">{event.title}</h1>

        <p className="event-location">{event.location}</p>
        <p><strong>Date:</strong> {formatDate(event.date)}</p>
        <p><strong>Time:</strong> {formatTime(event.date)}</p>
        <p>{event.description}</p>
        <p><strong>Registrations:</strong> {count}</p>

        {message && (
          <div className="alert alert-info" role="status">
            {message}
          </div>
        )}

        {isUpcoming ? (
          <>
            <h3 className="mt-4">Register for this Event</h3>

            <form onSubmit={register}>
              <div className="mb-3">
                <label className="form-label">Your Name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                />
              </div>

              <button
                className="btn submit-btn"
                disabled={submitting}
              >
                {submitting ? "Registering..." : "Confirm Registration"}
              </button>
            </form>
          </>
        ) : (
          <p className="text-muted">Registration for this event has closed.</p>
        )}

        <p className="mt-3">
          <Link to="/registrations">View My Registrations</Link>
        </p>
      </section>
    </main>
  );
}

function MyRegistrations() {
  const [email, setEmail] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function searchRegistrations(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSearched(true);
    setRegistrations([]);

    try {
      const response = await fetch(
        `http://localhost:5000/api/registrations?email=${encodeURIComponent(email.trim())}`
      );

      const data = await getData(response);

      if (!response.ok) {
        throw new Error(data.message || "Could not find registrations.");
      }

      setRegistrations(data);

      if (data.length === 0) {
        setMessage("No registrations found for this email.");
      }
    } catch (error) {
      setMessage(
        error.message ||
        "Could not load registrations. Check the backend API."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-5">
      <section className="event-form-section">
        <p className="section-label">YOUR EVENTS</p>
        <h1 className="section-title">My Registrations</h1>

        <p className="text-muted">
          Enter the email address you used when registering for an event.
        </p>

        <form onSubmit={searchRegistrations}>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <button className="btn submit-btn" disabled={loading}>
            {loading ? "Searching..." : "Find Registrations"}
          </button>
        </form>
      </section>

      {message && (
        <div className="alert alert-info mt-4" role="status">
          {message}
        </div>
      )}

      {searched && registrations.length > 0 && (
        <section className="mt-5">
          <h2 className="section-title mb-4">Your Registered Events</h2>

          <div className="row g-4">
            {registrations.map((registration) => {
              const event = registration.eventId;

              if (!event) return null;

              return (
                <div className="col-md-6 col-lg-4" key={registration._id}>
                  <article className="event-card h-100">
                    <div className="event-card-body">
                      <span className="category-tag">
                        {event.category}
                      </span>

                      <h3 className="mt-3">{event.title}</h3>
                      <p className="event-location">{event.location}</p>
                      <p><strong>Date:</strong> {formatDate(event.date)}</p>
                      <p><strong>Name:</strong> {registration.name}</p>
                      <p><strong>Email:</strong> {registration.email}</p>
                      <p>
                        <strong>Registered on:</strong>{" "}
                        {formatDate(registration.registeredAt)}
                      </p>

                      <Link
                        to={`/events/${event._id}`}
                        className="btn submit-btn w-100"
                      >
                        View Event
                      </Link>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-4">
        <Link to="/" className="btn btn-outline-secondary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main className="container py-5 text-center">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="btn submit-btn">Go Home</Link>
    </main>
  );
}

function App() {
  return (
    <div className="event-app">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/registrations" element={<MyRegistrations />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <footer className="event-footer">
        <div className="container">
          <strong>EventEase</strong>
          <p className="mb-0">Discover experiences. Create memories.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
