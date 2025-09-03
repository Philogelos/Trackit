const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Simple admin password (MVP demo only) ----
const ADMIN_PASS = process.env.ADMIN_PASS || "secret123";

// ---- DB: Replit DB in cloud, JSON file locally ----
let db;
if (process.env.REPLIT_DB_URL) {
  const Database = require("@replit/database");
  const repldb = new Database();
  db = {
    get: async (key) => (await repldb.get(key)) || (key === "events" ? [] : []),
    set: async (key, val) => repldb.set(key, val),
  };
  console.log("Using Replit DB");
} else {
  console.log("Using local JSON DB (localdb.json)");
  const DB_FILE = path.join(__dirname, "localdb.json");
  const readAll = () => {
    if (!fs.existsSync(DB_FILE)) return { users: [], events: [] };
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) || { users: [], events: [] };
    } catch {
      return { users: [], events: [] };
    }
  };
  const writeAll = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  db = {
    get: async (key) => {
      const all = readAll();
      return all[key] || [];
    },
    set: async (key, val) => {
      const all = readAll();
      all[key] = val;
      writeAll(all);
    },
  };
}

app.use(express.json());
app.use(express.static("public"));

// Helpers
const newId = () => Math.random().toString(36).slice(2, 10);
const iso = (d) => new Date(d).toISOString();

// ---- Auth (very simple username -> userId registry) ----
app.post("/api/login", async (req, res) => {
  const { username } = req.body;
  if (!username || !username.trim()) return res.status(400).json({ error: "username required" });

  const users = (await db.get("users")) || [];
  let user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    user = { username, userId: "u_" + newId() };
    users.push(user);
    await db.set("users", users);
  }
  res.json(user);
});

// ---- Create event ----
// body: { userId, label, type: "time"|"yesno", value?: "Yes"|"No", when?: ISO or datetime-local }
app.post("/api/event", async (req, res) => {
  const { userId, label, type, value, when } = req.body;
  if (!userId || !label || !type) return res.status(400).json({ error: "missing fields" });

  const timestamp = when ? iso(when) : new Date().toISOString();
  let val = value;
  if (type === "time" && !val) val = new Date(timestamp).toLocaleTimeString();
  if (type === "yesno" && !val) val = "Yes";

  const events = (await db.get("events")) || [];
  events.push({ userId, label, type, value: val, timestamp });
  await db.set("events", events);
  res.json({ success: true });
});

// ---- Get events for a user ----
app.get("/api/events/:userId", async (req, res) => {
  const { userId } = req.params;
  const events = (await db.get("events")) || [];
  const mine = events.filter((e) => e.userId === userId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  res.json(mine);
});

// ---- Delete single event (by userId + timestamp) ----
app.post("/api/event/delete", async (req, res) => {
  const { userId, timestamp } = req.body;
  if (!userId || !timestamp) return res.status(400).json({ error: "missing fields" });

  let events = (await db.get("events")) || [];
  const before = events.length;
  events = events.filter((e) => !(e.userId === userId && e.timestamp === timestamp));
  await db.set("events", events);
  res.json({ success: true, removed: before - events.length });
});

// ---- Reset all events for a user ----
app.post("/api/reset", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "missing userId" });

  let events = (await db.get("events")) || [];
  events = events.filter((e) => e.userId !== userId);
  await db.set("events", events);
  res.json({ success: true });
});

// ---- Admin: list all events (password-gated) ----
app.get("/api/events/all", async (req, res) => {
  const pass = req.query.adminPass;
  if (pass !== ADMIN_PASS) return res.status(403).json({ error: "forbidden" });

  const users = (await db.get("users")) || [];
  const events = (await db.get("events")) || [];
  const nameById = Object.fromEntries(users.map((u) => [u.userId, u.username]));
  const rows = events
    .map((e) => ({ ...e, username: nameById[e.userId] || "unknown" }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
