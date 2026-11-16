/* ============================================================
   Boehme motion studies
   - CSS/SVG line animation for the woodcut
   - Canvas 2D orbital diagram for Aurora
   - interactive SVG triptych for the Three Principles
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------
     Shared stage controls
     ------------------------------------------------------------ */
  function setupControls(stage, api) {
    if (!stage) return;
    const replay = $('[data-act="replay"]', stage);
    const pause = $('[data-act="pause"]', stage);
    const full = $('[data-act="full"]', stage);

    if (replay) {
      replay.addEventListener("click", () => {
        stage.classList.remove("is-paused");
        if (pause) pause.textContent = "Pause";
        if (api && api.replay) {
          api.replay();
        } else {
          stage.classList.remove("is-playing");
          void stage.offsetWidth;
          stage.classList.add("is-playing");
        }
      });
    }

    if (pause) {
      pause.addEventListener("click", () => {
        const paused = stage.classList.toggle("is-paused");
        pause.textContent = paused ? "Play" : "Pause";
        if (api && api.toggle) api.toggle(paused);
      });
    }

    if (full) {
      full.addEventListener("click", () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (stage.requestFullscreen) {
          stage.requestFullscreen();
        }
      });
    }
  }

  /* ------------------------------------------------------------
     I. Woodcut — CSS handles the line drawing
     ------------------------------------------------------------ */
  function initWoodcut() {
    const stage = $("#woodcutStage");
    if (!stage) return;
    setupControls(stage);
    if (reduceMotion) stage.classList.remove("is-playing");
  }

  /* ------------------------------------------------------------
     II. Aurora — canvas
     ------------------------------------------------------------ */
  function initAurora() {
    const stage = $("#auroraStage");
    const canvas = $("#auroraCanvas");
    if (!stage || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let time = 0;
    let last = performance.now();
    let userPaused = reduceMotion;
    let flash = 0;
    let hoverX = 0, hoverY = 0;
    let highlight = -1;

    const qualityNames = ["DRY", "SWEET", "BITTER", "FIRE / WATER", "LOVE", "SOUND", "CORPUS"];
    const speeds = [0.07, 0.095, 0.12, 0.15, 0.18, 0.22, 0.27];
    const offsets = [-1.2, 0.3, 1.4, 2.6, 3.7, 4.9, 5.8];

    const stars = Array.from({ length: 170 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.5 + .25,
      p: Math.random() * Math.PI * 2,
      s: Math.random() * 1.2 + .25,
    }));

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, rect.width);
      H = Math.max(1, rect.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (time > 0) draw(time);
    }

    function geometry() {
      const cx = W * .5 + hoverX * 10;
      const cy = H * .52 + hoverY * 7;
      const maxR = Math.min(W * .38, H * .66);
      return { cx, cy, maxR, sunR: Math.max(18, maxR * .105) };
    }

    function drawBackground() {
      const g = ctx.createRadialGradient(W * .5, H * .48, 0, W * .5, H * .48, Math.max(W, H) * .72);
      g.addColorStop(0, "#241c12");
      g.addColorStop(.42, "#17120c");
      g.addColorStop(.78, "#0e0b08");
      g.addColorStop(1, "#080605");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStars(t) {
      for (const s of stars) {
        const a = .14 + .5 * (.5 + .5 * Math.sin(t * s.s + s.p));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233, 215, 176, ${a})`;
        ctx.fill();
      }
    }

    function drawOuterRing(cx, cy, maxR, t) {
      const r = maxR * 1.045;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "rgba(209, 167, 95, .34)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2 + t * .006;
        const long = i % 6 === 0;
        const r1 = r - (long ? 10 : 5);
        const r2 = r - 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.strokeStyle = long ? "rgba(209, 167, 95, .42)" : "rgba(209, 167, 95, .18)";
        ctx.stroke();
      }

      // four cardinal marks
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(232, 196, 119, .75)";
        ctx.fill();
      }
      ctx.restore();
    }

    function orbitPoint(cx, cy, rx, ry, rot, angle) {
      const c = Math.cos(rot), s = Math.sin(rot);
      const x = cx + rx * Math.cos(angle) * c - ry * Math.sin(angle) * s;
      const y = cy + rx * Math.cos(angle) * s + ry * Math.sin(angle) * c;
      return [x, y];
    }

    function drawOrbits(t) {
      const { cx, cy, maxR } = geometry();
      const rot = -0.13;

      for (let i = 0; i < 7; i++) {
        const rx = maxR * (.22 + i * .13);
        const ry = rx * .36;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(209, 167, 95, ${.38 - i * .025})`;
        ctx.lineWidth = i === 6 ? 1.2 : .8;
        ctx.stroke();

        // faint second line for the engraving feel
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx - 2.5, ry - 1.4, rot, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(209, 167, 95, ${.09 - i * .006})`;
        ctx.lineWidth = .6;
        ctx.stroke();
      }

      // markers
      for (let i = 0; i < 7; i++) {
        const rx = maxR * (.22 + i * .13);
        const ry = rx * .36;
        const a = t * speeds[i] + offsets[i];
        const [x, y] = orbitPoint(cx, cy, rx, ry, rot, a);

        const pulse = .5 + .5 * Math.sin(t * 2 + i);
        ctx.beginPath();
        ctx.arc(x, y, 8 + pulse * .6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(14, 11, 8, .92)";
        ctx.fill();
        ctx.strokeStyle = highlight === i ? "rgba(246, 226, 168, .95)" : "rgba(209, 167, 95, .72)";
        ctx.lineWidth = highlight === i ? 1.6 : 1;
        ctx.stroke();

        ctx.fillStyle = highlight === i ? "#f6e2a8" : "rgba(233, 215, 176, .82)";
        ctx.font = "600 8px 'Avenir Next', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), x, y + .5);
      }

    }

    function drawSun(t) {
      const { cx, cy, maxR, sunR } = geometry();
      const pulse = .5 + .5 * Math.sin(t * 1.25);
      const r = sunR * (1 + pulse * .05);

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4.2);
      glow.addColorStop(0, "rgba(255, 244, 206, .95)");
      glow.addColorStop(.18, "rgba(242, 210, 137, .55)");
      glow.addColorStop(.5, "rgba(209, 167, 95, .14)");
      glow.addColorStop(1, "rgba(209, 167, 95, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(250, 235, 190, .95)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 248, 218, .95)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // rays
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * .035);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const inner = r * 1.35;
        const outer = r * (i % 2 === 0 ? 2.5 : 1.85) * (1 + pulse * .06);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.strokeStyle = i % 2 === 0 ? "rgba(242, 210, 137, .55)" : "rgba(209, 167, 95, .24)";
        ctx.lineWidth = i % 2 === 0 ? 1 : .6;
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawTrinity(t) {
      const { cx, cy, sunR } = geometry();
      const r = sunR * 2.65;
      const rot = -Math.PI / 2 + t * .015;
      const pts = [];
      for (let i = 0; i < 3; i++) {
        const a = rot + (i * Math.PI * 2) / 3;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.closePath();
      ctx.strokeStyle = "rgba(232, 196, 119, .62)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "600 8px 'Avenir Next', system-ui, sans-serif";
      ctx.fillStyle = "rgba(232, 196, 119, .8)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labels = ["P", "F", "S"];
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(pts[i][0], pts[i][1], 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(232, 196, 119, .7)";
        ctx.fill();
        ctx.fillText(labels[i], pts[i][0] * 1.0 + (pts[i][0] - cx) * .045, pts[i][1] + (pts[i][1] - cy) * .045);
      }
    }

    function drawFlash() {
      if (flash <= 0.01) return;
      const { cx, cy, maxR } = geometry();
      const r = (1 - flash) * maxR * 1.35;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 243, 204, ${flash * .65})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r * .72, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(209, 167, 95, ${flash * .35})`;
      ctx.lineWidth = .8;
      ctx.stroke();
    }

    function draw(t) {
      drawBackground();
      drawStars(t);
      const { cx, cy, maxR } = geometry();
      drawOuterRing(cx, cy, maxR, t);
      drawOrbits(t);
      drawSun(t);
      drawTrinity(t);
      drawFlash();
    }

    function updateLegend(t) {
      const idx = Math.floor(t / 1.7) % 7;
      if (idx === highlight) return;
      highlight = idx;
      $$("#auroraLegend li").forEach((li, i) => li.classList.toggle("is-active", i === idx));
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, .05);
      last = now;
      if (!userPaused) {
        time += dt;
        if (flash > 0) flash = Math.max(0, flash - dt * .9);
        draw(time);
        updateLegend(time);
      }
      requestAnimationFrame(loop);
    }

    resize();
    setupControls(stage, {
      replay() {
        time = 0;
        flash = 1;
        highlight = -1;
        userPaused = false;
        stage.classList.remove("is-paused");
        const pause = $('[data-act="pause"]', stage);
        if (pause) pause.textContent = "Pause";
        draw(0);
      },
      toggle(paused) {
        userPaused = paused;
      },
    });

    window.addEventListener("resize", resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

    canvas.addEventListener("pointermove", (ev) => {
      const r = canvas.getBoundingClientRect();
      hoverX = ((ev.clientX - r.left) / r.width - .5) * 2;
      hoverY = ((ev.clientY - r.top) / r.height - .5) * 2;
    });
    canvas.addEventListener("pointerleave", () => { hoverX = 0; hoverY = 0; });
    canvas.addEventListener("click", () => { flash = 1; });

    draw(0);
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------
     III. Triptych — interactive panels
     ------------------------------------------------------------ */
  function initTriptych() {
    const stage = $("#triptychStage");
    if (!stage) return;
    setupControls(stage);

    const caption = $("#triptychCaption");
    const defaultCaption = caption ? caption.textContent : "";
    const panels = $$(".panel", stage);

    panels.forEach((panel) => {
      panel.setAttribute("tabindex", "0");
      panel.setAttribute("role", "button");
      panel.setAttribute("aria-label", panel.dataset.title || "panel");
      const activate = () => {
        const wasFocused = panel.classList.contains("is-focus");
        panels.forEach((p) => p.classList.remove("is-focus"));
        stage.classList.toggle("has-focus", !wasFocused);
        if (wasFocused) {
          if (caption) caption.textContent = defaultCaption;
        } else {
          panel.classList.add("is-focus");
          if (caption) caption.textContent = panel.dataset.quote || "";
        }
      };
      panel.addEventListener("click", activate);
      panel.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          activate();
        }
      });
    });

    stage.addEventListener("click", (ev) => {
      if (ev.target === stage) {
        panels.forEach((p) => p.classList.remove("is-focus"));
        stage.classList.remove("has-focus");
        if (caption) caption.textContent = defaultCaption;
      }
    });

    if (reduceMotion) stage.classList.remove("is-playing");
  }

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */
  initWoodcut();
  initAurora();
  initTriptych();
})();
