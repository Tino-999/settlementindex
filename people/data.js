// people/data.js
// Planetary Settlement Index – People Dataset
// Source of truth for people.html
// ES module – do not use globals

export const PEOPLE = [
  {
    name: "Werner von Braun",
    slug: "werner-von-braun",
    life: "1912–1977",
    image: "images/braun.jpg",
    wiki: "https://en.wikipedia.org/wiki/Wernher_von_Braun",
    role: "Raketeningenieur",
    knownFor: [
      "Saturn V",
      "Apollo-Programm",
      "frühe Mars-Konzepte"
    ]
  },

  {
    name: "Michio Kaku",
    slug: "michio-kaku",
    life: "1947–",
    image: "images/kaku.jpg",
    wiki: "https://en.wikipedia.org/wiki/Michio_Kaku",
    role: "Theoretischer Physiker",
    knownFor: [
      "Stringtheorie",
      "Popularisierung futuristischer Physik"
    ]
  },

  {
    name: "Robert Zubrin",
    slug: "robert-zubrin",
    life: "1952–",
    image: "images/zubrin.jpg",
    wiki: "https://en.wikipedia.org/wiki/Robert_Zubrin",
    role: "Luft- und Raumfahrtingenieur",
    knownFor: [
      "Mars Direct",
      "Gründung der Mars Society"
    ]
  },

  {
    name: "Ray Kurzweil",
    slug: "ray-kurzweil",
    life: "1948–",
    image: "images/kurzweil.jpg",
    wiki: "https://en.wikipedia.org/wiki/Ray_Kurzweil",
    role: "Futurist & KI-Forscher",
    knownFor: [
      "Technologische Singularität",
      "KI-Prognosen"
    ]
  },

  {
    name: "Robert Silverberg",
    slug: "robert-silverberg",
    life: "1935–",
    image: "images/silverberg.jpg",
    wiki: "https://en.wikipedia.org/wiki/Robert_Silverberg",
    role: "Science-Fiction-Autor",
    knownFor: [
      "Hard Science Fiction",
      "New Wave Science Fiction",
      "planetare Zivilisationen"
    ]
  }
];

/*
  Contract:
  ----------
  people.html imports:
    import { PEOPLE } from './people/data.js'

  Each entry must provide:
  - name (string)
  - slug (string, unique)
  - image (relative path)
  - wiki (URL)
  - role (string)
  - knownFor (array of strings)
*/
