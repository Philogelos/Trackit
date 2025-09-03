document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("events-table");

  const loadEvents = async () => {
    const res = await fetch("/events");
    const events = await res.json();
    table.innerHTML = "";
    events.forEach(e => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${e.eventName}</td><td>${e.timestamp}</td>`;
      table.appendChild(row);
    });
  };

  loadEvents();

  // Standard buttons
  document.querySelectorAll(".event-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const eventName = btn.dataset.event;
      await fetch("/add-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName })
      });
      loadEvents();
    });
  });

  // Manual event
  const manualBtn = document.getElementById("manual-event-btn");
  const manualForm = document.getElementById("manual-event-form");
  manualBtn.addEventListener("click", () => {
    manualForm.style.display = manualForm.style.display === "none" ? "block" : "none";
  });

  document.getElementById("add-manual-btn").addEventListener("click", async () => {
    const eventName = document.getElementById("manual-event-name").value;
    const timestamp = document.getElementById("manual-event-time").value;
    if (!eventName) return alert("Enter event name");
    await fetch("/add-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName, timestamp })
    });
    document.getElementById("manual-event-name").value = "";
    document.getElementById("manual-event-time").value = "";
    loadEvents();
  });
});
