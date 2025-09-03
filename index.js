// index.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { Database } = require("@replit/database");

const app = express();
const db = new Database();

const PORT = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // For CSS/JS if needed

// Helpers
const newId = () => Math.random().toString(36).slice(2, 10);
const localTime = () => new Date().toLocaleString(); // Local date + time

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Add event (manual or auto)
app.post("/add-event", async (req, res) => {
  const { label, type, time: manualTime } = req.body;
  let time;

  if (type === "auto") {
    time = localTime(); // current local time
  } else {
    time = manualTime || localTime(); // manual time if filled, else current time
  }

  if (!label || !time) {
    return res.status(400).send("Missing label or time");
  }

  const events = (await db.get("events")) || [];
  events.push({ id: newId(), label, time });
  await db.set("events", events);

  res.redirect("/");
});

// Fetch events (for table)
app.get("/events", async (req, res) => {
  const events = (await db.get("events")) || [];
  let tableHTML = `
    <table border="1" cellpadding="5" cellspacing="0">
      <tr>
        <th>Event</th>
        <th>Time</th>
      </tr>
  `;

  events.forEach((e) => {
    tableHTML += `
      <tr>
        <td>${e.label}</td>
        <td>${e.time}</td>
      </tr>
    `;
  });

  tableHTML += "</table>";
  res.send(tableHTML);
});

// Clear all events (for testing)
app.post("/clear-events", async (req, res) => {
  await db.set("events", []);
  res.redirect("/");
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at port ${PORT}`);
});
