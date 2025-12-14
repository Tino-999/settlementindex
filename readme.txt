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
- Zeitliche Einordnung (Science vs. Science-Fiction)

Designprinzip:
- Minimalistisch
- Text-first
- Keine Frameworks
- Vollständig statisch (GitHub Pages kompatibel)
- Wartbarkeit wichtiger als visuelle Effekte


===============================================================================
ORDNERSTRUKTUR
===============================================================================

/ (root)
│
├─ index.html          -> Hauptseite (Kapitelübersicht, Langtext, Anker)
├─ ethik.html          -> Visuelle Kapitel-Seite (Hero + Panels)
├─ nav.html            -> Zentrale Navigation (rein inhaltlich)
│
├─ shared/
│   ├─ site.css        -> Globales Styling (Farben, Typo, Basislayout)
│   └─ init.js         -> Zentrale Initialisierung (Navigation + Pfade)
│
├─ timeline/
│   ├─ index.html      -> Zeitstrahl (Science & Sci-Fi, zwei Spuren)
│   └─ timeline.js     -> Rendering, Filter, Jahrzehnt-Sprünge
│
├─ data/
│   └─ entries.js      -> Gemeinsamer Zeitstrahl-Datensatz (Science + Sci-Fi)
│
├─ movies/
│   ├─ index.html      -> Filme & Dokus (Grid, Sortierung)
│   ├─ data.js         -> Datensatz der Filme
│   └─ images/         -> Filmstills / Poster
│
├─ people/
│   ├─ index.html      -> Einzelpersonen (Grid, Sortierung)
│   ├─ data.js         -> Datensatz der Personen
│   └─ images/         -> Portraits
│
└─ readme.txt          -> Diese Datei


===============================================================================
NAVIGATION (ZENTRALER MECHANISMUS)
===============================================================================

Problem (alt):
- Mehrere HTML-Seiten
- Navigation musste pro Seite gepflegt werden
- Unterschiedliche Pfade (lokal vs. GitHub Pages)

Aktuelle Lösung:
- nav.html enthält AUSSCHLIESSLICH die Navigation (keine Logik)
- shared/init.js lädt nav.html dynamisch
- Pfade werden automatisch angepasst:
  - lokal: /
  - GitHub Pages: /settlementindex/

Prinzip:
---------
- Jede Seite enthält:
  - <div id="nav-placeholder"></div>
  - <script src="shared/init.js" defer></script>
    (bzw. ../shared/init.js in Unterordnern)

Vorteile:
---------
- Navigation wird EINMAL gepflegt
- Keine fetch()-Logik mehr in einzelnen Seiten
- Neue Seiten benötigen nur zwei Zeilen Setup


===============================================================================
nav.html (INHALTLICH)
===============================================================================

- Enthält ausschließlich <nav id="topnav">
- Links werden über data-href definiert
- KEINE absoluten /settlementindex/ Pfade mehr

Beispiel:
---------
<a data-href="/timeline/">timeline</a>
<a data-href="/index.html#marsbesiedlung">marsbesiedlung</a>
<a data-href="/movies/">filme</a>
<a data-href="/people/">einzelpersonen</a>

Die tatsächlichen hrefs werden durch shared/init.js gesetzt.


===============================================================================
TIMELINE (NEU)
===============================================================================

timeline/index.html
-------------------
- Zeitstrahl mit zwei parallelen Spuren:
  - Science (Realwelt)
  - Sci-Fi (Bücher, Filme, Serien)
- Scroll-basierte Exploration
- Jahrzehnt-Sprungnavigation (z.B. 1960s, 2010s)
- Suche & Tag-Filter
- Zeiträume (start–end) werden unterstützt

data/entries.js
---------------
- Zentrale Datenquelle für den Zeitstrahl
- Jeder Eintrag ist ein "Event" mit:
  - track: science | scifi
  - year ODER start/end
  - title, summary, tags
  - links (Wikipedia, etc.)
  - optionale Verknüpfung zu people (slugs)

Ziel:
- Wissenschaftliche Entwicklung und kulturelle Imagination
  direkt vergleichbar machen.


===============================================================================
DATENGETRIEBENE SEITEN
===============================================================================

movies/index.html
-----------------
- Lädt movies/data.js
- Grid-Layout
- Sortierung:
  - alphabetisch
  - chronologisch
- A–Z Sprungnavigation
- Verlinkung:
  - Wikipedia
  - Autor → people/index.html#slug
- Sortiermodus wird im localStorage gespeichert

people/index.html
-----------------
- Lädt people/data.js
- Sortierung:
  - nach Nachname
  - nach Rolle
- A–Z Sprungnavigation
- Deep-Links über Slugs
- Einheitliche Navigation über shared/init.js


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


===============================================================================
STYLING
===============================================================================

shared/site.css
---------------
- Dark Mode fix
- Monospace
- Keine Animationen
- Kontrastreich
- Archiv-/Print-Ästhetik

Layout-Prinzip:
---------------
- Navigation und Content teilen sich denselben Container (.wrap)
- Einheitliche Abstände über alle Seiten
- Keine visuelle Abhängigkeit von JavaScript


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
- Navigation wird dynamisch angepasst
- Keine hartkodierten Projektpfade in HTML-Dateien
- Bei Anzeigeproblemen: Hard Reload (Ctrl+F5)


===============================================================================
DESIGNPHILOSOPHIE
===============================================================================

- Inhalte sind wichtiger als Technik
- Texte sollen wie Archivmaterial wirken
- Navigation ist Werkzeug, kein Feature
- Komplexität wird bewusst vermieden
- Die Seite soll auch in 10–20 Jahren noch lesbar und wartbar sein


===============================================================================
ENDE
===============================================================================
*/
