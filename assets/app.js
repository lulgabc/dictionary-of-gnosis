/* ============================================================
   Dictionary of Gnosis & Western Esotericism — reader app
   Data: window.DOGWE (generated from the PDF)
   ============================================================ */
(function () {
  "use strict";

  const DATA = window.DOGWE;
  const loader = document.getElementById("loader");
  if (!DATA) {
    loader.innerHTML = "<p>The dictionary data could not be loaded.</p>";
    return;
  }

  const MOTION_LINKS = {
    "boehme-jacob": ["motion/boehme/", "Motion study"],
    "dee-john": ["motion/pilot/#dee", "Pilot animation"],
    "alchemy-i-introduction": ["motion/pilot/#alchemy", "Pilot animation"],
    "astrology-i-introduction": ["motion/pilot/#astrology", "Pilot animation"],
    "gnosticism-i-gnostic-religion": ["motion/pilot/#gnosticism", "Pilot animation"],
    "hermetic-literature-i-antiquity": ["motion/pilot/#hermetic", "Pilot animation"],
    "freemasonry": ["motion/pilot/#freemasonry", "Pilot animation"],
    "theosophical-society": ["motion/pilot/#theosophy", "Pilot animation"],
    "ufo-traditions": ["motion/pilot/#ufo", "Pilot animation"],
  };

  const { meta, groups, entries } = DATA;
  const main = document.getElementById("main");
  const sidebar = document.getElementById("sidebar");
  const entryList = document.getElementById("entryList");
  const alphaRail = document.getElementById("alphaRail");
  const indexCount = document.getElementById("indexCount");
  const crumbs = document.getElementById("crumbs");
  const searchInput = document.getElementById("searchInput");
  const searchWrap = document.querySelector(".search-wrap");
  const clearSearchBtn = document.getElementById("clearSearch");
  const scrim = document.getElementById("scrim");
  const menuBtn = document.getElementById("menuBtn");
  const themeBtn = document.getElementById("themeBtn");
  const biBtn = document.getElementById("biBtn");
  const randomBtn = document.getElementById("randomBtn");
  const aboutBtn = document.getElementById("aboutBtn");
  const aboutModal = document.getElementById("aboutModal");
  const aboutClose = document.getElementById("aboutClose");
  const aboutStats = document.getElementById("aboutStats");
  const aboutCoverage = document.getElementById("aboutCoverage");

  const entryById = new Map(entries.map(e => [e.id, e]));
  const groupById = new Map(groups.map(g => [g.id, g]));
  const entryIndex = new Map(entries.map((e, i) => [e.id, i]));
  const state = {
    letter: "ALL",
    activeId: null,
    query: "",
    lastFocus: null,
    bilingual: (() => {
      try { return localStorage.getItem("dogwe-bilingual") === "1"; } catch (e) { return false; }
    })(),
  };

  /* ---------- small utilities ---------- */

  const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => HTML_ESCAPES[c]);
  }
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function normKey(s) {
    return String(s || "")
      .replace(/[\ufb00-\ufb06]/g, c => ({ "\ufb00":"ff","\ufb01":"fi","\ufb02":"fl","\ufb03":"ffi","\ufb04":"ffl","\ufb05":"st","\ufb06":"st" }[c] || c))
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\u4e00-\u9fff a-z0-9]+/g, " ")
      .trim();
  }
  function textOf(e) {
    if (e._plain == null) {
      const zh = (e.title_zh || "") + " " + e.body.map(p => p.zh || "").join("\n\n");
      e._plain = e.body.map(p => p.text).join("\n\n") +
        (e.bib.length ? "\n\n" + e.bib.map(p => p.text).join("\n\n") : "") +
        (zh.trim() ? "\n\n" + zh : "");
    }
    return e._plain;
  }
  function haystack(e) {
    if (e._hay == null) {
      e._hay = normKey(
        e.title + " " + (e.title_zh || "") + " " + e.heading + " " +
        e.body.map(p => (p.text || "") + " " + (p.zh || "")).join(" ") + " " +
        (e.xref || "") + " " + textOf(e)
      );
    }
    return e._hay;
  }
  function countOccurrences(hay, needle, cap) {
    if (!needle) return 0;
    let n = 0, i = 0;
    while (n < cap && (i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
    return n;
  }
  function letterCounts() {
    const counts = {};
    for (const e of entries) counts[e.letter] = (counts[e.letter] || 0) + 1;
    return counts;
  }
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const counts = letterCounts();

  /* ---------- cross-reference target index ---------- */

  const targetIndex = new Map();
  function addTarget(key, target) {
    if (!key || targetIndex.has(key)) return;
    targetIndex.set(key, target);
  }
  for (const e of entries) {
    addTarget(normKey(e.title), { kind: "entry", id: e.id });
    if (e.title_zh) addTarget(normKey(e.title_zh), { kind: "entry", id: e.id });
    if (e.xref_id) addTarget(normKey(e.xref), { kind: "entry", id: e.xref_id });
    if (e.xref_group) addTarget(normKey(e.xref), { kind: "group", id: e.xref_group });
  }
  for (const g of groups) addTarget(normKey(g.name), { kind: "group", id: g.id });

  function lookupTarget(raw) {
    let key = normKey(raw);
    if (!key) return null;
    if (targetIndex.has(key)) return targetIndex.get(key);
    // tolerate a trailing parenthesis or bracket captured from the sentence
    key = key.replace(/\s+(.)$/, (m, c) => (c === ")" || c === "]" ? "" : m));
    return targetIndex.get(key) || null;
  }

  /* ---------- linkify arrows ---------- */

  function linkify(text) {
    let out = "";
    let i = 0;
    while (i < text.length) {
      const arrow = text.indexOf("→", i);
      if (arrow === -1) { out += escapeHtml(text.slice(i)); break; }
      out += escapeHtml(text.slice(i, arrow));

      const tailStart = arrow + 1;
      const tail = text.slice(tailStart, tailStart + 120);
      const wordEnds = [];
      const wordRe = /\S+/g;
      let m;
      while ((m = wordRe.exec(tail)) && wordEnds.length < 10) {
        wordEnds.push(m.index + m[0].length);
      }

      let found = null;
      for (let n = wordEnds.length; n >= 1; n--) {
        const cand = tail.slice(0, wordEnds[n - 1]).replace(/\s+$/, "");
        if (!cand) continue;
        let target = lookupTarget(cand);
        let clean = cand;
        if (target) {
          // do not swallow a sentence bracket/punctuation into the link
          clean = cand.replace(/[.,;:!?\]»”’]+$/, "");
        } else {
          clean = cand.replace(/[.,;:!?\]»”’]+$/, "");
          target = lookupTarget(clean);
        }
        if (target) { found = { text: clean, target }; break; }
      }

      if (found) {
        const leading = (tail.match(/^\s*/) || [""])[0];
        out += "→" + escapeHtml(leading) +
          `<a href="#/${found.target.kind}/${encodeURIComponent(found.target.id)}" ` +
          `data-${found.target.kind}="${escapeHtml(found.target.id)}">` +
          escapeHtml(found.text.trim()) + `</a>`;
        i = tailStart + found.text.length;
      } else {
        out += "→";
        i = arrow + 1;
      }
    }
    return out;
  }

  /* ---------- navigation ---------- */

  function navigate(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }
  function setCrumbs(parts) {
    crumbs.innerHTML = parts.map((p, i) => {
      const sep = i ? `<span class="sep">/</span>` : "";
      const body = p.href
        ? `<a href="${p.href}">${escapeHtml(p.label)}</a>`
        : `<span class="${p.current ? "current" : ""}">${escapeHtml(p.label)}</span>`;
      return sep + body;
    }).join("");
  }
  function closeDrawer() {
    sidebar.classList.remove("is-open");
    scrim.hidden = true;
    document.body.classList.remove("drawer-open");
  }
  function openDrawer() {
    sidebar.classList.add("is-open");
    scrim.hidden = false;
    document.body.classList.add("drawer-open");
  }
  function isMobile() {
    return window.matchMedia("(max-width: 860px)").matches;
  }

  /* ---------- sidebar ---------- */

  function renderAlphaRail() {
    let html = `<button class="alpha-btn all${state.letter === "ALL" ? " is-active" : ""}" data-letter="ALL" type="button">All</button>`;
    for (const L of LETTERS) {
      const n = counts[L] || 0;
      html += `<button class="alpha-btn${state.letter === L ? " is-active" : ""}" data-letter="${L}" type="button" title="${n} entries">${L}</button>`;
    }
    alphaRail.innerHTML = html;
  }

  function renderEntryList() {
    const filtered = state.letter === "ALL" || state.letter === "ALL"
      ? entries
      : entries.filter(e => e.letter === state.letter);
    let html = "";
    let lastGroup = null;
    for (const e of filtered) {
      if (e.group && e.group !== lastGroup) {
        html += `<div class="group-label"><button type="button" data-group-link="${escapeHtml(e.group_id)}">${escapeHtml(e.group)}</button></div>`;
      }
      if (!e.group) lastGroup = null; else lastGroup = e.group;
      html += `<button class="entry-item${e.xref ? " is-xref" : ""}${e.group ? " is-child" : ""}${e.id === state.activeId ? " is-active" : ""}" ` +
        `type="button" data-entry-link="${escapeHtml(e.id)}"${e.id === state.activeId ? ' aria-current="page"' : ""}>` +
        `<span class="e-title">${escapeHtml(e.title)}${state.bilingual && e.title_zh ? `<span class="e-zh" lang="zh-Hans">${escapeHtml(e.title_zh)}</span>` : ""}</span>${e.xref ? '<span class="e-arrow">→</span>' : ""}</button>`;
    }
    entryList.innerHTML = html;
    indexCount.textContent = `${filtered.length}`;
    if (state.activeId) {
      const active = entryList.querySelector(".is-active");
      if (active) active.scrollIntoView({ block: "nearest" });
    }
  }

  function setActive(id) {
    state.activeId = id;
    entryList.querySelectorAll(".entry-item").forEach(el => {
      const on = el.dataset.entryLink === id;
      el.classList.toggle("is-active", on);
      if (on) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
  }

  /* ---------- home ---------- */

  function renderHome() {
    state.activeId = null;
    setActive(null);
    document.title = "Dictionary of Gnosis & Western Esotericism";
    setCrumbs([{ label: "Dictionary", current: true }]);

    let alpha = "";
    for (const L of LETTERS) {
      const n = counts[L] || 0;
      alpha += `<a class="alpha-card${n ? "" : " is-empty"}" href="#/letter/${L}"><span class="letter">${L}</span><span class="count">${n}</span></a>`;
    }

    // full table of contents, grouped by letter
    let toc = "";
    for (const L of LETTERS) {
      const list = entries.filter(e => e.letter === L);
      if (!list.length) continue;
      toc += `<div class="toc-letter"><h3>${L}<span>${list.length}</span></h3><ul>`;
      let lastGroup = null;
      for (const e of list) {
        if (e.group && e.group !== lastGroup) {
          toc += `<li class="toc-group"><a href="#/group/${encodeURIComponent(e.group_id)}">${escapeHtml(e.group)}</a></li>`;
        }
        if (!e.group) lastGroup = null; else lastGroup = e.group;
        toc += `<li><a class="${e.xref ? "is-xref" : ""}" href="#/entry/${encodeURIComponent(e.id)}">${escapeHtml(e.title)}${e.xref ? " →" : ""}</a></li>`;
      }
      toc += `</ul></div>`;
    }

    main.innerHTML = `
      <div class="home">
        <section class="hero">
          <p class="eyebrow">Brill · Leiden · Boston · 2006</p>
          <h1>Dictionary of Gnosis<br><em>&amp; Western Esotericism</em></h1>
          <p class="lede">Edited by <b>Wouter J. Hanegraaff</b> in collaboration with Antoine Faivre, Roelof van den Broek and Jean-Pierre Brach. A complete reading edition of all <b>${meta.entry_count}</b> headwords, from Late Antiquity to the present.</p>
          <ul class="stats">
            <li><span class="n">${meta.section_count}</span><span class="l">Dictionary entries</span></li>
            <li><span class="n">${meta.crossref_count}</span><span class="l">See-references</span></li>
            <li><span class="n">${meta.source_pages.toLocaleString()}</span><span class="l">Pages of text</span></li>
            <li><span class="n">${Math.round(meta.word_count / 1000).toLocaleString()}k</span><span class="l">Words</span></li>
          </ul>
          <div class="hero-actions">
            <a class="btn primary" href="#/letter/A">Browse the dictionary</a>
            <button class="btn" type="button" id="heroRandom">Surprise me</button>
            <a class="btn" href="motion/pilot/">Motion pilot</a>
            <button class="btn" type="button" id="heroAbout">About the text</button>
          </div>
          ${meta.translation ? `<p class="hero-zh">${meta.translation.translated_entries >= meta.translation.total_entries ? "中文翻译已完成" : "中文翻译进行中"}：${meta.translation.translated_entries} / ${meta.translation.total_entries} 条正文词条 · <a href="#/entry/astrology-i-introduction">${meta.translation.translated_entries >= meta.translation.total_entries ? "开始阅读双语对照" : "查看双语示例"} →</a></p>` : ""}
        </section>

        <div class="section-head"><h2>Alphabetical index</h2><span class="hint">${entries.length} headwords</span></div>
        <div class="alpha-grid">${alpha}</div>

        <div class="section-head"><h2>Table of contents</h2><span class="hint">All ${entries.length} headwords</span></div>
        <div class="toc">${toc}</div>

        <div class="colophon">
          <span>Digitised from the 2006 Brill edition · ${meta.source_pages.toLocaleString()} pages</span>
          <span>${meta.section_count} entries · ${meta.crossref_count} see-references · ${meta.word_count.toLocaleString()} words${meta.translation ? ` · 中文 ${meta.translation.translated_entries}/${meta.translation.total_entries}` : ""}</span>
        </div>
      </div>`;

    main.querySelector("#heroRandom").addEventListener("click", openRandom);
    main.querySelector("#heroAbout").addEventListener("click", openAbout);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ---------- letter / group pages ---------- */

  function renderLetter(letter) {
    const L = (letter || "").toUpperCase();
    const list = entries.filter(e => e.letter === L);
    state.activeId = null;
    setActive(null);
    setCrumbs([{ label: "Dictionary", href: "#/" }, { label: L, current: true }]);
    document.title = `${L} — Dictionary of Gnosis & Western Esotericism`;

    const cards = list.map(e => `
      <a class="entry-card${e.xref ? " is-xref" : ""}" href="#/entry/${encodeURIComponent(e.id)}">
        <div class="t">${escapeHtml(e.title)}${e.xref ? " →" : ""}${state.bilingual && e.title_zh ? `<span class="card-zh" lang="zh-Hans">${escapeHtml(e.title_zh)}</span>` : ""}</div>
        <div class="m">${e.group ? escapeHtml(e.group) + " · " : ""}${e.xref ? "see reference" : e.allwords.toLocaleString() + " words"}</div>
      </a>`).join("");

    main.innerHTML = `
      <div class="page-head">
        <p class="eyebrow">Alphabetical index</p>
        <h1>${escapeHtml(L)}</h1>
        <p>${list.length} headword${list.length === 1 ? "" : "s"} beginning with ${escapeHtml(L)}.</p>
      </div>
      <div class="entry-cards">${cards || '<p class="empty">No entries in this letter.</p>'}</div>`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderGroup(id) {
    const group = groupById.get(id);
    if (!group) { renderHome(); return; }
    const list = entries.filter(e => e.group_id === id);
    state.activeId = null;
    setActive(null);
    setCrumbs([{ label: "Dictionary", href: "#/" }, { label: group.name, current: true }]);
    document.title = `${group.name} — Dictionary of Gnosis & Western Esotericism`;

    const cards = list.map(e => `
      <a class="entry-card" href="#/entry/${encodeURIComponent(e.id)}">
        <div class="t">${escapeHtml(e.title)}${state.bilingual && e.title_zh ? `<span class="card-zh" lang="zh-Hans">${escapeHtml(e.title_zh)}</span>` : ""}</div>
        <div class="m">${e.allwords.toLocaleString()} words</div>
      </a>`).join("");

    main.innerHTML = `
      <div class="page-head">
        <p class="eyebrow">Section of the dictionary</p>
        <h1>${escapeHtml(group.name)}</h1>
        <p>${list.length} part${list.length === 1 ? "" : "s"}.</p>
      </div>
      <div class="entry-cards">${cards}</div>`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ---------- entry ---------- */

  function subtitleFor(e) {
    if (e.xref) return "";
    const h = e.heading || "";
    if (h.startsWith(e.title)) {
      return h.slice(e.title.length).replace(/^[\s,;]+/, "").trim();
    }
    const star = h.search(/[\*†]/);
    if (star > -1) return h.slice(star).replace(/^[\s,;]+/, "").trim();
    return "";
  }

  function looksLikeOutline(text) {
    if (text.length > 700) return false;
    const hits = (text.match(/(?:^|\s)(?:\d+|[A-Z])\.\s/g) || []).length;
    return hits >= 3;
  }

  function hasTranslation(e) {
    return e.translation_status === "complete" &&
      Array.isArray(e.body) && e.body.some(p => p.zh);
  }

  function normalBodyHtml(e) {
    let html = "";
    e.body.forEach((p, i) => {
      if (p.type === "subhead") {
        html += `<h3>${escapeHtml(p.text)}</h3>`;
      } else {
        let cls = "";
        if (i === 0) cls = looksLikeOutline(p.text) ? "entry-outline" : "dropcap";
        html += `<p${cls ? ` class="${cls}"` : ""}>${linkify(p.text)}</p>`;
      }
    });
    return html || `<p class="empty">No text was extracted for this entry.</p>`;
  }

  function bilingualBodyHtml(e) {
    let html = `<div class="bi-grid">`;
    e.body.forEach((p, i) => {
      const zh = p.zh || "";
      if (p.type === "subhead") {
        html += `<div class="bi-pair bi-pair-subhead">
          <h3 class="bi-en">${escapeHtml(p.text)}</h3>
          <h3 class="bi-zh" lang="zh-Hans">${zh ? escapeHtml(zh) : '<span class="bi-missing">译文待补</span>'}</h3>
        </div>`;
      } else {
        const isOutline = i === 0 && looksLikeOutline(p.text);
        let cls = "";
        if (i === 0 && !isOutline) cls = "dropcap";
        html += `<div class="bi-pair${isOutline ? " bi-pair-outline" : ""}">
          <p class="bi-en${cls ? " " + cls : ""}">${linkify(p.text)}</p>
          <p class="bi-zh" lang="zh-Hans">${zh ? linkify(zh) : '<span class="bi-missing">译文待补</span>'}</p>
        </div>`;
      }
    });
    html += `</div>`;
    return `<p class="bi-note">左：英文原文 · 右：中文译文 <span>AI 辅助初稿</span></p>` + html;
  }

  function renderEntry(id) {
    const e = entryById.get(id);
    if (!e) {
      main.innerHTML = `<div class="empty"><div class="big">?</div><p>That entry could not be found.</p><p><a href="#/">Return to the dictionary</a></p></div>`;
      return;
    }
    state.activeId = e.id;
    setActive(e.id);
    document.title = `${e.title} — Dictionary of Gnosis & Western Esotericism`;

    const crumbParts = [{ label: "Dictionary", href: "#/" }, { label: e.letter, href: "#/letter/" + e.letter }];
    if (e.group) crumbParts.push({ label: e.group, href: "#/group/" + e.group_id });
    crumbParts.push({ label: e.title, current: true });
    setCrumbs(crumbParts);

    const sub = subtitleFor(e);
    const metaBits = [`<span><b>Page</b> ${e.page}</span>`];
    if (!e.xref) metaBits.push(`<span><b>Words</b> ${e.allwords.toLocaleString()}</span>`);
    metaBits.push(`<span><b>Letter</b> ${escapeHtml(e.letter)}</span>`);
    if (e.group) metaBits.push(`<span><b>Section</b> ${escapeHtml(e.group)}</span>`);
    if (!e.xref) {
      metaBits.push(`<span><b>中文</b> ${e.translation_status === "complete" ? "已译" : "待补"}</span>`);
      if (e.translated_chars) metaBits.push(`<span><b>中文字数</b> ${e.translated_chars.toLocaleString()}</span>`);
    }

    const hasZh = hasTranslation(e);
    const showBi = state.bilingual && hasZh && !e.xref;
    let bodyHtml = "";
    if (e.xref) {
      const target = e.xref_id ? entryById.get(e.xref_id) : null;
      const targetGroup = e.xref_group ? groupById.get(e.xref_group) : null;
      const label = state.bilingual ? "参见" : "See reference";
      const targetHtml = target
        ? `<a href="#/entry/${encodeURIComponent(target.id)}" data-entry="${escapeHtml(target.id)}">${
            state.bilingual && target.title_zh ? escapeHtml(target.title_zh) : escapeHtml(target.title)
          }</a>${state.bilingual && target.title_zh ? `<span class="xref-en">${escapeHtml(target.title)}</span>` : ""}`
        : targetGroup
          ? `<a href="#/group/${encodeURIComponent(targetGroup.id)}" data-group="${escapeHtml(targetGroup.id)}">${escapeHtml(targetGroup.name)}</a>`
          : `<span>${escapeHtml(e.xref)}</span>`;
      bodyHtml = `<div class="xref-card"><span class="xref-label">${label}</span>${targetHtml}</div>`;
    } else if (showBi) {
      bodyHtml = bilingualBodyHtml(e);
    } else {
      if (state.bilingual && !hasZh) {
        const tr = meta.translation || {};
        bodyHtml += `<div class="bi-notice"><strong>本词条中文译文尚未加入。</strong>当前显示英文原文。${
          tr.total_entries ? ` 中文翻译进度：${tr.translated_entries} / ${tr.total_entries} 条正文词条。` : ""
        }</div>`;
      }
      bodyHtml += normalBodyHtml(e);
    }

    let bibHtml = "";
    if (e.bib && e.bib.length) {
      bibHtml = `<section class="bib"><h2>Bibliography</h2>` +
        (state.bilingual && hasZh ? `<p class="bib-note">${escapeHtml(e.bib_note_zh || "书目保留原文。")}</p>` : "") +
        e.bib.map(p => p.type === "bib-subhead"
          ? `<h3 class="bib-subhead">${escapeHtml(p.text)}</h3>`
          : `<p>${linkify(p.text)}</p>`).join("") + `</section>`;
    }

    const authorHtml = e.author ? `<p class="author">${escapeHtml(e.author)}</p>` : "";

    const idx = entryIndex.get(e.id);
    const prev = idx > 0 ? entries[idx - 1] : null;
    const next = idx < entries.length - 1 ? entries[idx + 1] : null;
    const navHtml = `<footer class="entry-nav">
      ${prev ? `<a href="#/entry/${encodeURIComponent(prev.id)}"><span class="dir">← Previous</span><span>${escapeHtml(prev.title)}</span></a>` : "<span></span>"}
      ${next ? `<a class="next" href="#/entry/${encodeURIComponent(next.id)}"><span class="dir">Next →</span><span>${escapeHtml(next.title)}</span></a>` : "<span></span>"}
    </footer>`;

    main.innerHTML = `
      <article class="entry${state.bilingual && hasZh && !e.xref ? " bilingual" : ""}">
        <header class="entry-head">
          <div class="entry-kicker">
            ${e.group ? `<span class="pill">${escapeHtml(e.group)}</span>` : ""}
            <span>${e.xref ? "See reference" : "Dictionary entry"}</span>
            ${e.translation_status === "complete" ? `<span class="pill pill-zh">中文</span>` : (state.bilingual && !e.xref ? `<span class="pill pill-pending">中文待补</span>` : "")}
            ${MOTION_LINKS[e.id] ? `<a class="motion-link" href="${MOTION_LINKS[e.id][0]}">${MOTION_LINKS[e.id][1]} <span>→</span></a>` : ""}
          </div>
          <h1>${escapeHtml(e.title)}</h1>
          ${state.bilingual && e.title_zh ? `<p class="entry-title-zh" lang="zh-Hans">${escapeHtml(e.title_zh)}</p>` : ""}
          ${sub ? `<p class="entry-sub">${escapeHtml(sub)}</p>` : ""}
          <div class="entry-meta">${metaBits.join("")}</div>
        </header>
        <div class="prose">${bodyHtml}</div>
        ${bibHtml}
        ${authorHtml}
        ${navHtml}
      </article>`;

    window.scrollTo({ top: 0, behavior: "auto" });
    if (isMobile()) closeDrawer();
  }

  /* ---------- search ---------- */

  function plainSnippet(e, rawQuery, terms) {
    const plain = textOf(e);
    if (!plain) return e.xref ? `See ${e.xref}.` : "";
    const lower = plain.toLowerCase();
    let idx = lower.indexOf(rawQuery.toLowerCase());
    if (idx < 0) {
      for (const t of terms) {
        idx = lower.indexOf(t.toLowerCase());
        if (idx >= 0) break;
      }
    }
    let start = idx < 0 ? 0 : Math.max(0, idx - 90);
    let end = idx < 0 ? Math.min(plain.length, 260) : Math.min(plain.length, idx + 190);
    if (start > 0) {
      const space = plain.indexOf(" ", start);
      if (space > -1 && space < idx) start = space + 1;
    }
    if (end < plain.length) {
      const space = plain.lastIndexOf(" ", end);
      if (space > start) end = space;
    }
    let snippet = plain.slice(start, end).replace(/\s+/g, " ").trim();
    if (start > 0) snippet = "… " + snippet;
    if (end < plain.length) snippet += " …";

    let html = escapeHtml(snippet);
    const marks = new Set();
    for (const t of terms) {
      const tt = t.trim();
      if (tt.length < 2) continue;
      const re = new RegExp("(" + escapeRegExp(tt) + ")", "gi");
      html = html.replace(re, m => {
        const key = m.toLowerCase();
        if (marks.has(key)) return m;
        marks.add(key);
        return `<mark>${m}</mark>`;
      });
    }
    return html;
  }

  function runSearch(raw) {
    const q = raw.trim();
    state.query = q;
    if (!q) {
      setCrumbs([{ label: "Dictionary", href: "#/" }, { label: "Search", current: true }]);
      main.innerHTML = `<div class="search-page"><h1>Search</h1><p class="summary">Type a name, a current, a book or a word.</p></div>`;
      return;
    }
    const qn = normKey(q);
    let terms = qn.split(" ").filter(t => t.length > 0);
    if (terms.length > 1) terms = terms.filter(t => t.length > 1);
    if (!terms.length) terms = [qn];
    const rawTerms = q.split(/\s+/).filter(t => t.length > 1);
    const results = [];

    for (const e of entries) {
      const hay = haystack(e);
      if (!terms.every(t => hay.includes(t))) continue;
      let score = 0;
      const nt = normKey(e.title);
      if (nt === qn) score += 3000;
      else if (nt.startsWith(qn)) score += 1600;
      else if (nt.includes(qn)) score += 900;
      for (const t of terms) {
        score += countOccurrences(nt, t, 10) * 120;
        score += Math.min(40, countOccurrences(hay, t, 40));
      }
      if (e.xref) score -= 120;
      results.push({ e, score });
    }
    results.sort((a, b) => b.score - a.score || a.e.title.localeCompare(b.e.title));

    setCrumbs([{ label: "Dictionary", href: "#/" }, { label: "Search", current: true }]);
    const isCJK = /[\u4e00-\u9fff]/.test(q);
    const coverage = isCJK && meta.translation
      ? ` · 中文检索覆盖 ${meta.translation.translated_entries} / ${meta.translation.total_entries} 条已译词条`
      : "";
    const summary = (results.length
      ? `${results.length} result${results.length === 1 ? "" : "s"} for “${escapeHtml(q)}”`
      : `No results for “${escapeHtml(q)}”`) + coverage;

    const list = results.slice(0, 150).map(({ e }) => `
      <li class="result">
        <a class="title" href="#/entry/${encodeURIComponent(e.id)}">${escapeHtml(e.title)}</a>
        ${e.title_zh ? `<span class="result-zh" lang="zh-Hans">${escapeHtml(e.title_zh)}</span>` : ""}
        <span class="kind">${e.xref ? "see reference" : e.group ? escapeHtml(e.group) : "entry"}</span>
        <p class="snippet">${plainSnippet(e, q, rawTerms)}</p>
        <div class="more">${e.xref ? "Cross-reference" : `${e.allwords.toLocaleString()} words · p. ${e.page}`}</div>
      </li>`).join("");

    main.innerHTML = `
      <div class="search-page">
        <p class="eyebrow">Full-text search</p>
        <h1>Search</h1>
        <p class="summary" aria-live="polite">${summary}</p>
        ${results.length ? `<ul class="results">${list}</ul>` : `<div class="empty"><div class="big">∴</div><p>Try a shorter word, a name, or a subject such as “alchemy”, “Boehme” or “tarot”.</p></div>`}
        ${results.length > 150 ? `<p class="summary">Showing the first 150 results.</p>` : ""}
      </div>`;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function clearSearchInput(goHome) {
    searchInput.value = "";
    searchWrap.classList.remove("has-value");
    clearSearchBtn.hidden = true;
    state.query = "";
    if (goHome) navigate("#/");
  }
  function syncSearchClear() {
    const has = searchInput.value.length > 0;
    searchWrap.classList.toggle("has-value", has);
    clearSearchBtn.hidden = !has;
  }

  /* ---------- bilingual ---------- */

  function applyBiButton() {
    if (!biBtn) return;
    biBtn.setAttribute("aria-pressed", state.bilingual ? "true" : "false");
    biBtn.setAttribute("aria-label", state.bilingual ? "Switch back to original only" : "Show bilingual reading");
  }

  /* ---------- theme ---------- */

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("dogwe-theme", theme); } catch (e) {}
  }
  function initialTheme() {
    try {
      const saved = localStorage.getItem("dogwe-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  /* ---------- modal ---------- */

  function openAbout() {
    state.lastFocus = document.activeElement;
    aboutModal.hidden = false;
    document.body.style.overflow = "hidden";
    aboutClose.focus();
  }
  function closeAbout() {
    aboutModal.hidden = true;
    document.body.style.overflow = "";
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  function openRandom() {
    const pool = entries.filter(e => !e.xref);
    const e = pool[Math.floor(Math.random() * pool.length)];
    navigate("#/entry/" + e.id);
  }

  /* ---------- routing ---------- */

  function route() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [pathPart, queryPart] = raw.split("?");
    const parts = pathPart.split("/").filter(Boolean);
    const head = parts[0] || "";

    if (head === "entry" && parts[1]) {
      if (state.query) clearSearchInput(false);
      renderEntry(decodeURIComponent(parts[1]));
    } else if (head === "letter" && parts[1]) {
      if (state.query) clearSearchInput(false);
      renderLetter(decodeURIComponent(parts[1]));
    } else if (head === "group" && parts[1]) {
      if (state.query) clearSearchInput(false);
      renderGroup(decodeURIComponent(parts[1]));
    } else if (head === "search") {
      const q = new URLSearchParams(queryPart || "").get("q") || "";
      searchInput.value = q;
      syncSearchClear();
      runSearch(q);
    } else {
      if (state.query) clearSearchInput(false);
      renderHome();
    }
  }

  /* ---------- events ---------- */

  alphaRail.addEventListener("click", ev => {
    const btn = ev.target.closest("button[data-letter]");
    if (!btn) return;
    state.letter = btn.dataset.letter;
    renderAlphaRail();
    renderEntryList();
  });

  entryList.addEventListener("click", ev => {
    const groupBtn = ev.target.closest("button[data-group-link]");
    if (groupBtn) {
      navigate("#/group/" + groupBtn.dataset.groupLink);
      if (isMobile()) closeDrawer();
      return;
    }
    const btn = ev.target.closest("button[data-entry-link]");
    if (!btn) return;
    navigate("#/entry/" + btn.dataset.entryLink);
    if (isMobile()) closeDrawer();
  });

  menuBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("is-open")) closeDrawer(); else openDrawer();
  });
  scrim.addEventListener("click", closeDrawer);
  window.addEventListener("resize", () => { if (!isMobile()) closeDrawer(); });

  themeBtn.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  if (biBtn) {
    biBtn.addEventListener("click", () => {
      state.bilingual = !state.bilingual;
      try { localStorage.setItem("dogwe-bilingual", state.bilingual ? "1" : "0"); } catch (e) {}
      applyBiButton();
      renderEntryList();
      const raw = location.hash.replace(/^#\/?/, "");
      const y = window.scrollY;
      if (raw.startsWith("entry/") && state.activeId) {
        renderEntry(state.activeId);
        window.scrollTo({ top: y, behavior: "auto" });
      } else if (state.query) runSearch(state.query);
      else route();
    });
  }

  randomBtn.addEventListener("click", openRandom);
  aboutBtn.addEventListener("click", openAbout);
  aboutClose.addEventListener("click", closeAbout);
  aboutModal.addEventListener("click", ev => { if (ev.target === aboutModal) closeAbout(); });

  let searchTimer = null;
  searchInput.addEventListener("input", () => {
    syncSearchClear();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = searchInput.value.trim();
      if (!q) {
        if (state.query) { state.query = ""; route(); }
        return;
      }
      runSearch(q);
    }, 170);
  });
  searchInput.addEventListener("keydown", ev => {
    if (ev.key === "Enter") {
      const first = main.querySelector(".result a.title");
      if (first) { ev.preventDefault(); first.click(); }
    }
  });
  clearSearchBtn.addEventListener("click", () => {
    clearSearchInput(true);
    searchInput.focus();
  });

  document.addEventListener("keydown", ev => {
    const tag = (ev.target && ev.target.tagName || "").toLowerCase();
    const typing = tag === "input" || tag === "textarea" || (ev.target && ev.target.isContentEditable);
    if ((ev.key === "/" && !typing) || ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k")) {
      ev.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }
    if (ev.key === "Escape") {
      if (!aboutModal.hidden) { closeAbout(); return; }
      if (sidebar.classList.contains("is-open")) { closeDrawer(); return; }
      if (document.activeElement === searchInput && searchInput.value) {
        clearSearchInput(true);
        return;
      }
    }
    if (!typing && state.activeId && (ev.key === "[" || ev.key === "]")) {
      const idx = entryIndex.get(state.activeId);
      const next = idx + (ev.key === "]" ? 1 : -1);
      if (next >= 0 && next < entries.length) {
        ev.preventDefault();
        navigate("#/entry/" + entries[next].id);
      }
    }
  });

  window.addEventListener("hashchange", route);

  // pre-index the corpus quietly so the first search feels immediate
  function warmIndex() {
    let i = 0;
    function step() {
      const end = Math.min(entries.length, i + 12);
      for (; i < end; i++) haystack(entries[i]);
      if (i < entries.length) {
        if ("requestIdleCallback" in window) requestIdleCallback(step, { timeout: 800 });
        else setTimeout(step, 60);
      }
    }
    step();
  }

  /* ---------- boot ---------- */

  function boot() {
    applyTheme(initialTheme());
    applyBiButton();
    renderAlphaRail();
    renderEntryList();

    aboutStats.innerHTML = `
      <div><b>${meta.entry_count}</b><span>Headwords</span></div>
      <div><b>${meta.section_count}</b><span>Entries</span></div>
      <div><b>${meta.crossref_count}</b><span>See-refs</span></div>
      <div><b>${meta.source_pages.toLocaleString()}</b><span>Pages</span></div>`;
    aboutCoverage.textContent =
      `Every headword in the printed List of Entries is present (${meta.section_count} of ${meta.section_count}), together with ${meta.crossref_count} see-references printed in the body of the dictionary — ${meta.entry_count} headwords in all. The text covers all ${meta.source_pages.toLocaleString()} pages of the dictionary.` +
      (meta.translation ? ` 中文翻译进度：${meta.translation.translated_entries} / ${meta.translation.total_entries} 条正文词条（${meta.translation.translated_paragraphs} / ${meta.translation.total_paragraphs} 段）。` : "");

    route();
    if (!location.hash) history.replaceState(null, "", "#/");

    if ("requestIdleCallback" in window) requestIdleCallback(warmIndex, { timeout: 1500 });
    else setTimeout(warmIndex, 900);

    requestAnimationFrame(() => {
      loader.classList.add("is-done");
      setTimeout(() => { loader.style.display = "none"; }, 600);
      main.focus({ preventScroll: true });
    });
  }

  boot();
})();
