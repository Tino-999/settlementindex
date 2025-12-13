(() => {
  // 1) basePath automatisch
  const isProject = location.pathname.startsWith("/settlementindex/");
  const base = isProject ? "/settlementindex" : "";

  // 2) nav laden (immer aus root des Projekts)
  // lokal: "/nav.html" | GitHub Pages: "/settlementindex/nav.html"
  const navUrl = base + "/nav.html";

  const mount = document.getElementById("nav-placeholder");
  if (!mount) return;

  fetch(navUrl)
    .then(r => r.text())
    .then(html => {
      mount.innerHTML = html;

      // 3) Links in nav fixen (data-href bevorzugt)
      const nav = document.getElementById("topnav");
      if (!nav) return;

      nav.querySelectorAll("a[data-href]").forEach(a => {
        a.href = base + a.getAttribute("data-href");
      });

      // Fallback: alte harte /settlementindex Links lokal korrigieren
      if (base === "") {
        nav.querySelectorAll('a[href^="/settlementindex/"]').forEach(a => {
          a.href = a.getAttribute("href").replace("/settlementindex", "");
        });
      }
    })
    .catch(console.error);
})();
