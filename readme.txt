/*
===============================================================================
Planetary Settlement Index
ARCHITEKTUR- & LOGIK-README
===============================================================================

Ziel
----
Diese Website ist ein statisches, datengetriebenes Informationsarchiv
zur menschlichen Besiedlung des Weltraums.

Schwerpunkte:
- Mars, Mond, Off-World-Ökonomie
- Ethik, Technologie, Institutionen
- Filme & Literatur
- Einzelpersonen (Autoren, Ingenieure, Denker)

Designprinzip:
- Minimalistisch
- Text-first
- Keine Frameworks
- Vollständig statisch (GitHub Pages kompatibel)


===============================================================================
ORDNERSTRUKTUR
===============================================================================

/ (root)
│
├─ index.html          -> Hauptseite (Kapitelübersicht, Langtext, Anker)
├─ ethik.html          -> Visuelle Kapitel-Seite (Hero + Panels)
├─ nav.html            -> Zentrale Navigation (EINMAL definieren)
│
├─ shared/
│   └─ site.css        -> Globales Styling (Farben, Typo, Basislayout)
│
├─ movies/
│   ├─ index.html      -> Filme & Dokus (Grid, Sortierung)
│   ├─ data.js         -> Datensatz der Filme
│   └─ images/         -> Filmstills / Poster
│
├─ people/
│   ├─ index.html      -> Einzelpersonen (Grid, Sortierung)
│   ├─ data.js         -> Datensatz der Personen
│   ├─ add-person.mjs  -> Node-Script zum Ergänzen neuer Personen
│   └─ images/         -> Portraits
│
└─ readme.txt          -> Diese Datei


===============================================================================
NAVIGATION (ZENTRALER MECHANISMUS)
===============================================================================

Problem:
- Mehrere HTML-Seiten
- Navigation soll überall identisch sein
- KEINE Server-Logik, KEIN Framework

Lösung:
- nav.html enthält NUR die Navigation
- Jede Seite lädt nav.html per fetch()

Beispiel (in jeder HTML-Seite):
--------------------------------
<div id="nav-placeholder"></div>

<script>
  fetch("nav.html")          // oder "../nav.html" je nach Ordner
    .then(r => r.text())
    .then(html => {
      document.getElementById("nav-placeholder").innerHTML = html;
    });
</script>

WICHTIG:
- Root-Seiten (index.html, ethik.html): fetch("nav.html")
- Unterordner (movies/, people/): fetch("../nav.html")


===============================================================================
nav.html (INHALTLICH)
===============================================================================

- Enthält ausschließlich <nav id="topnav">
- Alle Links sind RELATIV ZUM ROOT gesetzt

Beispiel:
---------
<a href="/settlementindex/index.html#marsbesiedlung">marsbesiedlung</a>
<a href="/settlementindex/ethik.html">ethik</a>
<a href="/settlementindex/movies/">filme</a>
<a href="/settlementindex/people/">einzelpersonen</a>

Warum absoluter Pfad?
- GitHub Pages läuft unter /settlementindex/
- Verhindert Pfadfehler bei Unterseiten


===============================================================================
DATENGETRIEBENE SEITEN
===============================================================================

movies/index.html
-----------------
- Lädt movies/data.js
- data.js definiert: const people = [...]
- JS rendert Grid dynamisch
- Sortierung:
  - alphabetisch
  - chronologisch
- A–Z Sprungnavigation
- Verlinkung:
  - Buch (Wikipedia)
  - Autor → people/index.html#slug

people/index.html
-----------------
- Lädt people/data.js
- Sortierung:
  - nach Nachname
  - nach Rolle
- Dynamische Gruppen (A–Z oder Rollen)
- Jeder Eintrag hat:
  - slug (für Deep-Links)
  - Bild
  - Lebensdaten
  - Rolle
  - knownFor


===============================================================================
SLUG-LOGIK
===============================================================================

Slug = URL-Anker für Verlinkung zwischen Seiten

Erzeugung:
----------
- Kleinbuchstaben
- Umlaute entfernt
- Leerzeichen → "-"
- Sonderzeichen entfernt

Beispiel:
---------
"Robert Silverberg" -> robert-silverberg

Filme verlinken Autoren so:
---------------------------
../people/index.html#robert-silverberg


===============================================================================
STYLING
===============================================================================

shared/site.css
---------------
- Dark Mode fix
- Monospace
- Keine Animationen
- Kontrastreich
- Print-ähnliche Ästhetik

Seiten-spezifisches CSS:
------------------------
- index.html: klassischer <pre>-Stil
- ethik.html: Fullscreen Panels + Bilder
- movies / people: Grid-Layouts


===============================================================================
GITHUB PAGES
===============================================================================

Repository:
-----------
https://github.com/Tino-999/settlementindex

Live:
-----
https://tino-999.github.io/settlementindex/

Wichtig:
--------
- KEINE führenden "/" außerhalb von /settlementindex/
- fetch() funktioniert auf GitHub Pages
- Bei Problemen: Hard Reload (Ctrl+F5)


===============================================================================
DESIGNPHILOSOPHIE
===============================================================================

- Inhalte sind wichtiger als Technik
- Texte sollen wie Archivmaterial wirken
- Keine Interaktion ohne inhaltlichen Mehrwert
- Navigation ist Werkzeug, kein Feature
- Die Seite soll auch in 10 Jahren noch lesbar sein


===============================================================================
ENDE
===============================================================================
*/
