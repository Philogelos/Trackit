// index.js (backend)
const express = require("express");       // Import express (web server framework)
const bodyParser = require("body-parser");// Helps read JSON data from requests
const Database = require("@replit/database"); // Import Replit's built-in DB

const app = express();  // Create the app
const db = new Database(); // Create a new Replit DB instance

app.use(bodyParser.json());  // Allow app to understand JSON input

// Route 1: Save a new bedtime record
app.post("/save", async (req, res) => {
  // req.body is the data the user sent
  const { note } = req.body;
  const now = new Date(); // Current date & time

  // Save as an object { date: ..., note: ... }
  const record = { date: now.toISOString(), note };

  // Get existing records or empty array
  let records = (await db.get("records")) || [];
  records.push(record); // Add new record
  await db.set("records", records); // Save back to DB

  res.json({ message: "Saved!", record });
});

// Route 2: Get all saved records
app.get("/records", async (req, res) => {
  const records = (await db.get("records")) || [];
  res.json(records);
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
