// people/people.js
const PRE_ID = "people-pre";

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function lastNameKey(fullName) {
  const n = String(fullName ?? "").trim();
  if (!n) return "";
  // sehr robuster, einfacher Ansatz: letztes Wort als Nachname
  const parts = n.split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

async function loadPeopleIndex() {
  // Cache-buster hilft auf GitHub Pages manchmal
  const url = `../data/people_index.json?v=${Date.now()}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error("people_index.json is not an array");
  return data;
}

function render(people, sortMode) {
  const el = document.getElementById(PRE_ID);
  if (!el) return;

  const header =
`EINZELPERSONEN

sortierung:  ${sortMode === "last" ? "<u>nachname</u>" : '<a href="?sort=last">nachname</a>'}  ${sortMode === "role" ? "<u>rolle</u>" : '<a href="?sort=role">rolle</a>'}

Archivische Porträts. Schwarzweiß. Umschaltbar: Nachname / Rolle.

`;

  const lines = people.map(p => {
    const name = escapeHtml(p.name || "-");
    const role = escapeHtml(p.role || "");
    const slug = encodeURIComponent(p.slug || "");
    const roleLine = role ? `\n${role}` : "";
    return `<a href="./person.html?slug=${slug}">${name}</a>${roleLine}\n`;
  });

  el.innerHTML = header + lines.join("\n");
}

function sortPeople(people, sortMode) {
  const arr = [...people];

  if (sortMode === "role") {
    arr.sort((a, b) => {
      const ar = (a.role || "").toLowerCase();
      const br = (b.role || "").toLowerCase();
      if (ar !== br) return ar.localeCompare(br);
      return lastNameKey(a.name).localeCompare(lastNameKey(b.name));
    });
  } else {
    // default: last name
    arr.sort((a, b) => {
      const al = lastNameKey(a.name);
      const bl = lastNameKey(b.name);
      if (al !== bl) return al.localeCompare(bl);
      return (a.name || "").localeCompare(b.name || "");
    });
  }

  return arr;
}

(async function main() {
  try {
    const sortMode = (qs("sort") || "last").toLowerCase() === "role" ? "role" : "last";
    const people = await loadPeopleIndex();
    const sorted = sortPeople(people, sortMode);
    render(sorted, sortMode);
  } catch (e) {
    const el = document.getElementById(PRE_ID);
    if (el) el.textContent = `EINZELPERSONEN\n\nFehler beim Laden:\n${e?.message || e}`;
    console.error(e);
  }
})();
