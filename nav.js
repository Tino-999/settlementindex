(function () {
  const placeholder = document.getElementById("nav-placeholder");
  if (!placeholder) return;

  // Erkennt GitHub Pages automatisch
  const isGitHubPages = location.hostname.endsWith("github.io");

  // Basis-Pfad bestimmen
  // lokal: /
  // GitHub Pages: /settlementindex/
  const basePath = isGitHubPages ? "/settlementindex/" : "/";

  // Pfad zu nav.html korrekt auflösen
  const navUrl = basePath + "nav.html";

  fetch(navUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error("nav.html nicht gefunden unter " + navUrl);
      }
      return response.text();
    })
    .then(html => {
      placeholder.innerHTML = html;
    })
    .catch(err => {
      console.error("Navigation konnte nicht geladen werden:", err);
    });
})();
