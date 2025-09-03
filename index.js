// index.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const DatabaseModule = require("@replit/database");
const Database = DatabaseModule.default || DatabaseModule; // v2 safe

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
  let table = "<table border='1'><tr><th>Time</th><th>Event</th></tr>";
  events.forEach((e) => {
    table += `<tr><td>${getLocalTime(e.time)}</td><td>${e.label}</td></tr>`;
  });
  table += "</table>";

  res.send(`
    <h1>TrackIt App</h1>
    <div>Events Recorded:</div>
    ${table}
    <h2>Add Event</h2>
    <form method="POST" action="/add">
      <input name="label" placeholder="Event label" required />
      
      <!-- Auto / Current Time -->
      <button type="submit" name="timeType" value="auto">Add Now</button>
      
      <!-- Manual Past Time -->
      <input type="time" name="manualTime" />
      <button type="submit" name="timeType" value="manual">Add Past Time</button>
    </form>
  `);
});

app.post("/add", async (req, res) => {
  const label = req.body.label;
  let time;

  if (req.body.timeType === "manual" && req.body.manualTime) {
    const today = new Date();
    const [hours, minutes] = req.body.manualTime.split(":");
    time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
  } else {
    time = new Date(); // auto/current time
  }

  const event = { id: newId(), label, time };
  const events = (await db.get("events")) || [];
  events.push(event);
  await db.set("events", events);
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
