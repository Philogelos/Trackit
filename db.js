// db.js
const fs = require("fs");
const path = require("path");

let db;
if (process.env.REPLIT_DB_URL) {
  const Database = require("@replit/database");
  db = new Database(process.env.REPLIT_DB_URL);
} else {
  // Local JSON fallback
  const filePath = path.join(__dirname, "localdb.json");
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "{}");
  
  db = {
    get: async (key) => {
      const raw = fs.readFileSync(filePath);
      const json = JSON.parse(raw);
      return json[key] || [];
    },
    set: async (key, value) => {
      const raw = fs.readFileSync(filePath);
      const json = JSON.parse(raw);
      json[key] = value;
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      return true;
    }
  };
}

module.exports = db;
