// shared/nav.js
(() => {
  const NAV = [
    { href: "index.html", label: "marsbesiedlung" },
    { href: "index.html#mondbasen", label: "mondbasen" },
    { href: "index.html#off-world-oekonomie", label: "off-world-oekonomie" },
    { href: "ethik.html", label: "ethik" },
    { href: "index.html#technologie", label: "technologie" },
    { href: "index.html#institutionen", label: "institutionen" },
    { href: "index.html#universitaeten", label: "universitaeten" },
    { href: "movies/index.html", label: "filme" },
    { href: "people/index.html", label: "einzelpersonen" }
    // später: { href: "books/index.html", label: "buecher" }
  ];

  // ermittelt, wie viele Ordner tief wir sind: /people/index.html -> depth=1 -> prefix="../"
  function prefixToRoot() {
    const path = location.pathname.replace(/\\/g, "/");
    const parts = path.split("/").filter(Boolean); // ohne leere
    // wenn letzter Teil .html ist, zählt das nicht als Ordner
    const hasHtml = parts.length && parts[parts.length - 1].endsWith(".html");
    const depth = Math.max(0, (hasHtml ? parts.length - 1 : parts.length) - 1);
    return "../".repeat(depth);
  }

  function normalizeForActive(href) {
    // für Active-Highlight: ignoriert #hash
    return href.split("#")[0];
  }

  const navEl = document.getElementById("topnav");
  if (!navEl) return;

  const root = prefixToRoot();
  const current = normalizeForActive(location.pathname.split("/").pop() || "index.html");

  navEl.innerHTML = NAV.map(item => {
    const url = root + item.href;
    const isActive = normalizeForActive(item.href) === current;
    return `<a href="${url}" ${isActive ? 'aria-current="page"' : ""}>${item.label}</a>`;
  }).join("\n");
})();
