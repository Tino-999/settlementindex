README — settlementindex
Programmierlogik & Seitenarchitektur

────────────────────────────────────────────────────────
0) Überblick
────────────────────────────────────────────────────────
Diese Website ist vollständig statisch.
Kein Framework, kein Build-Schritt, kein Backend.

Start lokal:
python -m http.server 8000

Ziele der Architektur:
- maximale Einfachheit
- zentrale Navigation (Single Source of Truth)
- datengetriebene Inhalte
- stabile Deep-Links zwischen Seiten
- langfristig wartbar (auch für KI-Generierung)

────────────────────────────────────────────────────────
1) Projektstruktur
────────────────────────────────────────────────────────
/index.html
/style.css

/ethik.html
/images/...

/people/
  index.html
  data.js
  /images/...

/movies/
  index.html
  data.js
  /images/...

/shared/
  site.css
  nav.html

Bedeutung:
- site.css        → globale Styles
- style.css       → seiten­spezifische Styles
- nav.html        → zentrale Navigation
- data.js         → reine Inhaltsdaten
- index.html      → Rendering + Logik

────────────────────────────────────────────────────────
2) Zentrale Navigation (Variante A)
────────────────────────────────────────────────────────
Die Navigation existiert genau einmal:

/shared/nav.html

Alle Seiten laden sie dynamisch:

<div id="nav-placeholder"></div>

Script (Pfad abhängig von Seitenebene):

fetch("shared/nav.html")        // Root-Seiten
fetch("../shared/nav.html")     // Unterordner

.then(r => r.text())
.then(html => {
  document.getElementById("nav-placeholder").innerHTML = html;
});

nav.html enthält:

<nav id="topnav">
  ...
</nav>

id="topnav" ist wichtig für Scroll-Offsets.

────────────────────────────────────────────────────────
3) Datenmodell (data.js)
────────────────────────────────────────────────────────
Alle Inhalte sind datengetrieben.
Kein HTML wird manuell dupliziert.

people/data.js:

const people = [
  {
    name: "Robert Silverberg",
    life: "1935–",
    image: "images/silverberg.jpg",
    wiki: "https://en.wikipedia.org/wiki/Robert_Silverberg",
    role: "Science-Fiction-Autor",
    knownFor: "Planetare Zivilisationen",
    slug: "robert-silverberg"
  }
];

movies/data.js:

const people = [
  {
    name: "Passengers",
    life: "2016",
    image: "images/passengers.avif",
    wiki: "https://en.wikipedia.org/wiki/Passengers_(2016_film)",

    book: "Passengers",
    bookYear: "1969",
    bookWiki: "https://en.wikipedia.org/wiki/Passengers_(novel)",

    authorName: "Robert Silverberg",
    authorSlug: "robert-silverberg"
  }
];

Hinweis:
Das Array heißt bewusst überall "people".
Die Rendering-Logik erwartet diesen Namen.

────────────────────────────────────────────────────────
4) Rendering-Pipeline
────────────────────────────────────────────────────────
Ablauf pro Seite:

1) data.js laden
2) Sortiermodus aus localStorage lesen
3) Daten kopieren (immutabel)
4) Gruppierung erzeugen (Map)
5) Sortierung anwenden
6) Jump-Navigation bauen
7) DOM rendern

Kein direkter HTML-Text im Code,
alles entsteht aus Daten.

────────────────────────────────────────────────────────
5) Sortierlogik
────────────────────────────────────────────────────────
People:
- surname → Nachname (A–Z)
- role    → Rolle (Autor, Physiker, Ingenieur)

localStorage:
peopleSortMode = "surname" | "role"

Movies:
- alpha  → alphabetisch
- chrono → Erscheinungsjahr

localStorage:
moviesSortMode = "alpha" | "chrono"

Der Modus bleibt seitenübergreifend erhalten.

────────────────────────────────────────────────────────
6) Gruppierung & Jump-Navigation
────────────────────────────────────────────────────────
Gruppierung:

Map {
  "A" → [Einträge...]
  "B" → [Einträge...]
}

Jump-Leiste:
A B C D … Z #

Deaktivierte Buchstaben sind klicklos.

────────────────────────────────────────────────────────
7) Slugs & Deep-Links
────────────────────────────────────────────────────────
Filme verlinken auf Personen:

../people/index.html#robert-silverberg

Dafür:
- jede Person hat einen festen slug
- figure.id = slug

Slugs sind stabil und manuell gepflegt.

────────────────────────────────────────────────────────
8) Scroll-Offset (wegen Navigation)
────────────────────────────────────────────────────────
Beim Klick auf Jump-Links:

navHeight = topnav.getBoundingClientRect().height
targetY = elementTop - navHeight - 12

Verhindert, dass Überschriften
unter der Navigation verschwinden.

────────────────────────────────────────────────────────
9) Erweiterung um neue Bereiche
────────────────────────────────────────────────────────
Beispiel: /books/

1) Ordner anlegen
2) index.html von movies kopieren
3) data.js definieren
4) Link in shared/nav.html ergänzen

Keine weiteren Änderungen nötig.

────────────────────────────────────────────────────────
10) Grundprinzipien
────────────────────────────────────────────────────────
- statisch statt komplex
- Daten vor Layout
- Navigation nur einmal
- keine Framework-Abhängigkeit
- vorhersehbares Verhalten
- maschinenlesbar + menschlich lesbar

Ende der README
