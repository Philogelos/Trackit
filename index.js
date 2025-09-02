const express = require("express");
const Database = require("@replit/database");

const app = express();
const db = new Database();
// const PORT = process.env.PORT || 3000;
const PORT = process.env.PORT || 4000;


// Serve frontend
app.use(express.static("public"));

// Simple API
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Save to DB
app.get("/api/save", async (req, res) => {
  await db.set("username", "David");
  res.send("Saved username: David");
});

// Load from DB
app.get("/api/load", async (req, res) => {
  const value = await db.get("username");
  res.send(`Loaded from DB: ${value}`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
