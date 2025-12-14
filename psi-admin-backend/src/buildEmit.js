import { canonicalJsonString } from "./canonicalJson.js";

export function buildOutputs({ content }) {
  const PEOPLE = [...content.people].map(stripFrontendPeople).sort((a, b) => a.name.localeCompare(b.name, "de"));
  const MOVIES = [...content.movies].map(stripFrontendMovies).sort((a, b) => {
    const ay = Number(a.year) || 0, by = Number(b.year) || 0;
    if (ay !== by) return ay - by;
    return String(a.title).localeCompare(String(b.title), "de");
  });
  const ENTRIES = [...content.timeline].map(stripFrontendEntries).sort((a, b) => Number(a.year) - Number(b.year));

  const files = new Map();

  files.set("people/data.js", jsExport("PEOPLE", PEOPLE));
  files.set("movies/data.js", jsExport("MOVIES", MOVIES));
  files.set("data/entries.js", jsExport("ENTRIES", ENTRIES));

  const people_index = PEOPLE.map(p => ({ slug: p.slug, name: p.name })).sort((a,b)=>a.name.localeCompare(b.name,"de"));
  const movies_index = MOVIES.map(m => ({ slug: m.slug, title: m.title, year: m.year })).sort((a,b)=>{
    const ay=Number(a.year)||0, by=Number(b.year)||0;
    if (ay!==by) return ay-by;
    return String(a.title).localeCompare(String(b.title),"de");
  });
  const tags_index = (content.tags?.tags || []).map(t => ({ slug: t.slug, label: t.label }))
    .sort((a,b)=>String(a.label).localeCompare(String(b.label),"de"));

  files.set("data/people_index.json", canonicalJsonString(people_index));
  files.set("data/movies_index.json", canonicalJsonString(movies_index));
  files.set("data/tags_index.json", canonicalJsonString(tags_index));

  return files;
}

function jsExport(name, arr) {
  const json = JSON.stringify(arr, null, 2);
  return `export const ${name} = ${json}\n`;
}

function stripFrontendPeople(x) {
  return {
    slug: x.slug,
    name: x.name,
    role: x.role || "",
    summary: x.summary,
    birthYear: x.birthYear ?? null,
    deathYear: x.deathYear ?? null,
    tags: Array.isArray(x.tags) ? x.tags : [],
    links: Array.isArray(x.links) ? x.links : []
  };
}

function stripFrontendMovies(x) {
  return {
    slug: x.slug,
    title: x.title,
    year: Number(x.year),
    format: x.format || "",
    summary: x.summary,
    people: Array.isArray(x.people) ? x.people : [],
    tags: Array.isArray(x.tags) ? x.tags : [],
    links: Array.isArray(x.links) ? x.links : []
  };
}

function stripFrontendEntries(x) {
  return {
    slug: x.slug,
    track: x.track,
    year: Number(x.year),
    title: x.title,
    summary: x.summary,
    tags: Array.isArray(x.tags) ? x.tags : [],
    people: Array.isArray(x.people) ? x.people : [],
    links: Array.isArray(x.links) ? x.links : []
  };
}

