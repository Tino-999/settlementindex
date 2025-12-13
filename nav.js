// shared/nav.js
(async function () {
  const placeholder =
    document.getElementById("nav-placeholder") ||
    document.getElementById("topnav");

  if (!placeholder) return;

  const candidates = ["nav.html", "../nav.html", "../../nav.html", "../../../nav.html"];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;

      const html = (await res.text()).trim();
      const finalHtml = /^<nav[\s>]/i.test(html) ? html : `<nav id="topnav">${html}</nav>`;
      placeholder.innerHTML = finalHtml;
      return;
    } catch (_) {}
  }

  placeholder.textContent = "nav missing (nav.html not found)";
})();
