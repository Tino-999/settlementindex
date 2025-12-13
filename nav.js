(function () {
  // Wenn die Seite unter /settlementindex/ läuft (GitHub Pages), nutze dieses Prefix.
  // Lokal (localhost) bleibt es leer.
  const isGhPagesProject = location.pathname.startsWith("/settlementindex/");
  const base = isGhPagesProject ? "/settlementindex" : "";

  const nav = document.getElementById("topnav");
  if (!nav) return;

  nav.querySelectorAll("a[data-href]").forEach(a => {
    const href = a.getAttribute("data-href");
    a.setAttribute("href", base + href);
  });
})();
