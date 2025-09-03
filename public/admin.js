const $ = (id) => document.getElementById(id);
const $gate = $("gate");
const $panel = $("panel");
const $all = $("all-events");

$("unlock").onclick = async () => {
  const pass = $("admin-pass").value.trim();
  if (!pass) return alert("Enter a password");
  sessionStorage.setItem("trackit_admin_pass", pass);
  await loadAll();
};

$("refresh").onclick = loadAll;

async function loadAll() {
  const pass = sessionStorage.getItem("trackit_admin_pass") || $("admin-pass").value.trim();
  if (!pass) return;

  const res = await fetch(`/api/events/all?adminPass=${encodeURIComponent(pass)}`);
  if (!res.ok) {
    alert("Wrong password or server error");
    return;
  }
  const rows = await res.json();

  $gate.classList.add("hidden");
  $panel.classList.remove("hidden");

  // Build table
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  ["Time", "User", "Event", "Value"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "No events yet";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    rows.forEach((e) => {
      const tr = document.createElement("tr");
      const time = new Date(e.timestamp).toLocaleString();
      tr.innerHTML = `
        <td>${time}</td>
        <td>${e.username || e.userId}</td>
        <td>${e.label}</td>
        <td>${e.value || ""}</td>
      `;
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);

  $all.innerHTML = "";
  $all.appendChild(table);
}
