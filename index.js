// index.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const DatabaseModule = require("@replit/database");
const Database = DatabaseModule.default || DatabaseModule; // works with v2
const app = express();
const db = new Database();

const PORT = process.env.PORT || 4000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Helpers
const newId = () => Math.random().toString(36).slice(2, 10);
const getLocalTime = (d = new Date()) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Routes
app.get("/", async (req, res) => {
  const events = (await db.get("events")) || [];
  const users = (await db.get("users")) || {};
  
  // Render login and main page
  res.send(`
    <h1>TrackIt App</h1>

    <h2>Login / User</h2>
    <form method="POST" action="/login">
      <input name="username" placeholder="Username" required />
      <button type="submit">Login</button>
    </form>

    <h2>Quick Event Buttons</h2>
    <form method="POST" action="/add">
      <button name="label" value="Bed">Bed</button>
      <button name="label" value="Up">Up</button>
      <button name="label" value="Gym">Gym</button>
      <input name="customLabel" placeholder="Custom event" />
      <button type="submit" name="timeType" value="auto">Add Custom</button>
    </form>

    <h2>Add Manual Event (pick time)</h2>
    <form method="POST" action="/add">
      <input name="label" placeholder="Event label" required />
      <input type="time" name="manualTime" />
      <button type="submit" name="timeType" value="manual">Add Past Time</button>
      <button type="submit" name="timeType" value="auto">Add Now</button>
    </form>

    <h2>My Events</h2>
    <table border="1">
      <tr><th>Time</th><th>Event</th></tr>
      ${events
        .map((e) => `<tr><td>${getLocalTime(e.time)}</td><td>${e.label}</td></tr>`)
        .join("")}
    </table>
  `);
});

// Login
app.post("/login", async (req, res) => {
  const username = req.body.username;
  const users = (await db.get("users")) || {};
  if (!users[username]) users[username] = { id: newId() };
  await db.set("users", users);
  res.redirect("/");
});

// Add event
app.post("/add", async (req, res) => {
  let label = req.body.label || req.body.customLabel;
  if (!label) return res.redirect("/");

  let time;
  if (req.body.timeType === "manual" && req.body.manualTime) {
    const today = new Date();
    const [hours, minutes] = req.body.manualTime.split(":");
    time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
  } else {
    time = new Date();
  }

  const event = { id: newId(), label, time };
  const events = (await db.get("events")) || [];
  events.push(event);
  await db.set("events", events);

  res.redirect("/");
});

// Delete event (optional, admin testing)
app.post("/delete", async (req, res) => {
  const id = req.body.id;
  if (!id) return res.redirect("/");

  let events = (await db.get("events")) || [];
  events = events.filter((e) => e.id !== id);
  await db.set("events", events);

  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
