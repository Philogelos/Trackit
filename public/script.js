const eventsList = document.getElementById("events-list");
const buttonsDiv = document.getElementById("buttons");

// Load events and show table
async function loadEvents() {
  const res = await fetch("/api/events");
  const events = await res.json();
  eventsList.innerHTML = "";

  const table = document.createElement("table");
  table.border = "1";
  const header = document.createElement("tr");
  ["Time", "Event", "Value"].forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    header.appendChild(th);
  });
  table.appendChild(header);

  if (events.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.style.textAlign = "center";
    td.textContent = "No events yet";
    tr.appendChild(td);
    table.appendChild(tr);
  } else {
    events.forEach(e => {
      const tr = document.createElement("tr");
      const time = new Date(e.timestamp).toLocaleString();
      tr.innerHTML = `<td>${time}</td><td>${e.label}</td><td>${e.value}</td>`;
      table.appendChild(tr);
    });
  }

  eventsList.appendChild(table);
}

// Create event automatically
async function createEvent(label, type) {
  await fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, type })
  });
  loadEvents();
}

// Default buttons
document.querySelectorAll(".event-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    createEvent(btn.dataset.label, btn.dataset.type);
  });
});

// Add custom buttons
document.getElementById("add-custom").addEventListener("click", () => {
  const label = document.getElementById("custom-label").value.trim();
  const type = document.getElementById("custom-type").value;
  if (!label) return alert("Enter a label");

  const btn = document.createElement("button");
  btn.className = "event-btn";
  btn.dataset.label = label;
  btn.dataset.type = type;
  btn.textContent = label;
  buttonsDiv.appendChild(btn);
  btn.addEventListener("click", () => createEvent(label, type));

  document.getElementById("custom-label").value = "";
});

// Initial load
loadEvents();
