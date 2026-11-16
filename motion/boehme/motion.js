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
     IV. Three.js — the centre of nature
     ------------------------------------------------------------ */
  function initThree() {
    const stage = $("#threeStage");
    const canvas = $("#threeCanvas");
    if (!stage || !canvas) return;

    if (!window.THREE) {
      stage.insertAdjacentHTML("beforeend", '<div class="stage-fallback">Three.js could not be loaded.</div>');
      return;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      stage.insertAdjacentHTML("beforeend", '<div class="stage-fallback">WebGL is not available in this browser.</div>');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090705, 0.055);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.9, 6.4);
    camera.lookAt(0, 0.15, 0);

    const root = new THREE.Group();
    scene.add(root);

    /* lights */
    scene.add(new THREE.HemisphereLight(0xd8b36a, 0x120c08, 0.55));
    const key = new THREE.DirectionalLight(0xffd9a0, 1.45);
    key.position.set(3.2, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6c7d8f, 0.55);
    rim.position.set(-4, 2, -5);
    scene.add(rim);
    const orbLight = new THREE.PointLight(0xffc766, 2.4, 9, 2);
    orbLight.position.set(0, 0.55, 0);
    root.add(orbLight);

    /* floor */
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.5, 96),
      new THREE.MeshStandardMaterial({ color: 0x0b0907, roughness: 0.86, metalness: 0.12 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.31;
    root.add(floor);

    /* pewter bowl */
    const profile = [
      [0.00, 0.00], [1.05, 0.00], [1.36, 0.09], [1.48, 0.28],
      [1.47, 0.42], [1.36, 0.46], [1.02, 0.35], [0.68, 0.18], [0.00, 0.12],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const pewter = new THREE.MeshStandardMaterial({
      color: 0x8b8378, metalness: 0.92, roughness: 0.33, side: THREE.DoubleSide,
    });
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), pewter);
    bowl.position.y = -1.27;
    root.add(bowl);

    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(1.46, 0.032, 12, 128), pewter);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = -0.84;
    root.add(rimRing);

    const liquid = new THREE.Mesh(
      new THREE.CircleGeometry(1.08, 64),
      new THREE.MeshBasicMaterial({ color: 0xf6c56d, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.y = -0.91;
    root.add(liquid);

    /* light column */
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf0c477, transparent: true, opacity: 0.065,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 1.05, 2.05, 40, 1, true), beamMat);
    beam.position.y = 0.05;
    root.add(beam);
    const beam2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.55, 1.85, 32, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe1a0, transparent: true, opacity: 0.05,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      })
    );
    beam2.position.y = 0.15;
    root.add(beam2);

    /* glow texture */
    function glowTexture() {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      rg.addColorStop(0, "rgba(255,248,216,1)");
      rg.addColorStop(0.18, "rgba(255,220,150,.8)");
      rg.addColorStop(0.5, "rgba(230,170,80,.22)");
      rg.addColorStop(1, "rgba(230,170,80,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    const glowMap = glowTexture();

    /* eye-orb */
    const orbGroup = new THREE.Group();
    orbGroup.position.set(0, 0.58, 0);
    root.add(orbGroup);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.33, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0xffe1a0, emissive: 0xff9b2f, emissiveIntensity: 2.1,
        roughness: 0.18, metalness: 0.2,
      })
    );
    orbGroup.add(orb);

    const iris = new THREE.Mesh(
      new THREE.TorusGeometry(0.245, 0.018, 12, 80),
      new THREE.MeshBasicMaterial({ color: 0xffd27a })
    );
    iris.position.z = 0.28;
    orbGroup.add(iris);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x1a120b })
    );
    pupil.position.z = 0.315;
    orbGroup.add(pupil);

    const pupilIris = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.011, 10, 56),
      new THREE.MeshBasicMaterial({ color: 0xffd27a })
    );
    pupilIris.position.z = 0.328;
    orbGroup.add(pupilIris);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowMap, color: 0xffcf7a, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.set(3.4, 3.4, 1);
    orbGroup.add(halo);

    const halo2 = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowMap, color: 0xe6a75a, transparent: true, opacity: 0.24,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo2.scale.set(6.2, 6.2, 1);
    orbGroup.add(halo2);

    /* seven rings */
    const ringGroup = new THREE.Group();
    ringGroup.position.y = 0.58;
    root.add(ringGroup);

    const ringPivots = [];
    const ringNodes = [];
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xd8b36a, transparent: true });

    for (let i = 0; i < 7; i++) {
      const radius = 0.78 + i * 0.28;
      const pivot = new THREE.Group();
      pivot.rotation.x = Math.PI / 2 + (i - 3) * 0.075;
      pivot.rotation.y = (i - 3) * 0.08;
      pivot.rotation.z = (i % 2 ? 0.16 : -0.14);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.0062, 8, 180),
        goldMat.clone()
      );
      ring.material.opacity = 0.55 - i * 0.035;
      pivot.add(ring);

      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffe1a0 })
      );
      node.position.set(radius, 0, 0);
      pivot.add(node);

      const nodeGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowMap, color: 0xffcf7a, transparent: true, opacity: 0.65,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      nodeGlow.scale.set(0.38, 0.38, 1);
      nodeGlow.position.copy(node.position);
      pivot.add(nodeGlow);

      pivot.userData.speed = 0.08 + i * 0.028;
      pivot.userData.phase = i * 1.7;
      ringGroup.add(pivot);
      ringPivots.push(pivot);
      ringNodes.push(nodeGlow);
    }

    /* stars */
    const starCount = 900;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 4.2 + Math.random() * 6.5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.cos(ph);
      starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xd8b36a, size: 0.026, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    /* dust */
    const dustCount = 180;
    const dustPos = new Float32Array(dustCount * 3);
    const dustSeed = [];
    for (let i = 0; i < dustCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.15;
      dustPos[i * 3] = Math.cos(a) * r;
      dustPos[i * 3 + 1] = -0.9 + Math.random() * 2.4;
      dustPos[i * 3 + 2] = Math.sin(a) * r;
      dustSeed.push({ baseY: dustPos[i * 3 + 1], speed: 0.03 + Math.random() * 0.06, phase: Math.random() * 6.28 });
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xf0c477, size: 0.02, transparent: true, opacity: 0.65,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    root.add(dust);

    /* shockwave */
    const shock = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.008, 8, 128),
      new THREE.MeshBasicMaterial({
        color: 0xffe1a0, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    shock.rotation.x = Math.PI / 2;
    shock.position.y = 0.35;
    shock.visible = false;
    root.add(shock);

    /* interaction */
    let pointerX = 0, pointerY = 0;
    let targetX = 0, targetY = 0;
    let time = 0;
    let last = performance.now();
    let running = !reduceMotion;
    let pulse = 0;

    canvas.addEventListener("pointermove", (ev) => {
      const r = canvas.getBoundingClientRect();
      targetX = ((ev.clientX - r.left) / r.width - 0.5) * 2;
      targetY = ((ev.clientY - r.top) / r.height - 0.5) * 2;
    });
    canvas.addEventListener("pointerleave", () => { targetX = 0; targetY = 0; });
    canvas.addEventListener("pointerdown", () => {
      pulse = 1;
      shock.visible = true;
      shock.scale.setScalar(1);
      shock.material.opacity = 0.55;
    });

    function resize() {
      const rect = stage.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function render() {
      renderer.render(scene, camera);
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (running) {
        time += dt;
        pulse = Math.max(0, pulse - dt * 1.4);

        pointerX += (targetX - pointerX) * 0.045;
        pointerY += (targetY - pointerY) * 0.045;

        camera.position.x = pointerX * 0.55;
        camera.position.y = 0.9 + pointerY * 0.28;
        camera.lookAt(0, 0.15, 0);

        root.rotation.y += dt * 0.035;
        ringGroup.rotation.y -= dt * 0.02;
        stars.rotation.y += dt * 0.004;
        stars.rotation.x = Math.sin(time * 0.05) * 0.03;

        orbGroup.rotation.z = Math.sin(time * 0.4) * 0.06;
        orbGroup.lookAt(camera.position);
        const orbScale = 1 + Math.sin(time * 1.3) * 0.02 + pulse * 0.08;
        orb.scale.setScalar(orbScale);
        halo.scale.setScalar(3.4 + pulse * 1.6);
        halo.material.opacity = 0.75 + Math.sin(time * 1.3) * 0.08 + pulse * 0.2;
        orbLight.intensity = 2.2 + Math.sin(time * 1.3) * 0.25 + pulse * 1.5;

        ringPivots.forEach((pivot, i) => {
          pivot.rotation.z += dt * pivot.userData.speed;
          const s = 1 + pulse * (0.06 + i * 0.01);
          pivot.scale.setScalar(s);
          ringNodes[i].material.opacity = 0.55 + Math.sin(time * 1.6 + i) * 0.2;
        });

        const arr = dustGeo.attributes.position.array;
        for (let i = 0; i < dustCount; i++) {
          arr[i * 3 + 1] += dt * dustSeed[i].speed;
          if (arr[i * 3 + 1] > 1.55) arr[i * 3 + 1] = -0.95;
          arr[i * 3] += Math.sin(time * 0.4 + dustSeed[i].phase) * dt * 0.012;
        }
        dustGeo.attributes.position.needsUpdate = true;

        if (shock.visible) {
          shock.scale.setScalar(1 + (1 - shock.material.opacity) * 4.2);
          shock.material.opacity -= dt * 0.55;
          if (shock.material.opacity <= 0.01) {
            shock.visible = false;
            shock.material.opacity = 0;
          }
        }

        render();
      }
      requestAnimationFrame(loop);
    }

    resize();
    if (reduceMotion) render();
    setupControls(stage, {
      replay() {
        time = 0;
        pulse = 1;
        shock.visible = true;
        shock.scale.setScalar(1);
        shock.material.opacity = 0.55;
        running = true;
        stage.classList.remove("is-paused");
        const pause = $('[data-act="pause"]', stage);
        if (pause) pause.textContent = "Pause";
        render();
      },
      toggle(paused) {
        running = !paused;
      },
    });

    window.addEventListener("resize", resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);

    // legend highlight cycling
    let threeHighlight = -1;
    const threeLegendItems = $$("#threeLegend li");
    setInterval(() => {
      if (!running) return;
      threeHighlight = (threeHighlight + 1) % 7;
      threeLegendItems.forEach((li, i) => li.classList.toggle("is-active", i === threeHighlight));
    }, 1700);

    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------
     V. PixiJS — Aurora particle rose
     ------------------------------------------------------------ */
  function initPixi() {
    const stage = $("#pixiStage");
    const canvas = $("#pixiCanvas");
    if (!stage || !canvas) return;

    if (!window.PIXI) {
      stage.insertAdjacentHTML("beforeend", '<div class="stage-fallback">PixiJS could not be loaded.</div>');
      return;
    }

    let app;
    try {
      app = new PIXI.Application({
        view: canvas,
        resizeTo: stage,
        antialias: true,
        backgroundAlpha: 0,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      });
    } catch (err) {
      stage.insertAdjacentHTML("beforeend", '<div class="stage-fallback">WebGL is not available in this browser.</div>');
      return;
    }

    const root = new PIXI.Container();
    app.stage.addChild(root);

    const system = new PIXI.Container();
    root.addChild(system);

    const ringG = new PIXI.Graphics();
    system.addChild(ringG);

    const particleLayer = new PIXI.Container();
    system.addChild(particleLayer);

    const dustLayer = new PIXI.Container();
    root.addChild(dustLayer);

    const sunLayer = new PIXI.Container();
    root.addChild(sunLayer);

    const burstLayer = new PIXI.Container();
    root.addChild(burstLayer);

    function dotTexture(size) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      const rg = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      rg.addColorStop(0, "rgba(255,248,216,1)");
      rg.addColorStop(0.25, "rgba(255,220,150,.95)");
      rg.addColorStop(1, "rgba(230,170,80,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, size, size);
      return PIXI.Texture.from(c);
    }

    function noiseTexture(size) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      const img = g.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 90 + Math.random() * 76;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return PIXI.Texture.from(c);
    }

    const dot = dotTexture(18);
    const bigGlow = dotTexture(128);

    /* displacement map for a hand-drawn tremor */
    const dispSprite = new PIXI.Sprite(noiseTexture(256));
    dispSprite.width = 800;
    dispSprite.height = 800;
    dispSprite.position.set(-900, -900);
    dispSprite.renderable = false;
    app.stage.addChild(dispSprite);
    try {
      system.filters = [new PIXI.filters.DisplacementFilter(dispSprite, 3)];
    } catch (err) { /* filters are optional */ }

    let W = 1, H = 1, cx = 0, cy = 0, maxR = 100;
    let time = 0;
    let running = !reduceMotion;
    let pulse = 0;
    let pointer = { x: 0, y: 0, active: false };
    let lastW = 0, lastH = 0;

    const rings = [];
    const dust = [];
    const bursts = [];
    const pixiLegendItems = $$("#pixiLegend li");

    function layout() {
      W = app.screen.width;
      H = app.screen.height;
      cx = W * 0.5;
      cy = H * 0.52;
      maxR = Math.min(W * 0.37, H * 0.62);
      system.position.set(cx, cy);
      system.rotation = -0.13;
      sunLayer.position.set(cx, cy);
      ringG.clear();
      for (let i = 0; i < 7; i++) {
        const rx = maxR * (0.22 + i * 0.13);
        const ry = rx * 0.36;
        ringG.lineStyle(1, 0xd1a75f, 0.26 - i * 0.022);
        ringG.drawEllipse(0, 0, rx, ry);
      }
      if (dispSprite.width !== W * 1.4) {
        dispSprite.width = W * 1.4;
        dispSprite.height = H * 1.4;
      }
    }

    function buildParticles() {
      particleLayer.removeChildren();
      rings.length = 0;
      for (let i = 0; i < 7; i++) {
        const count = 58 + i * 11;
        const rx = maxR * (0.22 + i * 0.13);
        const ry = rx * 0.36;
        const ring = { i, rx, ry, speed: 0.07 + i * 0.025, particles: [] };
        for (let j = 0; j < count; j++) {
          const s = new PIXI.Sprite(dot);
          s.anchor.set(0.5);
          s.tint = j % 5 === 0 ? 0xffe1a0 : 0xd1a75f;
          s.alpha = 0.28 + Math.random() * 0.55;
          s.scale.set(0.14 + Math.random() * 0.16);
          particleLayer.addChild(s);
          ring.particles.push({
            sprite: s,
            angle: Math.random() * Math.PI * 2,
            phase: Math.random() * Math.PI * 2,
            jitter: 1 + Math.random() * 3.5,
          });
        }
        rings.push(ring);
      }

      dustLayer.removeChildren();
      dust.length = 0;
      const dustCount = Math.round(Math.min(620, W * H / 2200));
      for (let i = 0; i < dustCount; i++) {
        const s = new PIXI.Sprite(dot);
        s.anchor.set(0.5);
        s.tint = Math.random() > 0.8 ? 0xffe1a0 : 0xb8863b;
        s.alpha = 0.12 + Math.random() * 0.42;
        s.scale.set(0.1 + Math.random() * 0.22);
        s.x = Math.random() * W;
        s.y = Math.random() * H;
        dustLayer.addChild(s);
        dust.push({
          sprite: s,
          vx: (Math.random() - 0.5) * 4,
          vy: -3 - Math.random() * 8,
          phase: Math.random() * Math.PI * 2,
          baseAlpha: s.alpha,
        });
      }
    }

    function buildSun() {
      sunLayer.removeChildren();
      const glow = new PIXI.Sprite(bigGlow);
      glow.anchor.set(0.5);
      glow.scale.set(3.25);
      glow.alpha = 0.44;
      glow.blendMode = PIXI.BLEND_MODES.ADD;
      sunLayer.addChild(glow);

      const core = new PIXI.Sprite(bigGlow);
      core.anchor.set(0.5);
      core.scale.set(0.78);
      core.alpha = 0.92;
      core.blendMode = PIXI.BLEND_MODES.ADD;
      sunLayer.addChild(core);

      const rays = new PIXI.Graphics();
      rays.lineStyle(1, 0xe8c477, 0.5);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const r1 = maxR * 0.12;
        const r2 = r1 * (i % 2 === 0 ? 1.9 : 1.45);
        rays.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        rays.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      }
      rays.name = "rays";
      sunLayer.addChild(rays);

      const ring = new PIXI.Graphics();
      ring.lineStyle(1, 0xe8c477, 0.45);
      ring.drawCircle(0, 0, maxR * 0.115);
      sunLayer.addChild(ring);
    }

    function burst() {
      pulse = 1;
      for (let i = 0; i < 46; i++) {
        const s = new PIXI.Sprite(dot);
        s.anchor.set(0.5);
        s.tint = i % 3 === 0 ? 0xfff0c8 : 0xd1a75f;
        s.alpha = 0.9;
        s.scale.set(0.18 + Math.random() * 0.22);
        s.x = cx;
        s.y = cy;
        burstLayer.addChild(s);
        const a = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 150;
        bursts.push({ sprite: s, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1 });
      }
    }

    function update() {
      if (!running) return;
      const dt = Math.min(app.ticker.deltaMS / 1000, 0.05);
      time += dt;
      pulse = Math.max(0, pulse - dt * 1.1);

      if (app.screen.width !== lastW || app.screen.height !== lastH) {
        lastW = app.screen.width;
        lastH = app.screen.height;
        layout();
        buildParticles();
        buildSun();
      }

      const t = time;
      const scale = 1 + pulse * 0.05;
      system.scale.set(scale);

      for (const ring of rings) {
        for (const p of ring.particles) {
          const a = p.angle + t * ring.speed;
          const wob = Math.sin(t * 1.7 + p.phase) * (0.8 + p.jitter);
          p.sprite.x = Math.cos(a) * ring.rx + wob;
          p.sprite.y = Math.sin(a) * ring.ry + Math.cos(t * 1.3 + p.phase) * 1.2;
          p.sprite.alpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.5 + p.phase));
        }
      }

      for (const d of dust) {
        d.sprite.x += d.vx * dt;
        d.sprite.y += d.vy * dt;
        if (d.sprite.y < -20) { d.sprite.y = H + 20; d.sprite.x = Math.random() * W; }
        if (d.sprite.x < -20) d.sprite.x = W + 20;
        if (d.sprite.x > W + 20) d.sprite.x = -20;
        if (pointer.active) {
          const dx = d.sprite.x - pointer.x;
          const dy = d.sprite.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150 && dist > 1) {
            const f = (1 - dist / 150) * 24;
            d.sprite.x += (dx / dist) * f * dt;
            d.sprite.y += (dy / dist) * f * dt;
          }
        }
        d.sprite.alpha = d.baseAlpha * (0.65 + 0.35 * Math.sin(t * 0.8 + d.phase));
      }

      const sunGlow = sunLayer.children[0];
      const sunCore = sunLayer.children[1];
      const rays = sunLayer.getChildByName("rays");
      if (sunGlow) {
        sunGlow.scale.set(3.25 + Math.sin(t * 1.2) * 0.22 + pulse * 0.7);
        sunGlow.alpha = 0.4 + Math.sin(t * 1.2) * 0.07 + pulse * 0.2;
      }
      if (sunCore) {
        sunCore.scale.set(0.82 + Math.sin(t * 1.2) * 0.04 + pulse * 0.12);
      }
      if (rays) rays.rotation += dt * 0.05;

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.life -= dt * 1.1;
        b.sprite.x += b.vx * dt;
        b.sprite.y += b.vy * dt;
        b.vx *= 0.985;
        b.vy *= 0.985;
        b.sprite.alpha = Math.max(0, b.life);
        b.sprite.scale.set(0.2 + (1 - b.life) * 0.4);
        if (b.life <= 0) {
          burstLayer.removeChild(b.sprite);
          b.sprite.destroy();
          bursts.splice(i, 1);
        }
      }

      dispSprite.x = -900 + Math.sin(t * 0.13) * 90;
      dispSprite.y = -900 + Math.cos(t * 0.11) * 70;

      const hl = Math.floor(t / 1.7) % 7;
      pixiLegendItems.forEach((li, i) => li.classList.toggle("is-active", i === hl));
    }

    const onMove = (ev) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ev.clientX - r.left;
      pointer.y = ev.clientY - r.top;
      pointer.active = true;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", () => { pointer.active = false; });
    canvas.addEventListener("pointerdown", burst);

    setupControls(stage, {
      replay() {
        time = 0;
        pulse = 1;
        bursts.forEach((b) => { b.sprite.destroy(); });
        bursts.length = 0;
        burstLayer.removeChildren();
        running = true;
        app.ticker.start();
        stage.classList.remove("is-paused");
        const pause = $('[data-act="pause"]', stage);
        if (pause) pause.textContent = "Pause";
        burst();
      },
      toggle(paused) {
        running = !paused;
        if (paused) app.ticker.stop();
        else app.ticker.start();
      },
    });

    lastW = app.screen.width;
    lastH = app.screen.height;
    layout();
    buildParticles();
    buildSun();
    app.renderer.render(app.stage);
    app.ticker.add(update);
    if (reduceMotion) {
      running = false;
      app.ticker.stop();
    }
  }

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */
  initWoodcut();
  initAurora();
  initTriptych();
  initThree();
  initPixi();
})();
