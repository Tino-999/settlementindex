const BACKEND = "https://psi-admin-backend.onrender.com";

const el = (id) => document.getElementById(id);

el("backendUrl").textContent = BACKEND;

let csrfToken = null;
let me = null;

let step = 1;
let rightTab = "preview";

const state = {
  type: "people",
  item: baseItem("people"),
  indexes: { people: [], movies: [], tags: [] },
  validation: null,
  lastSaved: null
};

function baseItem(type) {
  const common = {
    slug: "",
    tags: [],
    links: [],
    sources: [],
    status: "draft",
    meta: { ai: { used: false, provider: "", model: "" } }
  };
  if (type === "people") return { ...common, name: "", role: "", summary: "", birthYear: null, deathYear: null };
  if (type === "movies") return { ...common, title: "", year: new Date().getFullYear(), format: "", summary: "", people: [] };
  if (type === "timeline") return { ...common, track: "", year: new Date().getFullYear(), title: "", summary: "", people: [], movies: [] };
  return common;
}

async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  const r = await fetch(BACKEND + path, {
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const newCsrf = r.headers.get("x-csrf-token");
  if (newCsrf) csrfToken = newCsrf;
  if (!r.ok) {
    const t = await r.text();
    let j = null;
    try { j = JSON.parse(t); } catch {}
    throw { status: r.status, json: j, text: t };
  }
  return r.json();
}

async function refreshMe() {
  try {
    const r = await api("/me");
    me = r.user;
    csrfToken = r.csrf || csrfToken;
  } catch {
    me = null;
  }
  el("loginState").textContent = me ? `@${me.login}` : "not logged in";
  el("btnLogin").style.display = me ? "none" : "inline-block";
  el("btnLogout").style.display = me ? "inline-block" : "none";
}

async function loadIndexes() {
  if (!me) return;
  const [people, movies, tags] = await Promise.all([
    api("/index/people"),
    api("/index/movies"),
    api("/index/tags")
  ]);
  state.indexes = { people, movies, tags };
}

function setStep(n) {
  step = Math.max(1, Math.min(5, n));
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", Number(b.dataset.step) === step));
  el("crumb").textContent = `Wizard / step ${step}`;
  renderStep();
  renderRight();
}

function setRightTab(t) {
  rightTab = t;
  document.querySelectorAll(".tab2").forEach(b => b.classList.toggle("active", b.dataset.tab === t));
  renderRight();
}

function renderStep() {
  const t = state.type;
  const x = state.item;
  const area = el("stepArea");
  area.innerHTML = "";

  if (step === 1) {
    area.append(row("slug", input("slug", x.slug, v => x.slug = v)));
    if (t === "people") area.append(row("name", input("name", x.name, v => x.name = v)));
    if (t === "movies") area.append(row("title", input("title", x.title, v => x.title = v)));
    if (t === "timeline") area.append(row("title", input("title", x.title, v => x.title = v)));
    area.append(help("Slug: lowercase, a-z0-9, dash; unique."));

    const btn = button("Validate", async () => await runValidate());
    btn.classList.add("btn");
    area.append(btn);
  }

  if (step === 2) {
    if (t === "people") {
      area.append(row("role", input("role", x.role, v => x.role = v)));
      area.append(row("summary", textarea("summary", x.summary, v => x.summary = v)));
      area.append(row("birthYear", input("birthYear", x.birthYear ?? "", v => x.birthYear = v === "" ? null : Number(v))));
      area.append(row("deathYear", input("deathYear", x.deathYear ?? "", v => x.deathYear = v === "" ? null : Number(v))));
    }
    if (t === "movies") {
      area.append(row("year", input("year", String(x.year), v => x.year = Number(v))));
      area.append(row("format", input("format", x.format, v => x.format = v)));
      area.append(row("summary", textarea("summary", x.summary, v => x.summary = v)));
    }
    if (t === "timeline") {
      area.append(row("track", input("track", x.track, v => x.track = v)));
      area.append(row("year", input("year", String(x.year), v => x.year = Number(v))));
      area.append(row("summary", textarea("summary", x.summary, v => x.summary = v)));
    }
  }

  if (step === 3) {
    area.append(help("Mindestens 1 Quelle ist Pflicht."));
    const list = document.createElement("div");
    (x.sources || []).forEach((s, idx) => {
      const box = document.createElement("div");
      box.className = "suggest";
      box.append(row("title", input(`s_title_${idx}`, s.title || "", v => s.title = v)));
      box.append(row("url", input(`s_url_${idx}`, s.url || "", v => s.url = v)));
      box.append(row("accessedAt", input(`s_acc_${idx}`, s.accessedAt || "", v => s.accessedAt = v)));
      const rm = button("remove", () => { x.sources.splice(idx, 1); renderStep(); renderRight(); });
      rm.className = "btn btn-ghost";
      box.append(rm);
      list.append(box);
    });
    area.append(list);

    const add = button("+ source", () => {
      x.sources.push({ title: "", url: "", accessedAt: "" });
      renderStep();
    });
    add.className = "btn";
    area.append(add);
  }

  if (step === 4) {
    area.append(tagEditor());

    area.append(help("Links: label+url (optional)."));
    const links = document.createElement("div");
    (x.links || []).forEach((l, idx) => {
      const box = document.createElement("div");
      box.className = "suggest";
      box.append(row("label", input(`l_label_${idx}`, l.label || "", v => l.label = v)));
      box.append(row("url", input(`l_url_${idx}`, l.url || "", v => l.url = v)));
      const rm = button("remove", () => { x.links.splice(idx, 1); renderStep(); renderRight(); });
      rm.className = "btn btn-ghost";
      box.append(rm);
      links.append(box);
    });
    area.append(links);

    const addLink = button("+ link", () => {
      x.links.push({ label: "", url: "" });
      renderStep();
    });
    addLink.className = "btn";
    area.append(addLink);

    if (t === "movies") area.append(peoplePicker("people", x.people || [], state.indexes.people));
    if (t === "timeline") {
      area.append(peoplePicker("people", x.people || [], state.indexes.people));
      area.append(moviePicker("movies", x.movies || [], state.indexes.movies));
    }
  }

  if (step === 5) {
    const aiBox = document.createElement("div");
    aiBox.className = "suggest";
    aiBox.innerHTML = `<div class="small muted">AI marker (optional)</div>`;
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = !!x.meta?.ai?.used;
    chk.addEventListener("change", () => {
      x.meta = x.meta || {};
      x.meta.ai = x.meta.ai || {};
      x.meta.ai.used = chk.checked;
      renderRight();
    });
    aiBox.append(chk);
    aiBox.append(document.createTextNode(" ai.used"));
    area.append(aiBox);

    const validateBtn = button("Validate", async () => await runValidate());
    validateBtn.className = "btn btn-ghost";
    area.append(validateBtn);

    const saveBtn = button("Save → PR", async () => await runSave());
    saveBtn.className = "btn";
    area.append(saveBtn);

    if (state.lastSaved?.prUrl) {
      const ok = document.createElement("div");
      ok.className = "suggest";
      ok.innerHTML = `<div class="good">Success</div><div><a href="${state.lastSaved.prUrl}" target="_blank" rel="noopener">Open PR</a></div>`;
      area.append(ok);
    }
  }
}

function row(labelTxt, control) {
  const d = document.createElement("div");
  d.className = "row";
  const l = document.createElement("label");
  l.textContent = labelTxt;
  d.append(l);
  d.append(control);
  return d;
}

function input(id, value, onInput) {
  const i = document.createElement("input");
  i.className = "input";
  i.id = id;
  i.value = value ?? "";
  i.addEventListener("input", () => { onInput(i.value); renderRight(); });
  return i;
}

function textarea(id, value, onInput) {
  const t = document.createElement("textarea");
  t.className = "input";
  t.id = id;
  t.value = value ?? "";
  t.addEventListener("input", () => { onInput(t.value); renderRight(); });
  return t;
}

function button(text, onClick) {
  const b = document.createElement("button");
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}

function help(text) {
  const p = document.createElement("div");
  p.className = "muted small";
  p.textContent = text;
  return p;
}

function renderRight() {
  const area = el("rightArea");
  area.innerHTML = "";

  const x = state.item;

  if (rightTab === "preview") {
    area.append(kv("type", state.type));
    area.append(kv("slug", x.slug || "—"));
    if (state.type === "people") area.append(kv("name", x.name || "—"));
    if (state.type === "movies") area.append(kv("title", x.title || "—"));
    if (state.type === "timeline") area.append(kv("title", x.title || "—"));
    area.append(kv("tags", (x.tags || []).join(", ") || "—"));
    area.append(kv("sources", String((x.sources || []).length)));
  }

  if (rightTab === "diff") {
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(x, null, 2);
    area.append(pre);
  }

  if (rightTab === "issues") {
    const v = state.validation;
    if (!v) {
      area.append(help("No validation yet."));
      return;
    }
    const e = v.errors || [];
    const w = v.warnings || [];
    const box = document.createElement("div");
    box.className = "suggest";
    box.innerHTML = `<div class="${e.length ? "bad" : "good"}">${e.length ? "Errors" : "No Errors"}</div>`;
    const ul = document.createElement("ul");
    ul.className = "list";
    e.forEach(x => {
      const li = document.createElement("li");
      li.textContent = `${x.code}: ${x.message}`;
      ul.append(li);
    });
    box.append(ul);
    area.append(box);

    const box2 = document.createElement("div");
    box2.className = "suggest";
    box2.innerHTML = `<div class="${w.length ? "warn" : "muted"}">${w.length ? "Warnings" : "No Warnings"}</div>`;
    const ul2 = document.createElement("ul");
    ul2.className = "list";
    w.forEach(x => {
      const li = document.createElement("li");
      li.textContent = `${x.code}: ${x.message}`;
      ul2.append(li);
    });
    box2.append(ul2);
    area.append(box2);
  }
}

function kv(k, v) {
  const d = document.createElement("div");
  d.className = "kv";
  const a = document.createElement("div"); a.className = "muted"; a.textContent = k;
  const b = document.createElement("div"); b.textContent = v;
  d.append(a, b);
  return d;
}

function tagEditor() {
  const box = document.createElement("div");
  box.className = "suggest";
  box.innerHTML = `<div class="small muted">Tags (nur aus tags.json)</div>`;

  const wrap = document.createElement("div");
  wrap.className = "autobox";

  const inp = document.createElement("input");
  inp.className = "input";
  inp.placeholder = "type 2+ chars…";

  const drop = document.createElement("div");
  drop.className = "drop";

  let active = -1;
  let hits = [];

  const renderDrop = () => {
    drop.innerHTML = "";
    hits.slice(0, 8).forEach((t, idx) => {
      const o = document.createElement("div");
      o.className = "opt" + (idx === active ? " active" : "");
      o.textContent = `${t.label} (${t.slug})`;
      o.addEventListener("click", () => addTag(t.slug));
      drop.append(o);
    });
    drop.classList.toggle("show", hits.length > 0);
  };

  const addTag = (slug) => {
    state.item.tags = state.item.tags || [];
    if (!state.item.tags.includes(slug)) state.item.tags.push(slug);
    inp.value = "";
    hits = [];
    active = -1;
    renderDrop();
    renderStep();
    renderRight();
  };

  let timer = null;
  inp.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = inp.value.trim().toLowerCase();
      if (q.length < 2) { hits = []; active = -1; renderDrop(); return; }
      hits = state.indexes.tags
        .filter(t => t.slug.toLowerCase().includes(q) || t.label.toLowerCase().includes(q))
        .sort((a,b)=>a.label.localeCompare(b.label,"de"));
      active = hits.length ? 0 : -1;
      renderDrop();
    }, 150);
  });

  inp.addEventListener("keydown", (e) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active+1, Math.min(7, hits.length-1)); renderDrop(); }
    if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active-1, 0); renderDrop(); }
    if (e.key === "Enter") { e.preventDefault(); if (active >= 0) addTag(hits[active].slug); }
    if (e.key === "Escape") { hits = []; active = -1; renderDrop(); }
  });

  wrap.append(inp, drop);
  box.append(wrap);

  const pills = document.createElement("div");
  (state.item.tags || []).forEach(t => {
    const p = document.createElement("span");
    p.className = "pill";
    p.textContent = t;
    p.title = "click to remove";
    p.style.cursor = "pointer";
    p.addEventListener("click", () => {
      state.item.tags = state.item.tags.filter(x => x !== t);
      renderStep();
      renderRight();
    });
    pills.append(p);
  });
  box.append(pills);

  return box;
}

function peoplePicker(label, arr) {
  const box = document.createElement("div");
  box.className = "suggest";
  box.innerHTML = `<div class="small muted">${label}</div>`;
  const inp = document.createElement("input");
  inp.className = "input";
  inp.placeholder = "person slug…";
  const add = button("+", () => {
    const v = inp.value.trim();
    if (!v) return;
    if (!arr.includes(v)) arr.push(v);
    inp.value = "";
    renderStep(); renderRight();
  });
  add.className = "btn btn-ghost";
  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "8px";
  row.append(inp, add);
  box.append(row);

  const ul = document.createElement("ul");
  ul.className = "list";
  arr.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = s;
    li.style.cursor = "pointer";
    li.title = "click to remove";
    li.addEventListener("click", () => { arr.splice(i,1); renderStep(); renderRight(); });
    ul.append(li);
  });
  box.append(ul);
  return box;
}

function moviePicker(label, arr) {
  const box = document.createElement("div");
  box.className = "suggest";
  box.innerHTML = `<div class="small muted">${label}</div>`;
  const inp = document.createElement("input");
  inp.className = "input";
  inp.placeholder = "movie slug…";
  const add = button("+", () => {
    const v = inp.value.trim();
    if (!v) return;
    if (!arr.includes(v)) arr.push(v);
    inp.value = "";
    renderStep(); renderRight();
  });
  add.className = "btn btn-ghost";
  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "8px";
  row.append(inp, add);
  box.append(row);

  const ul = document.createElement("ul");
  ul.className = "list";
  arr.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = s;
    li.style.cursor = "pointer";
    li.title = "click to remove";
    li.addEventListener("click", () => { arr.splice(i,1); renderStep(); renderRight(); });
    ul.append(li);
  });
  box.append(ul);
  return box;
}

async function runValidate() {
  if (!me) return alert("Login required");
  try {
    const v = await api("/validate", { method: "POST", body: { type: state.type, item: state.item } });
    state.validation = v;
    if (v.normalized) state.item = v.normalized;
    renderStep(); renderRight();
    if (v.errors?.length) alert("Validation errors (see Errors tab).");
  } catch (e) {
    console.error(e);
    alert(`Validate failed: ${e.status}`);
  }
}

async function runSave() {
  if (!me) return alert("Login required");
  await runValidate();
  if (state.validation?.errors?.length) return;

  try {
    const r = await api("/github/pr", { method: "POST", body: { type: state.type, item: state.item } });
    state.lastSaved = r;
    renderStep(); renderRight();
  } catch (e) {
    console.error(e);
    const msg = e.json?.errors?.[0]?.message || e.json?.error || e.text || "unknown";
    alert(`Save failed: ${msg}`);
  }
}

el("type").addEventListener("change", () => {
  state.type = el("type").value;
  state.item = baseItem(state.type);
  state.validation = null;
  state.lastSaved = null;
  setStep(1);
});

document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => setStep(Number(b.dataset.step))));
document.querySelectorAll(".tab2").forEach(b => b.addEventListener("click", () => setRightTab(b.dataset.tab)));

el("prev").addEventListener("click", () => setStep(step - 1));
el("next").addEventListener("click", () => setStep(step + 1));

el("btnLogin").addEventListener("click", () => {
  window.location.href = BACKEND + "/auth/login";
});
el("btnLogout").addEventListener("click", async () => {
  try { await api("/auth/logout", { method: "POST", body: {} }); } catch {}
  await refreshMe();
});

(async function init(){
  await refreshMe();
  if (me) await loadIndexes();
  setStep(1);
  setRightTab("preview");
})();

