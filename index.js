const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

// -------- Replit DB or local fallback --------
let db;
if (process.env.REPLIT_DB_URL) {
  const Database = require("@replit/database");
  db = new Database();
} else {
  // local fallback using in-memory array
  db = {
    data: [],
    get: async (key) => db.data,
    set: async (key, value) => { db.data = value; },
  };
}

// -------- Middleware --------
app.use(express.json());
app.use(express.static("public"));

// -------- Routes --------

// Save an event
app.post("/api/event", async (req, res) => {
  const { label, type } = req.body;

  let value;
  if (type === "time") value = new Date().toLocaleTimeString();
  else if (type === "yesno") value = "Yes"; // default yes for simplicity

  const events = (await db.get("events")) || [];
  events.push({ label, type, value, timestamp: new Date().toISOString() });
  await db.set("events", events);

  res.json({ success: true, events });
});

// Get all events
app.get("/api/events", async (req, res) => {
  const events = (await db.get("events")) || [];
  res.json(events);
});

// Reset events (optional)
app.post("/api/reset", async (req, res) => {
  await db.set("events", []);
  res.json({ success: true });
});

// -------- Start server --------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
