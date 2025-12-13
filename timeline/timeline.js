// /timeline/timeline.js
import { entries } from "../data/entries.js";

const els = {
  q: document.getElementById("q"),
  tag: document.getElementById("tag"),
  science: document.getElementById("f-science"),
  scifi: document.getElementById("f-scifi"),
  clear: document.getElementById("clear"),
  laneScience: document.getElementById("lane-science"),
  laneScifi: document.getElementById("lane-scifi"),
  decadesScience: document.getElementById("decades-science"),
  decadesScifi: document.getElementById("decades-scifi"),
};

function norm(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function entryYears(e) {
  if (Number.isFinite(e.year)) return { start: e.year, end: e.year };
  const s = Number.isFinite(e.start) ? e.start : null;
  const t = Number.isFinite(e.end) ? e.end : s;
  return { start: s, end: t };
}

function matchesFilters(e, q, tag, wantScience, wantScifi) {
  if (e.track === "science" && !wantScience) return false;
  if (e.track === "scifi" && !wantScifi) return false;

  const nQ = norm(q);
  const nTag = norm(tag);

  if (nTag) {
    const tags = (e.tags || []).map(norm);
    if (!tags.includes(nTag)) return false;
  }

  if (!nQ) return true;

  const blob = norm(
    [
      e.title,
      e.type,
      e.summary,
      ...(e.tags || []),
      ...((e.links || []).map(l => l.label) || []),
      ...((e.people || []) || [])
    ].join(" ")
  );

  return blob.includes(nQ);
}

function groupByStartYear(list) {
  // Zeitraum-Entries werden nach start-year einsortiert (und zeigen end zusätzlich).
  const map = new Map();
  for (const e of list) {
    const y = entryYears(e).start;
    if (!Number.isFinite(y)) continue;
    if (!map.has(y)) map.set(y, []);
    map.get(y).push(e);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

function decadeOf(year) {
  return Math.floor(year / 10) * 10;
}

function uniqueDecadesFromYears(years) {
  const set = new Set();
  for (const y of years) set.add(decadeOf(y));
  return [...set].sort((a, b) => a - b);
}

function linkList(links) {
  if (!links || !links.length) return "";
  const items = links
    .slice(0, 3)
    .map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`)
    .join(" · ");
  return `<div class="links">${items}</div>`;
}

function badgeRange(e) {
  const { start, end } = entryYears(e);
  if (!Number.isFinite(start)) return "";
  if (start === end) return "";
  return `<span class="range">${start}–${end}</span>`;
}

function renderDecadeNav(container, years, lanePrefix) {
  const decades = uniqueDecadesFromYears(years);
  if (!decades.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = decades
    .map(d => `<a class="decade" href="#${lanePrefix}-${d}">${d}s</a>`)
    .join(" ");
}

function renderLane(container, decadeNavContainer, list, lanePrefix) {
  const grouped = groupByStartYear(list);
  const years = grouped.map(([y]) => y);

  renderDecadeNav(decadeNavContainer, years, lanePrefix);

  let html = "";
  let currentDecade = null;

  for (const [year, items] of grouped) {
    const d = decadeOf(year);
    const isNewDecade = d !== currentDecade;

    if (isNewDecade) {
      currentDecade = d;
      html += `
        <div class="decadeHeader" id="${lanePrefix}-${d}">
          <span class="muted small">sprung:</span> <b>${d}s</b>
        </div>
      `;
    }

    html += `<div class="yearblock" id="${lanePrefix}-y-${year}">
      <div class="year">${year}</div>
      <div class="items">
        ${items
          .sort((a, b) => (norm(a.title) < norm(b.title) ? -1 : 1))
          .map(e => `
            <article class="card">
              <div class="title">
                <span>${e.title}</span>
                ${badgeRange(e)}
              </div>
              <div class="meta muted small">${e.type}${e.tags?.length ? " · " + e.tags.join(", ") : ""}</div>
              ${e.summary ? `<div class="summary">${e.summary}</div>` : ""}
              ${linkList(e.links)}
              ${e.people?.length ? `<div class="muted small">people: ${e.people.join(", ")}</div>` : ""}
            </article>
          `)
          .join("")}
      </div>
    </div>`;
  }

  container.innerHTML = html || `<p class="muted">keine treffer.</p>`;
}

function update() {
  const q = els.q.value;
  const tag = els.tag.value;
  const wantScience = els.science.checked;
  const wantScifi = els.scifi.checked;

  const filtered = entries.filter(e => matchesFilters(e, q, tag, wantScience, wantScifi));

  renderLane(
    els.laneScience,
    els.decadesScience,
    filtered.filter(e => e.track === "science"),
    "sci"
  );

  renderLane(
    els.laneScifi,
    els.decadesScifi,
    filtered.filter(e => e.track === "scifi"),
    "fic"
  );
}

els.q.addEventListener("input", update);
els.tag.addEventListener("input", update);
els.science.addEventListener("change", update);
els.scifi.addEventListener("change", update);

els.clear.addEventListener("click", () => {
  els.q.value = "";
  els.tag.value = "";
  els.science.checked = true;
  els.scifi.checked = true;
  update();
});

update();
