// index.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

// Try Replit DB first, fallback to local JSON
let dbClient;
let dbType;
try {
  const { Database } = require("@replit/database");
  dbClient = new Database();
  dbType = "replit";
  console.log("Using Replit DB");
} catch (err) {
  // Local fallback using lowdb v1
  const low = require("lowdb");
  const FileSync = require("lowdb/adapters/FileSync");
  const adapter = new FileSync("db.json");
  dbClient = low(adapter);
  dbType = "local";
  console.log("Using local JSON DB");
}

const app = express();

app.use(express.json()); // <-- parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // parse form data

// const app = express();
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// Serve public folder
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});


// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, "public")));

let currentUser = null;

// ----- LOGIN -----
app.post("/login", (req, res) => {
  const { username } = req.body;
  if (!username) return res.redirect("/");
  currentUser = username.trim();
  res.redirect("/app.html");
});

// ----- ADD EVENT -----
// app.post("/add-event", async (req, res) => {
//   if (!currentUser) return res.redirect("/");

//   const { eventName, eventTime } = req.body;
//   const timestamp = eventTime ? new Date(eventTime).toLocaleString() : new Date().toLocaleString();

//   const userKey = `events_${currentUser}`;

//   if (dbType === "replit") {
//     let events = (await dbClient.get(userKey)) || [];
//     events.push({ eventName, timestamp });
//     await dbClient.set(userKey, events);
//   } else {
//     let events = dbClient.get(userKey).value() || [];
//     events.push({ eventName, timestamp });
//     dbClient.set(userKey, events).write();
//   }

//   res.redirect("/app.html");
// });

app.post("/add-event", async (req, res) => {
  if (!currentUser) return res.redirect("/");

  // Handles JSON from fetch or form data
  const eventName = req.body.eventName || req.body.manualEventName;
  const eventTime = req.body.timestamp || req.body.eventTime; 

  if (!eventName) return res.status(400).send("No event name provided");

  const timestamp = eventTime ? new Date(eventTime).toLocaleString() : new Date().toLocaleString();

  const userKey = `events_${currentUser}`;

  if (dbType === "replit") {
    let events = (await dbClient.get(userKey)) || [];
    events.push({ eventName, timestamp });
    await dbClient.set(userKey, events);
  } else {
    let events = dbClient.get(userKey).value() || [];
    events.push({ eventName, timestamp });
    dbClient.set(userKey, events).write();
  }

  // Respond JSON for fetch or redirect for forms
  if (req.headers["content-type"] === "application/json") {
    res.json({ eventName, timestamp });
  } else {
    res.redirect("/app.html");
  }
});


// ----- GET EVENTS -----
app.get("/events", async (req, res) => {
  if (!currentUser) return res.json([]);

  const userKey = `events_${currentUser}`;
  let events;

  if (dbType === "replit") {
    events = (await dbClient.get(userKey)) || [];
  } else {
    events = dbClient.get(userKey).value() || [];
  }

  res.json(events);
});

// ----- START SERVER -----
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ TrackIt app running at http://localhost:${PORT}`);
});
