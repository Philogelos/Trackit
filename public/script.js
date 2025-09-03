// ---- State ----
let currentUser = null; // { username, userId }
const $ = (id) => document.getElementById(id);

const $auth = $("auth");
const $app = $("app");
const $who = $("who");
const $events = $("events");
const $customButtons = $("custom-buttons");

// ---- Boot ----
const savedUser = localStorage.getItem("trackit_user");
if (savedUser) {
  currentUser = JSON.parse(savedUser);
  showApp();
}

$("loginBtn").addEventListener("click", async () => {
  const username = $("username").value.trim();
  if (!username) return alert("Enter username");
  const r = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  currentUser = await r.json();
  localStorage.setItem("trackit_user", JSON.stringify(currentUser));
  showApp();
});

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("trackit_user");
  currentUser = null;
  $app.classList.add("hidden");
  $auth.classList.remove("hidden");
});

// ---- UI ----
function showApp() {
  if (!currentUser) return;
  $who.textContent = `${currentUser.username} (${currentUser.userId})`;
  $auth.classList.add("hidden");
  $app.classList.remove("hidden");
  wireQuickButtons();
  loadMyEvents();
}

function wireQuickButtons() {
  document.querySelectorAll("#buttons button").forEach((btn) => {
    btn.onclick = async () => {
      const label = btn.dataset.label;
      const type = btn.dataset.type;
      const value = btn.dataset.value || "";
      await addEvent({ label, type, value });
    };
  });

  $("add-custom").onclick = () => {
    const label = $("custom-label").value.trim();
    const type = $("custom-type").value;
    if (!label) return alert("Enter a label");
    const btnWrap = document.createElement("span");
    btnWrap.className = "buttons";
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.label = label;
    btn.dataset.type = type;
    btn.onclick = async () => addEvent({ label, type });
    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.className = "ghost";
    remove.onclick = () => btnWrap.remove();
    btnWrap.appendChild(btn);
    btnWrap.appendChild(remove);
    $customButtons.appendChild(btnWrap);
    $("custom-label").value = "";
  };

  $("add-manual").onclick = async () => {
    const label = $("manual-label").value.trim();
    const type = $("manual-type").value;
    const when = $("manual-when").value; // datetime-local (e.g., "2025-09-03T20:30")
    const value = $("manual-value").value; // "", Yes, No
    if (!label) return alert("Enter a label");
    if (!when) return alert("Pick a date/time");
    await addEvent({ label, type, when, value });
    $("manual-label").value = "";
    $("manual-when").value = "";
    $("manual-value").value = "";
  };

  $("resetBtn").onclick = async () => {
    if (!confirm("Delete ALL your events?")) return;
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.userId })
    });
    loadMyEvents();
  };
}

async function addEvent({ label, type, when = "", value = "" }) {
  await fetch("/api/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: currentUser.userId, label, type, when, value })
  });
  loadMyEvents();
}

async function loadMyEvents() {
  const res = await fetch(`/api/events/${currentUser.userId}`);
  const events = await res.json();

  // Build table
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  ["Time", "Event", "Value", "Actions"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  if (events.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "No events yet";
    tbody.appendChild(tr).appendChild(td);
  } else {
    events.forEach((e) => {
      const tr = document.createElement("tr");
      const time = new Date(e.timestamp).toLocaleString();
      tr.innerHTML = `
        <td>${time}</td>
        <td>${e.label}</td>
        <td>${e.value || ""}</td>
        <td class="actions"></td>
      `;
      const del = document.createElement("button");
      del.textContent = "Delete";
      del.onclick = async () => {
        await fetch("/api/event/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.userId, timestamp: e.timestamp })
        });
        loadMyEvents();
      };
      tr.querySelector(".actions").appendChild(del);
      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  $events.innerHTML = "";
  $events.appendChild(table);
}
