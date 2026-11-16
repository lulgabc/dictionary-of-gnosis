/* Pilot player: one PixiJS application, eight scenes, one canvas. */
(function () {
  "use strict";

  const P = window.PILOT;
  const entries = [
    {
      id: "dee", title: "Dee, John", short: "The Skrying Glass", era: "1527–1608/9",
      type: "Biography · angel magic", family: "Ritual / portrait",
      quote: "scrying … crystal balls and ‘scryers’ … information from spirits and angels",
      note: "A candle, a crystal sphere, a faint Enochian table and two rotating sigil rings. Tests glass/reflection, sigil geometry, candlelight and a spark field.",
      effort: "2.5–3.5 days", risk: "sigil accuracy / glass look",
    },
    {
      id: "alchemy", title: "Alchemy I: Introduction", short: "The Great Work", era: "16th–17th c.",
      type: "Practice · apparatus", family: "Alchemical apparatus",
      quote: "visual results – such as the growing of a spectacular ‘Philosophical Tree’ from gold",
      note: "A furnace, alembic and receiver; the liquid cycles through nigredo, albedo and rubedo while a philosophical tree condenses in the receiver.",
      effort: "3–4 days", risk: "historical apparatus",
    },
    {
      id: "astrology", title: "Astrology I: Introduction", short: "As Above, So Below", era: "Ancient–early modern",
      type: "Cosmology · diagram", family: "Celestial wheel",
      quote: "As above, so below",
      note: "A zodiac wheel above a terrestrial landscape, with seven planetary lights and a vertical beam. Tests concentric rings, rotating labels and orbital motion.",
      effort: "2.5–3.5 days", risk: "zodiac order / chart logic",
    },
    {
      id: "gnosticism", title: "Gnosticism I: Gnostic Religion", short: "The Spark and the Archons", era: "2nd–4th c.",
      type: "Myth · dualism", family: "Hierarchical cosmos",
      quote: "a divine spark in man, deriving from the divine realm, fallen into this world…",
      note: "The pleroma above, seven archon rings, and a trapped spark below. Tests segmented rings, watching eyes and an ascending particle system.",
      effort: "2–3 days", risk: "abstract hierarchy readability",
    },
    {
      id: "hermetic", title: "Hermetic Literature I: Antiquity", short: "The Corpus Hermeticum", era: "2nd–4th c.",
      type: "Text · manuscript", family: "Scroll / codex",
      quote: "The literary works attributed to Hermes Trismegistus…",
      note: "A papyrus scroll unrolls beneath a caduceus seal, with Greek headers and floating letters. Tests mask reveal, text layout and a parchment palette.",
      effort: "3–4 days", risk: "Greek text / scroll masking",
    },
    {
      id: "freemasonry", title: "Freemasonry", short: "The Tracing Board", era: "18th c.–present",
      type: "Society · ritual", family: "Geometric emblem",
      quote: "I will strive to live with love and care, upon the level, by the square",
      note: "A tracing board with square and compass, the letter G, two pillars, mosaic pavement and rough/perfect ashlars. Tests geometric line art and perspective.",
      effort: "3–4 days", risk: "symbol accuracy",
    },
    {
      id: "theosophy", title: "Theosophical Society", short: "The Seven Globes", era: "1875–present",
      type: "Modern movement · cosmology", family: "Chain of globes",
      quote: "inaugurated in New York City on November 7, 1875",
      note: "Seven globes on an ascending chain, a hexagram/ankh and a travelling light pulse. Tests arc layout, sequential lighting and emblem composition.",
      effort: "2.5–3.5 days", risk: "emblem sensitivity",
    },
    {
      id: "ufo", title: "UFO Traditions", short: "Contact", era: "1947–present",
      type: "Modern · contactee", family: "Mid-century technical",
      quote: "the ‘flying saucer’ phenomenon is usually associated with Kenneth Arnold’s sightings in June 1947",
      note: "Retro saucers, a radar sweep, a radio tower and a beam over a desert. Tests a mid-century palette, saucer shapes, radar and broadcast motion.",
      effort: "2.5–3.5 days", risk: "period style / not kitsch",
    },
  ];

  const stageEl = document.getElementById("stage");
  const canvas = document.getElementById("canvas");
  const sceneList = document.getElementById("sceneList");
  const stageTitle = document.getElementById("stageTitle");
  const stageSub = document.getElementById("stageSub");
  const stageType = document.getElementById("stageType");
  const stageQuote = document.getElementById("stageQuote");
  const infoTitle = document.getElementById("infoTitle");
  const infoNote = document.getElementById("infoNote");
  const infoEffort = document.getElementById("infoEffort");
  const infoRisk = document.getElementById("infoRisk");
  const infoFamily = document.getElementById("infoFamily");
  const scoreBody = document.getElementById("scoreBody");
  const replayBtn = document.getElementById("replayBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const fullBtn = document.getElementById("fullBtn");
  const listCount = document.getElementById("listCount");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let app, world, current = null, currentId = null;
  let time = 0;
  let running = !reduceMotion;
  let visible = true;

  function initList() {
    listCount.textContent = entries.length;
    sceneList.innerHTML = entries.map((e, i) => `
      <button class="scene-item" type="button" data-id="${e.id}">
        <span class="num">${String(i + 1).padStart(2, "0")}</span>
        <span class="t">${e.short}<span class="m">${e.title} · ${e.era}</span></span>
      </button>`).join("");
    sceneList.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-id]");
      if (btn) select(btn.dataset.id, true);
    });

    scoreBody.innerHTML = entries.map((e) => `
      <tr><td>${e.short}</td><td>${e.family}</td><td>${e.effort}</td><td>${e.risk}</td></tr>`).join("");
  }

  function updateUI(meta) {
    stageTitle.textContent = meta.short;
    stageSub.textContent = `${meta.title} · ${meta.era}`;
    stageType.textContent = meta.type;
    stageQuote.textContent = `“${meta.quote}”`;
    infoTitle.textContent = meta.short;
    infoNote.textContent = meta.note;
    infoEffort.textContent = meta.effort;
    infoRisk.textContent = meta.risk;
    infoFamily.textContent = meta.family;
    document.querySelectorAll(".scene-item").forEach((el) => el.classList.toggle("is-active", el.dataset.id === meta.id));
    document.title = `${meta.short} — Pilot · Dictionary of Gnosis`;
  }

  function layout() {
    if (!app) return;
    const W = app.screen.width;
    const H = app.screen.height;
    const s = Math.min(W / P.W, H / P.H);
    world.scale.set(s);
    world.position.set((W - P.W * s) / 2, (H - P.H * s) / 2);
  }

  function load(id, pushHash) {
    const meta = entries.find((e) => e.id === id) || entries[0];
    if (current) {
      current.destroy();
      current = null;
    }
    world.removeChildren();
    time = 0;
    if (!P.scenes[meta.id]) {
      console.error("Missing scene", meta.id);
      return;
    }
    try {
      current = P.scenes[meta.id]({ world, tex: P.textures, app });
    } catch (err) {
      console.error("Scene failed", meta.id, err);
      current = null;
    }
    currentId = meta.id;
    if (current) current.update(0, 0);
    app.renderer.render(app.stage);
    updateUI(meta);
    if (pushHash && location.hash !== "#" + meta.id) history.pushState(null, "", "#" + meta.id);
  }

  function select(id, pushHash) {
    if (id === currentId && current) return;
    load(id, pushHash);
  }

  function fromHash() {
    const id = location.hash.replace(/^#\/?/, "") || entries[0].id;
    if (id !== currentId) load(id, false);
  }

  function initApp() {
    if (!window.PIXI) {
      stageEl.insertAdjacentHTML("beforeend", '<div class="fallback">PixiJS failed to load.</div>');
      return;
    }
    app = new PIXI.Application({
      view: canvas,
      resizeTo: stageEl,
      antialias: true,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    P.initTextures();
    world = new PIXI.Container();
    app.stage.addChild(world);

    initList();
    layout();
    fromHash();
    if (!location.hash) history.replaceState(null, "", "#" + entries[0].id);

    app.ticker.add(() => {
      if (!running || !visible) return;
      const dt = Math.min(app.ticker.deltaMS / 1000, 0.05);
      time += dt;
      if (current) current.update(time, dt);
    });

    window.addEventListener("resize", layout);
    if (window.ResizeObserver) new ResizeObserver(layout).observe(stageEl);
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("popstate", fromHash);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((obs) => {
        obs.forEach((entry) => { visible = entry.isIntersecting; });
      }, { threshold: 0.02 }).observe(stageEl);
    }

    stageEl.addEventListener("pointermove", (ev) => {
      if (!current || !current.pointer) return;
      const r = canvas.getBoundingClientRect();
      const x = (ev.clientX - r.left - world.position.x) / world.scale.x;
      const y = (ev.clientY - r.top - world.position.y) / world.scale.y;
      current.pointer(x, y);
    });
    stageEl.addEventListener("pointerdown", (ev) => {
      if (ev.target.closest("button")) return;
      if (current && current.click) current.click();
    });

    replayBtn.addEventListener("click", () => {
      running = true;
      pauseBtn.textContent = "Pause";
      select(currentId, false);
      // select() returns early for the current id; force a rebuild.
      if (currentId) load(currentId, false);
      running = true;
      pauseBtn.textContent = "Pause";
    });
    pauseBtn.addEventListener("click", () => {
      running = !running;
      pauseBtn.textContent = running ? "Pause" : "Play";
      if (running && current) current.update(time, Math.min(app.ticker.deltaMS / 1000, 0.05));
    });
    fullBtn.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stageEl.requestFullscreen) stageEl.requestFullscreen();
    });

    document.addEventListener("keydown", (ev) => {
      const tag = (ev.target && ev.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const idx = entries.findIndex((e) => e.id === currentId);
      if (ev.key === "ArrowRight" && idx < entries.length - 1) select(entries[idx + 1].id, true);
      if (ev.key === "ArrowLeft" && idx > 0) select(entries[idx - 1].id, true);
    });

    if (reduceMotion) {
      pauseBtn.textContent = "Play";
      running = false;
    }
  }

  initApp();
})();
