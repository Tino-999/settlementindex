export function sortKeysDeep(x) {
  if (Array.isArray(x)) return x.map(sortKeysDeep);
  if (x && typeof x === "object") {
    const out = {};
    for (const k of Object.keys(x).sort()) out[k] = sortKeysDeep(x[k]);
    return out;
  }
  return x;
}

export function canonicalJsonString(obj) {
  const sorted = sortKeysDeep(obj);
  return JSON.stringify(sorted, null, 2) + "\n";
}

