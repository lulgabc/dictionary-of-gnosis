/* Eight pilot scenes, all drawn on the same 1600 x 900 virtual stage.
   Each builder returns { update(t, dt), pointer(x, y), click(), destroy() }. */
(function () {
  "use strict";

  const P = window.PILOT;
  const h = P.h;
  const C = P.C;
  P.scenes = P.scenes || {};

  function smallCaps(root, str, x, y, size, color, alpha, spacing) {
    const t = h.text(str, size, color, alpha, {
      fontFamily: "Avenir Next, Segoe UI, sans-serif",
      letterSpacing: spacing == null ? 4 : spacing,
    });
    t.position.set(x, y);
    root.addChild(t);
    return t;
  }

  /* ------------------------------------------------------------
     I. DEE — the skrying glass
     ------------------------------------------------------------ */
  P.scenes.dee = function (ctx) {
    const root = new PIXI.Container();
    ctx.world.addChild(root);
    const { tex } = ctx;

    h.glow(root, tex.glow, 810, 470, 11, 0x5a4220, 0.25);
    h.glow(root, tex.glow, 810, 470, 5.2, 0x9ec7d0, 0.16);

    /* Enochian table, faint behind everything */
    const grid = new PIXI.Graphics();
    const gx = 320, gy = 110, cw = 120, ch = 100, cols = 8, rows = 7;
    for (let i = 0; i <= cols; i++) h.line(grid, gx + i * cw, gy, gx + i * cw, gy + rows * ch, C.gold, 0.09, 1);
    for (let j = 0; j <= rows; j++) h.line(grid, gx, gy + j * ch, gx + cols * cw, gy + j * ch, C.gold, 0.09, 1);
    root.addChild(grid);

    const letters = "ABCDEFGHIKLMNOPQRSTVXYZ";
    for (let k = 0; k < 30; k++) {
      const t = h.text(letters[(k * 7) % letters.length], 16, C.gold, 0.14, { fontFamily: "Georgia, serif" });
      t.position.set(gx + ((k % 8) + 0.5) * cw, gy + (Math.floor(k / 8) + 0.5) * ch);
      root.addChild(t);
    }

    /* candle */
    const candle = new PIXI.Container();
    candle.position.set(300, 640);
    root.addChild(candle);
    const candleBody = new PIXI.Graphics();
    candleBody.beginFill(0xe2cfaa, 0.75).drawRect(-17, -80, 34, 150).endFill();
    candleBody.lineStyle(1, C.gold, 0.5).drawRect(-17, -80, 34, 150);
    candle.addChild(candleBody);
    const flame = new PIXI.Graphics();
    flame.beginFill(0xffb347, 0.9).drawEllipse(0, -100, 13, 28).endFill();
    flame.beginFill(0xfff0c0, 0.95).drawEllipse(0, -106, 6, 15).endFill();
    candle.addChild(flame);
    h.glow(root, tex.glow, 300, 536, 1.8, 0xffb347, 0.55);

    const beam = new PIXI.Graphics();
    beam.beginFill(0xd1a75f, 0.045).drawPolygon([300, 560, 530, 470, 560, 610, 300, 700]).endFill();
    root.addChild(beam);

    /* sigil rings */
    function sigilRing(r, points, speed) {
      const c = new PIXI.Container();
      c.position.set(810, 470);
      const g = new PIXI.Graphics();
      h.circle(g, 0, 0, r, C.gold, 0.28, 1);
      h.star(g, 0, 0, points, r - 30, r - 62, C.gold, 0.22, 1);
      h.tickRing(g, 0, 0, r + 6, r + 15, points * 4, C.gold, 0.2, 1);
      c.addChild(g);
      c.userData = { speed };
      root.addChild(c);
      return c;
    }
    const ring1 = sigilRing(235, 7, 0.055);
    const ring2 = sigilRing(300, 12, -0.035);

    /* wings behind the glass */
    const wings = new PIXI.Graphics();
    h.line(wings, 810, 470, 560, 300, C.gold, 0);
    wings.lineStyle(1.2, C.gold, 0.36);
    wings.moveTo(800, 470);
    wings.bezierCurveTo(700, 330, 585, 300, 500, 330);
    wings.bezierCurveTo(610, 370, 680, 430, 790, 470);
    wings.moveTo(820, 470);
    wings.bezierCurveTo(920, 330, 1035, 300, 1120, 330);
    wings.bezierCurveTo(1010, 370, 940, 430, 830, 470);
    root.addChild(wings);

    /* crystal sphere */
    const glassGlow = h.glow(root, tex.glow, 810, 470, 4.4, 0xaed8e0, 0.24);
    const glass = new PIXI.Graphics();
    glass.beginFill(0x0e1418, 0.82).drawCircle(810, 470, 170).endFill();
    glass.lineStyle(2, 0xd8eef0, 0.5).drawCircle(810, 470, 170);
    glass.lineStyle(1, C.gold, 0.45).drawCircle(810, 470, 178);
    glass.lineStyle(8, 0xd8eef0, 0.08).arc(810, 470, 150, Math.PI * 0.95, Math.PI * 1.25);
    glass.lineStyle(3, 0xd8eef0, 0.12).arc(810, 470, 145, Math.PI * 1.32, Math.PI * 1.52);
    root.addChild(glass);

    /* eye inside the glass */
    const eye = new PIXI.Graphics();
    eye.lineStyle(1.4, C.paleGold, 0.7);
    eye.moveTo(750, 470);
    eye.bezierCurveTo(780, 440, 840, 440, 870, 470);
    eye.bezierCurveTo(840, 500, 780, 500, 750, 470);
    eye.beginFill(C.gold, 0.8).drawCircle(810, 470, 12).endFill();
    eye.beginFill(C.ink, 1).drawCircle(810, 470, 5).endFill();
    root.addChild(eye);

    /* stand */
    const stand = new PIXI.Graphics();
    stand.lineStyle(2, C.gold, 0.55);
    stand.drawEllipse(810, 690, 120, 18);
    stand.drawEllipse(810, 706, 180, 22);
    stand.moveTo(760, 634); stand.lineTo(730, 700);
    stand.moveTo(860, 634); stand.lineTo(890, 700);
    root.addChild(stand);

    /* sparks */
    const sparks = [];
    for (let i = 0; i < 70; i++) {
      const s = h.dot(root, tex.dot, 0, 0, 0.16 + Math.random() * 0.2, i % 5 ? C.gold : 0xaed8e0, 0.3 + Math.random() * 0.5);
      sparks.push({
        s, a: Math.random() * Math.PI * 2, r: 120 + Math.random() * 210,
        speed: 0.08 + Math.random() * 0.16, phase: Math.random() * 6.28,
      });
    }

    let pulse = 0;
    let pointer = { x: 0, y: 0 };

    return {
      update(t, dt) {
        ring1.rotation = t * ring1.userData.speed;
        ring2.rotation = t * ring2.userData.speed;
        pulse = Math.max(0, pulse - dt * 1.1);
        flame.scale.y = 0.9 + Math.sin(t * 8) * 0.12 + Math.sin(t * 23) * 0.05;
        flame.alpha = 0.8 + Math.sin(t * 11) * 0.15;
        glassGlow.alpha = 0.2 + Math.sin(t * 1.2) * 0.08 + pulse * 0.35;
        eye.alpha = 0.7 + Math.sin(t * 1.6) * 0.2 + pulse * 0.2;
        ring1.alpha = 0.7 + pulse * 0.3;
        ring2.alpha = 0.7 + pulse * 0.3;
        sparks.forEach((p) => {
          const a = p.a + t * p.speed;
          const r = p.r + Math.sin(t * 0.7 + p.phase) * 14;
          p.s.x = 810 + Math.cos(a) * r;
          p.s.y = 470 + Math.sin(a) * r * 0.72;
          p.s.alpha = 0.2 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.4 + p.phase));
        });
      },
      pointer(x, y) { pointer.x = x; pointer.y = y; },
      click() { pulse = 1; },
      destroy() { root.destroy({ children: true }); },
    };
  };

  /* ------------------------------------------------------------
     II. ALCHEMY — the great work
     ------------------------------------------------------------ */
  P.scenes.alchemy = function (ctx) {
    const root = new PIXI.Container();
    ctx.world.addChild(root);
    const { tex } = ctx;

    h.glow(root, tex.glow, 800, 520, 12, 0x5a2a18, 0.38);
    h.glow(root, tex.glow, 800, 430, 7, 0xd1a75f, 0.16);

    /* plate frame */
    const frame = new PIXI.Graphics();
    frame.lineStyle(1.2, C.gold, 0.3).drawRect(240, 90, 1120, 740);
    frame.lineStyle(0.6, C.gold, 0.18).drawRect(254, 104, 1092, 712);
    root.addChild(frame);

    /* furnace */
    const furnace = new PIXI.Graphics();
    furnace.beginFill(0x140d09, 1).drawRect(580, 650, 440, 190).endFill();
    furnace.lineStyle(2, C.gold, 0.35).drawRect(580, 650, 440, 150);
    furnace.lineStyle(1, C.gold, 0.2);
    for (let i = 0; i < 5; i++) { furnace.moveTo(600, 680 + i * 24); furnace.lineTo(1000, 680 + i * 24); }
    for (let i = 0; i < 9; i++) { furnace.moveTo(620 + i * 45, 660); furnace.lineTo(620 + i * 45, 800); }
    furnace.beginFill(0x0a0604, 1).drawRect(700, 700, 200, 100).endFill();
    root.addChild(furnace);

    /* flames */
    const flames = new PIXI.Container();
    flames.position.set(800, 760);
    root.addChild(flames);
    const flameShapes = [];
    for (let i = 0; i < 5; i++) {
      const g = new PIXI.Graphics();
      g.beginFill(i % 2 ? 0xffb347 : 0xd85a32, 0.5).drawEllipse(0, 0, 28 - i * 3, 80 - i * 8).endFill();
      g.position.set((i - 2) * 24, -40 - i * 3);
      flames.addChild(g);
      flameShapes.push(g);
    }
    h.glow(root, tex.glow, 800, 720, 2.4, 0xff8a3d, 0.35);

    /* flask */
    const flask = new PIXI.Graphics();
    flask.lineStyle(2, C.paleGold, 0.55);
    flask.drawCircle(800, 450, 155);
    flask.moveTo(770, 310); flask.lineTo(770, 200);
    flask.moveTo(830, 310); flask.lineTo(830, 200);
    flask.moveTo(750, 200); flask.lineTo(850, 200);
    flask.lineStyle(1.5, C.paleGold, 0.35);
    flask.drawCircle(800, 450, 145);
    root.addChild(flask);

    /* liquid: the lower part of the flask, masked by the glass */
    const liquidMask = new PIXI.Graphics();
    liquidMask.beginFill(0xffffff);
    const lr = 147, surfY = 470;
    const a0 = Math.asin((surfY - 450) / lr);
    liquidMask.moveTo(800 + lr * Math.cos(a0), surfY);
    for (let a = a0; a <= Math.PI - a0; a += 0.035) {
      liquidMask.lineTo(800 + lr * Math.cos(a), 450 + lr * Math.sin(a));
    }
    liquidMask.lineTo(800 + lr * Math.cos(Math.PI - a0), surfY);
    liquidMask.closePath().endFill();
    root.addChild(liquidMask);

    const liquid = new PIXI.Container();
    liquid.mask = liquidMask;
    root.addChild(liquid);

    const surface = new PIXI.Graphics();
    root.addChild(surface);
    const liquidColors = [C.ink, 0xe8d7b0, 0x9b2f25];
    const liquidCircles = liquidColors.map((col) => {
      const g = new PIXI.Graphics();
      g.beginFill(col, 1).drawCircle(800, 450, 150).endFill();
      g.alpha = 0;
      liquid.addChild(g);
      return g;
    });

    /* bubbles */
    const bubbles = [];
    for (let i = 0; i < 24; i++) {
      const s = h.dot(liquid, tex.dot, 700 + Math.random() * 200, 420 + Math.random() * 150, 0.12 + Math.random() * 0.18, C.paleGold, 0.4);
      bubbles.push({ s, y: s.y, speed: 12 + Math.random() * 25, phase: Math.random() * 6.28 });
    }

    /* receiver */
    const receiver = new PIXI.Graphics();
    receiver.lineStyle(2, C.paleGold, 0.5);
    receiver.drawCircle(1080, 450, 64);
    receiver.moveTo(945, 430); receiver.lineTo(1016, 438);
    receiver.moveTo(945, 470); receiver.lineTo(1016, 462);
    root.addChild(receiver);

    /* philosophical tree */
    const tree = new PIXI.Graphics();
    tree.lineStyle(2, C.gold, 0.7);
    tree.moveTo(1080, 450); tree.lineTo(1080, 380);
    tree.moveTo(1080, 410); tree.lineTo(1055, 390); tree.moveTo(1080, 395); tree.lineTo(1105, 375);
    tree.moveTo(1055, 390); tree.lineTo(1045, 372); tree.moveTo(1105, 375); tree.lineTo(1115, 358);
    root.addChild(tree);
    const treeGlow = h.glow(root, tex.glow, 1080, 400, 1.2, C.gold, 0.4);
    const treeLeaves = new PIXI.Graphics();
    treeLeaves.beginFill(C.gold, 0.8);
    [[1055, 390], [1045, 372], [1105, 375], [1115, 358], [1080, 380], [1068, 400]].forEach(([x, y]) => {
      treeLeaves.drawCircle(x, y, 3.5);
    });
    treeLeaves.endFill();
    root.addChild(treeLeaves);

    /* vapor */
    const vapor = [];
    for (let i = 0; i < 40; i++) {
      const s = h.dot(root, tex.dot, 760 + Math.random() * 80, 180 + Math.random() * 80, 0.12 + Math.random() * 0.2, C.paleGold, 0.15);
      vapor.push({ s, x: s.x, y: s.y, speed: 8 + Math.random() * 14, phase: Math.random() * 6.28 });
    }

    /* stage labels */
    const labels = [
      smallCaps(root, "NIGREDO", 560, 810, 13, C.gold, 0.45, 5),
      smallCaps(root, "ALBEDO", 800, 810, 13, C.gold, 0.45, 5),
      smallCaps(root, "RUBEDO", 1040, 810, 13, C.gold, 0.45, 5),
    ];

    let pulse = 0;
    let phaseIndex = -1;

    return {
      update(t, dt) {
        pulse = Math.max(0, pulse - dt * 0.9);
        const p = (t % 18) / 6;
        const idx = Math.floor(p);
        const f = p - idx;
        if (idx !== phaseIndex) {
          phaseIndex = idx;
          labels.forEach((l, i) => { l.alpha = i === idx ? 0.95 : 0.35; });
        }
        const next = (idx + 1) % 3;
        liquidCircles.forEach((g, i) => {
          g.alpha = i === idx ? (1 - f) : i === next ? f : 0;
        });
        flameShapes.forEach((g, i) => {
          g.scale.y = 0.8 + Math.sin(t * 7 + i) * 0.18;
          g.alpha = 0.35 + Math.sin(t * 9 + i * 1.7) * 0.16;
        });
        bubbles.forEach((b) => {
          b.s.y -= b.speed * dt;
          b.s.x += Math.sin(t * 2 + b.phase) * 0.18;
          if (b.s.y < 380) { b.s.y = 590; b.s.x = 700 + Math.random() * 200; }
        });
        vapor.forEach((v) => {
          v.s.y -= v.speed * dt;
          v.s.x += Math.sin(t * 1.2 + v.phase) * 0.12;
          v.s.alpha = 0.08 + 0.1 * (0.5 + 0.5 * Math.sin(t + v.phase));
          if (v.s.y < 80) { v.s.y = 230; v.s.x = 760 + Math.random() * 80; }
        });
        const ts = 1 + Math.sin(t * 1.2) * 0.03 + pulse * 0.08;
        tree.scale.set(ts);
        tree.position.set(1080 * (1 - ts), 450 * (1 - ts));
        treeLeaves.scale.set(ts);
        treeLeaves.position.set(1080 * (1 - ts), 450 * (1 - ts));
        treeGlow.alpha = 0.3 + Math.sin(t * 1.2) * 0.08 + pulse * 0.3;
        surface.clear();
        surface.lineStyle(1.4, C.gold, 0.55);
        for (let x = 660; x <= 940; x += 14) {
          const y = surfY + Math.sin(x * 0.04 + t * 2.2) * 3.2;
          if (x === 660) surface.moveTo(x, y); else surface.lineTo(x, y);
        }
      },
      pointer() {},
      click() { pulse = 1; },
      destroy() { root.destroy({ children: true }); },
    };
  };

  /* ------------------------------------------------------------
     III. ASTROLOGY — as above, so below
     ------------------------------------------------------------ */
  P.scenes.astrology = function (ctx) {
    const root = new PIXI.Container();
    ctx.world.addChild(root);
    const { tex } = ctx;

    h.glow(root, tex.glow, 800, 420, 12, 0x1a2450, 0.35);
    h.glow(root, tex.glow, 800, 760, 6, C.nile, 0.12);

    const stars = h.starfield(root, 120, 0xd8e0ff, 0.4, tex.dot);

    const wheel = new PIXI.Container();
    wheel.position.set(800, 430);
    root.addChild(wheel);

    const outer = new PIXI.Graphics();
    h.circle(outer, 0, 0, 340, C.gold, 0.5, 1.5);
    h.circle(outer, 0, 0, 300, C.gold, 0.32, 1);
    h.circle(outer, 0, 0, 220, C.gold, 0.2, 1);
    h.tickRing(outer, 0, 0, 320, 338, 72, C.gold, 0.35, 1);
    wheel.addChild(outer);

    const zodiac = ["ARI", "TAU", "GEM", "CAN", "LEO", "VIR", "LIB", "SCO", "SAG", "CAP", "AQU", "PIS"];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const t = smallCaps(wheel, zodiac[i], Math.cos(a) * 320, Math.sin(a) * 320, 13, C.paleGold, 0.75, 3);
      t.rotation = a + Math.PI / 2;
      h.line(outer, 0, 0, Math.cos(a) * 300, Math.sin(a) * 300, C.gold, 0.12, 1);
    }

    const inner = new PIXI.Container();
    wheel.addChild(inner);
    const ringG = new PIXI.Graphics();
    [260, 210, 160, 110, 70].forEach((r) => h.circle(ringG, 0, 0, r, C.gold, 0.13, 1));
    inner.addChild(ringG);

    const planetColors = [0xd8e0ff, 0xd1a75f, 0xc15a3a, 0x6fc8d6, 0xe8d4ad, 0x8a6fae, 0xb8863b];
    const planets = [];
    for (let i = 0; i < 7; i++) {
      const r = 70 + i * 32;
      const s = h.glow(inner, tex.glow, 0, 0, 0.55, planetColors[i], 0.9);
      planets.push({ s, r, a: i * 1.1, speed: 0.12 + i * 0.03 });
    }

    const earth = new PIXI.Graphics();
    earth.beginFill(0x254a5a, 1).drawCircle(800, 430, 34).endFill();
    earth.lineStyle(1.5, C.gold, 0.6).drawCircle(800, 430, 34);
    earth.lineStyle(1, C.paleGold, 0.25).drawEllipse(800, 430, 34, 12);
    root.addChild(earth);

    /* landscape below */
    const land = new PIXI.Graphics();
    land.beginFill(0x090d16, 0.9);
    land.drawPolygon([120, 900, 120, 800, 300, 700, 430, 790, 560, 720, 720, 820, 900, 740, 1080, 810, 1240, 730, 1480, 820, 1480, 900]);
    land.endFill();
    land.lineStyle(1, C.gold, 0.2).drawPolygon([120, 800, 300, 700, 430, 790, 560, 720, 720, 820, 900, 740, 1080, 810, 1240, 730, 1480, 820]);
    root.addChild(land);

    const beam = new PIXI.Graphics();
    beam.beginFill(0xd8e0ff, 0.05).drawPolygon([800, 460, 800, 780, 860, 780, 820, 460]).endFill();
    root.addChild(beam);
    const beamGlow = h.glow(root, tex.glow, 800, 620, 2.2, 0x8fb8d8, 0.12);

    let pulse = 0;
    return {
      update(t, dt) {
        pulse = Math.max(0, pulse - dt * 1.2);
        wheel.rotation = t * 0.012;
        inner.rotation = -t * 0.03;
        planets.forEach((p, i) => {
          const a = p.a + t * p.speed;
          p.s.x = Math.cos(a) * p.r;
          p.s.y = Math.sin(a) * p.r * 0.92;
          p.s.alpha = 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.4 + i)) + pulse * 0.2;
        });
        beamGlow.alpha = 0.1 + Math.sin(t * 1.5) * 0.04 + pulse * 0.3;
        stars.forEach((s) => { s.sprite.alpha = 0.15 + 0.3 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase)); });
      },
      pointer() {},
      click() { pulse = 1; },
      destroy() { root.destroy({ children: true }); },
    };
  };

  /* ------------------------------------------------------------
     IV. GNOSTICISM — the spark and the archons
     ------------------------------------------------------------ */
  P.scenes.gnosticism = function (ctx) {
    const root = new PIXI.Container();
    ctx.world.addChild(root);
    const { tex } = ctx;

    h.glow(root, tex.glow, 800, 450, 11, 0x162444, 0.35);
    const stars = h.starfield(root, 110, 0xaac8ff, 0.35, tex.dot);

    /* pleroma */
    const pleroma = new PIXI.Container();
    pleroma.position.set(800, 155);
    root.addChild(pleroma);
    h.glow(pleroma, tex.glow, 0, 0, 2.6, 0xcfe4ff, 0.5);
    const aeons = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const s = h.dot(pleroma, tex.dot, Math.cos(a) * 72, Math.sin(a) * 72, 0.42, 0xd8e8ff, 0.65);
      aeons.push({ s, a, r: 72 });
    }
    h.dot(pleroma, tex.dot, 0, 0, 0.9, 0xffffff, 0.9);

    /* vertical filament */
    const filament = new PIXI.Graphics();
    filament.lineStyle(1, 0x9fc7ff, 0.22);
    filament.moveTo(800, 200);
    filament.lineTo(800, 650);
    root.addChild(filament);
    const filamentGlow = h.glow(root, tex.glow, 800, 430, 2.4, 0x6f9fd8, 0.1);

    /* archon rings */
    const rings = [];
    for (let i = 0; i < 7; i++) {
      const r = 90 + i * 40;
      const c = new PIXI.Container();
      c.position.set(800, 450);
      const g = new PIXI.Graphics();
      const segs = 12;
      for (let k = 0; k < segs; k++) {
        const a1 = (k / segs) * Math.PI * 2 + 0.035;
        const a2 = ((k + 1) / segs) * Math.PI * 2 - 0.035;
        g.lineStyle(1.3, i % 2 ? 0x6f8bb8 : 0xd1a75f, 0.26 + i * 0.02);
        g.arc(0, 0, r, a1, a2);
      }
      c.addChild(g);

      const eye = new PIXI.Graphics();
      eye.lineStyle(1, 0xd8e8ff, 0.55);
      eye.moveTo(-16, -r);
      eye.bezierCurveTo(-8, -r - 9, 8, -r - 9, 16, -r);
      eye.bezierCurveTo(8, -r + 9, -8, -r + 9, -16, -r);
      eye.beginFill(0x9fc7ff, 0.8).drawCircle(0, -r, 3.5).endFill();
      c.addChild(eye);

      c.userData = { speed: (i % 2 ? -1 : 1) * (0.025 + i * 0.008), eye };
      root.addChild(c);
      rings.push(c);
    }

    /* trapped spark */
    const dark = new PIXI.Graphics();
    dark.beginFill(0x05070c, 0.95).drawCircle(800, 620, 74).endFill();
    dark.lineStyle(1.2, 0x6f8bb8, 0.4).drawCircle(800, 620, 74);
    root.addChild(dark);
    const spark = h.glow(root, tex.glow, 800, 620, 1.1, 0xffffff, 0.9);
    const sparkCore = h.dot(root, tex.dot, 800, 620, 0.65, 0xffffff, 1);

    /* ascending sparks */
    const parts = [];
    for (let i = 0; i < 55; i++) {
      const s = h.dot(root, tex.dot, 800, 620, 0.18 + Math.random() * 0.16, i % 4 ? 0xd8e8ff : 0xffe1a0, 0.5);
      parts.push({
        s, y: 620 - Math.random() * 380, x: 800 + (Math.random() - 0.5) * 30,
        speed: 14 + Math.random() * 30, phase: Math.random() * 6.28,
      });
    }

    let pulse = 0;
    return {
      update(t, dt) {
        pulse = Math.max(0, pulse - dt * 0.9);
        rings.forEach((c, i) => {
          c.rotation = t * c.userData.speed;
          c.userData.eye.scale.y = Math.max(0.08, Math.abs(Math.sin(t * 0.8 + i)));
        });
        aeons.forEach((a, i) => {
          const ang = a.a + t * 0.04;
          a.s.x = Math.cos(ang) * a.r;
          a.s.y = Math.sin(ang) * a.r;
          a.s.alpha = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.2 + i));
        });
        spark.alpha = 0.7 + Math.sin(t * 2.2) * 0.2 + pulse * 0.2;
        const sv = 1.1 + Math.sin(t * 2.2) * 0.08 + pulse * 0.4;
        spark.scale.set(sv, sv);
        sparkCore.alpha = 0.8 + Math.sin(t * 3) * 0.15;
        filamentGlow.alpha = 0.08 + Math.sin(t * 1.1) * 0.04 + pulse * 0.25;
        parts.forEach((p) => {
          p.s.y -= p.speed * dt;
          p.s.x = p.x + Math.sin(t * 0.8 + p.phase) * 18;
          p.s.alpha = 0.1 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.6 + p.phase));
          if (p.s.y < 150) {
            p.s.y = 620;
            p.x = 800 + (Math.random() - 0.5) * 30;
          }
        });
        stars.forEach((s) => { s.sprite.alpha = 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase)); });
      },
      pointer() {},
      click() { pulse = 1; },
      destroy() { root.destroy({ children: true }); },
    };
  };

  /* ------------------------------------------------------------
     V. HERMETIC LITERATURE — the Corpus Hermeticum
     ------------------------------------------------------------ */
  P.scenes.hermetic = function (ctx) {
    const root = new PIXI.Container();
    ctx.world.addChild(root);
    const { tex } = ctx;

    h.glow(root, tex.glow, 800, 420, 12, 0x5a4620, 0.28);

    /* seal */
    const seal = new PIXI.Container();
    seal.position.set(800, 190);
    root.addChild(seal);
    const sealG = new PIXI.Graphics();
    h.circle(sealG, 0, 0, 78, C.gold, 0.55, 2);
    h.circle(sealG, 0, 0, 68, C.gold, 0.3, 1);
    h.tickRing(sealG, 0, 0, 80, 88, 24, C.gold, 0.35, 1);
    /* caduceus */
    sealG.lineStyle(3, C.paleGold, 0.8);
    sealG.moveTo(0, -46); sealG.lineTo(0, 40);
    sealG.lineStyle(1.8, C.paleGold, 0.7);
    sealG.moveTo(0, -36);
    sealG.bezierCurveTo(-26, -22, -26, -4, 0, 4);
    sealG.bezierCurveTo(26, 12, 26, 28, 0, 38);
    sealG.moveTo(0, -36);
    sealG.bezierCurveTo(26, -22, 26, -4, 0, 4);
    sealG.bezierCurveTo(-26, 12, -26, 28, 0, 38);
    /* wings */
    sealG.moveTo(-10, -40); sealG.bezierCurveTo(-40, -58, -58, -44, -62, -30);
    sealG.moveTo(10, -40); sealG.bezierCurveTo(40, -58, 58, -44, 62, -30);
    seal.addChild(sealG);
    h.glow(root, tex.glow, 800, 190, 2.6, C.gold, 0.35);

    /* scroll */
    const scroll = new PIXI.Container();
    root.addChild(scroll);
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.35).drawRect(274, 318, 1080, 390).endFill();
    scroll.addChild(shadow);
    const paper = new PIXI.Graphics();
    paper.beginFill(0xdcc59b, 0.97).drawRect(260, 300, 1080, 390).endFill();
    paper.lineStyle(1.4, C.ink, 0.55).drawRect(260, 300, 1080, 390);
    paper.lineStyle(0.6, C.ink, 0.25).drawRect(272, 312, 1056, 366);
    scroll.addChild(paper);

    const content = new PIXI.Container();
    scroll.addChild(content);
    const ink = new PIXI.Graphics();
    const headers = ["ΕΡΜΗΣ", "ΝΟΥΣ", "ΛΟΓΟΣ"];
    for (let c = 0; c < 3; c++) {
      const x = 380 + c * 320;
      const ht = h.text(headers[c], 34, C.ink, 0.82, { fontFamily: "Palatino, Georgia, serif", letterSpacing: 6 });
      ht.position.set(x, 360);
      content.addChild(ht);
      ink.lineStyle(0.8, C.ink, 0.2);
      ink.moveTo(x - 120, 378);
      ink.lineTo(x + 50, 378);
      for (let i = 0; i < 14; i++) {
        const w = 150 + ((i * 37 + c * 53) % 110);
        ink.lineStyle(1, C.ink, 0.24 + (i % 4) * 0.03);
        ink.moveTo(x - 120, 394 + i * 15);
        ink.lineTo(x - 120 + w, 394 + i * 15);
      }
      ink.lineStyle(1.2, C.ink, 0.4);
      ink.moveTo(x - 120, 612);
      ink.lineTo(x + 92, 612);
      ink.beginFill(C.oxblood, 0.65).drawRect(x - 120, 406, 3, 3).endFill();
    }
    ink.lineStyle(0.8, C.ink, 0.2);
    ink.moveTo(560, 330); ink.lineTo(560, 650);
    ink.moveTo(880, 330); ink.lineTo(880, 650);
    content.addChild(ink);

    /* red wax seal */
    const wax = new PIXI.Graphics();
    wax.beginFill(0x7d2d22, 0.9).drawCircle(1260, 640, 28).endFill();
    wax.lineStyle(1, 0xe0a05f, 0.4).drawCircle(1260, 640, 28);
    wax.lineStyle(1, 0xe0a05f, 0.35).drawCircle(1260, 640, 18);
    wax.moveTo(1260, 628); wax.lineTo(1260, 652);
    wax.moveTo(1248, 640); wax.lineTo(1272, 640);
    content.addChild(wax);

    /* mask reveal */
    const mask = new PIXI.Graphics();
    root.addChild(mask);
    content.mask = mask;

    /* rods */
    const rods = new PIXI.Graphics();
    rods.beginFill(0x7a5a36, 1).drawRoundedRect(238, 280, 26, 430, 12).endFill();
    rods.beginFill(0x7a5a36, 1).drawRoundedRect(1336, 280, 26, 430, 12).endFill();
    rods.lineStyle(1, C.gold, 0.5).drawRoundedRect(238, 280, 26, 430, 12);
    rods.lineStyle(1, C.gold, 0.5).drawRoundedRect(1336, 280, 26, 430, 12);
    root.addChild(rods);

    /* floating Greek letters */
    const letters = ["Λ", "Ο", "Γ", "Ο", "Σ", "Ν", "Ο", "Υ", "Σ", "Ζ", "Ω", "Η"];
    const float = [];
    for (let i = 0; i < 18; i++) {
      const s = h.text(letters[i % letters.length], 18 + Math.random() * 18, C.gold, 0.18, { fontFamily: "Palatino, Georgia, serif" });
      s.position.set(300 + Math.random() * 1000, 250 + Math.random() * 480);
      s.alpha = 0.14 + Math.random() * 0.18;
      root.addChild(s);
      float.push({ s, y: s.y, phase: Math.random() * 6.28, speed: 2 + Math.random() * 5, baseAlpha: s.alpha });
    }

    const beam = new PIXI.Graphics();
    beam.beginFill(0xd1a75f, 0.04).drawPolygon([760, 250, 840, 250, 960, 700, 640, 700]).endFill();
    root.addChild(beam);

    let reveal = 0;
    let pulse = 0;
    return {
      update(t, dt) {
        reveal = Math.min(1080, reveal + dt * 210);
        mask.clear();
        mask.beginFill(0xffffff).drawRect(260, 300, reveal, 390).endFill();
        pulse = Math.max(0, pulse - dt * 1.1);
        seal.rotation = Math.sin(t * 0.25) * 0.04;
        seal.alpha = 0.8 + Math.sin(t * 1.4) * 0.1 + pulse * 0.1;
        float.forEach((f) => {
          f.s.y -= f.speed * dt;
          f.s.x += Math.sin(t * 0.4 + f.phase) * 0.1;
          f.s.alpha = f.baseAlpha * (0.55 + 0.45 * Math.sin(t + f.phase));
          if (f.s.y < 240) f.s.y = 740;
        });
        beam.alpha = 0.6 + Math.sin(t * 1.2) * 0.2;
      },
      pointer() {},
      click() { reveal = 0; pulse = 1; },
      destroy() { root.destroy({ children: true }); },
    };
  };

  /* ------------------------------------------------------------
     VI. FREEMASONRY — the tracing board
     ------------------------------------------------------------ */
  P.scenes.freemasonry = function (ctx) {
    const root = new PIXI.Container();
    ctx.world.addChild(root);
    const { tex } = ctx;

    h.glow(root, tex.glow, 800, 430, 12, 0x16244a, 0.3);
    const stars = h.starfield(root, 90, 0xaac8ff, 0.3, tex.dot);

    const board = new PIXI.Container();
    root.addChild(board);

    /* frame */
    const frame = new PIXI.Graphics();
    frame.lineStyle(2, C.gold, 0.5).drawRect(280, 150, 1040, 610);
    frame.lineStyle(0.7, C.gold, 0.3).drawRect(294, 164, 1012, 582);
    board.addChild(frame);

    /* blazing star */
    const star = new PIXI.Container();
    star.position.set(800, 235);
    const starG = new PIXI.Graphics();
    h.star(starG, 0, 0, 8, 54, 18, C.paleGold, 0.8, 1.5);
    h.circle(starG, 0, 0, 8, C.paleGold, 0.7);
    star.addChild(starG);
    board.addChild(star);
    const starGlow = h.glow(root, tex.glow, 800, 235, 1.6, C.gold, 0.4);

    /* square and compass */
    const tools = new PIXI.Graphics();
    tools.lineStyle(10, C.paleGold, 0.85);
    tools.moveTo(800, 300); tools.lineTo(700, 470);
    tools.moveTo(800, 300); tools.lineTo(900, 470);
    tools.lineStyle(10, C.gold, 0.8);
    tools.moveTo(700, 430); tools.lineTo(900, 430); tools.lineTo(900, 490);
    tools.lineStyle(1.5, C.gold, 0.5);
    tools.drawCircle(800, 300, 16);
    board.addChild(tools);

    const G = h.text("G", 72, C.paleGold, 0.95, { fontFamily: "Georgia, serif" });
    G.position.set(800, 390);
    board.addChild(G);
    const gGlow = h.glow(root, tex.glow, 800, 390, 1.7, C.gold, 0.3);

    /* columns */
    function column(x, tint) {
      const c = new PIXI.Graphics();
      c.beginFill(0x14203a, 1).drawRect(x - 34, 480, 68, 190).endFill();
      c.lineStyle(1.5, tint, 0.5).drawRect(x - 34, 480, 68, 190);
      c.lineStyle(1, tint, 0.3);
      for (let i = 0; i < 4; i++) { c.moveTo(x - 22 + i * 14, 490); c.lineTo(x - 22 + i * 14, 660); }
      c.beginFill(0x14203a, 1).drawRect(x - 46, 460, 92, 22).endFill();
      c.lineStyle(1.2, tint, 0.45).drawRect(x - 46, 460, 92, 22);
      c.beginFill(0x14203a, 1).drawRect(x - 42, 664, 84, 18).endFill();
      c.lineStyle(1.2, tint, 0.45).drawRect(x - 42, 664, 84, 18);
      board.addChild(c);
      const globeBg = new PIXI.Graphics();
      globeBg.beginFill(0x0d1428, 1).drawCircle(x, 430, 28).endFill();
      board.addChild(globeBg);
      const globe = new PIXI.Graphics();
      globe.lineStyle(1.2, tint, 0.6).drawCircle(x, 430, 28);
      globe.lineStyle(0.7, tint, 0.3).drawEllipse(x, 430, 28, 10);
      globe.moveTo(x, 402); globe.lineTo(x, 458);
      board.addChild(globe);
      h.glow(board, tex.glow, x, 430, 0.9, tint, 0.3);
    }
    column(470, C.paleGold);
    column(1130, C.paleGold);

    /* mosaic pavement */
    const pavement = new PIXI.Graphics();
    const topY = 660, bottomY = 780, topW = 700, bottomW = 840, rows = 5, cols = 8;
    for (let r = 0; r < rows; r++) {
      const y1 = topY + (r / rows) * (bottomY - topY);
      const y2 = topY + ((r + 1) / rows) * (bottomY - topY);
      const w1 = topW + (bottomW - topW) * (r / rows);
      const w2 = topW + (bottomW - topW) * ((r + 1) / rows);
      for (let c = 0; c < cols; c++) {
        const x1 = 800 - w1 / 2 + (c / cols) * w1;
        const x2 = 800 - w1 / 2 + ((c + 1) / cols) * w1;
        const x3 = 800 - w2 / 2 + ((c + 1) / cols) * w2;
        const x4 = 800 - w2 / 2 + (c / cols) * w2;
        const light = (r + c) % 2 === 0;
        pavement.beginFill(light ? 0x24385e : 0x0b1224, light ? 0.7 : 0.9);
        pavement.drawPolygon([x1, y1, x2, y1, x3, y2, x4, y2]);
        pavement.endFill();
        pavement.lineStyle(0.5, C.gold, 0.18);
        pavement.drawPolygon([x1, y1, x2, y1, x3, y2, x4, y2]);
      }
    }
    board.addChild(pavement);

    /* ashlars */
    function ashlar(x, y, rough) {
      const g = new PIXI.Graphics();
      g.beginFill(0x182642, 1);
      if (rough) {
        g.drawPolygon([x - 34, y, x - 20, y - 34, x + 22, y - 28, x + 34, y]);
      } else {
        g.drawPolygon([x - 32, y, x - 32, y - 46, x + 32, y - 46, x + 32, y]);
      }
      g.endFill();
      g.lineStyle(1, C.gold, rough ? 0.4 : 0.7);
      if (rough) g.drawPolygon([x - 34, y, x - 20, y - 34, x + 22, y - 28, x + 34, y]);
      else g.drawPolygon([x - 32, y, x - 32, y - 46, x + 32, y - 46, x + 32, y]);
      board.addChild(g);
    }
    ashlar(370, 720, true);
    ashlar(1230, 720, false);

    /* sun and moon */
    const sun = new PIXI.Graphics();
    sun.lineStyle(1.2, C.gold, 0.5).drawCircle(360, 220, 26);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      h.line(sun, 360 + Math.cos(a) * 32, 220 + Math.sin(a) * 32, 360 + Math.cos(a) * 42, 220 + Math.sin(a) * 42, C.gold, 0.35, 1);
    }
    board.addChild(sun);
    const moon = new PIXI.Graphics();
    moon.lineStyle(1.2, C.paleGold, 0.5).drawCircle(1240, 220, 26);
    moon.beginFill(0x0a1230, 1).drawCircle(1250, 214, 24).endFill();
    board.addChild(moon);

    /* moving sweep */
    const sweep = new PIXI.Graphics();
    sweep.beginFill(C.gold, 0.03).drawRect(0, 150, 14, 610).endFill();
    board.addChild(sweep);

    let pulse = 0;
    return {
      update(t, dt) {
        pulse = Math.max(0, pulse - dt * 0.8);
        board.alpha = Math.min(1, t * 0.9);
        star.rotation = t * 0.03;
        const ss = 1 + Math.sin(t * 1.4) * 0.03 + pulse * 0.1;
        starG.scale.set(ss, ss);
        starGlow.alpha = 0.28 + Math.sin(t * 1.4) * 0.08 + pulse * 0.3;
        const gs = 1 + Math.sin(t * 1.1) * 0.02 + pulse * 0.06;
        G.scale.set(gs, gs);
        gGlow.alpha = 0.22 + Math.sin(t * 1.1) * 0.06 + pulse * 0.25;
        sweep.x = 280 + ((t * 55) % 1040);
        sweep.alpha = 0.6;
        stars.forEach((s) => { s.sprite.alpha = 0.12 + 0.25 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase)); });
      },
      pointer() {},
      click() { pulse = 1; },
      destroy() { root.destroy({ children: true }); },
    };
  };

  /* ------------------------------------------------------------
     VII. THEOSOPHICAL SOCIETY — the seven globes
     ------------------------------------------------------------ */
  P.scenes.theosophy = function (ctx) {
    const root = new PIXI.Container();
    ctx.world.addChild(root);
    const { tex } = ctx;

    h.glow(root, tex.glow, 800, 420, 13, 0x3a2458, 0.32);
    h.glow(root, tex.glow, 800, 520, 6, C.teal, 0.14);
    const stars = h.starfield(root, 130, 0xd8d0ff, 0.35, tex.dot);

    const points = [];
    for (let i = 0; i < 7; i++) {
      const x = 270 + i * 176.66;
      const y = 600 - Math.sin((i / 6) * Math.PI) * 230;
      points.push({ x, y });
    }

    const colors = [0x8a6fae, 0x6a7fbf, 0x4f8fb0, 0x2b8a7a, 0x6faa5a, 0xd1a75f, 0xf2dca6];

    /* chain */
    const chain = new PIXI.Graphics();
    chain.lineStyle(1.2, C.gold, 0.28);
    chain.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) chain.lineTo(points[i].x, points[i].y);
    root.addChild(chain);

    /* rays from the centre to each globe */
    const rays = new PIXI.Graphics();
    points.forEach((p) => {
      h.line(rays, 800, 445, p.x, p.y, C.gold, 0.07, 1);
    });
    root.addChild(rays);
    h.glow(root, tex.glow, 800, 445, 4.4, 0x8a6fae, 0.12);

    /* globes */
    const globes = [];
    points.forEach((p, i) => {
      const glow = h.glow(root, tex.glow, p.x, p.y, 2.0, colors[i], 0.55);
      const g = new PIXI.Graphics();
      g.beginFill(0x0b0907, 0.9).drawCircle(p.x, p.y, 50).endFill();
      g.lineStyle(1.6, colors[i], 0.85).drawCircle(p.x, p.y, 50);
      g.lineStyle(0.8, C.ivory, 0.35).drawEllipse(p.x, p.y, 50, 18);
      g.moveTo(p.x, p.y - 50); g.lineTo(p.x, p.y + 50);
      g.lineStyle(0.7, colors[i], 0.35).drawEllipse(p.x, p.y, 18, 50);
      root.addChild(g);
      const label = smallCaps(root, ["I", "II", "III", "IV", "V", "VI", "VII"][i], p.x, p.y + 74, 12, C.paleGold, 0.75, 2);
      globes.push({ glow, ring: g, label, base: 0.5, phase: i * 0.9 });
    });

    /* hexagram + ankh */
    const emblem = new PIXI.Container();
    emblem.position.set(800, 445);
    root.addChild(emblem);
    const eg = new PIXI.Graphics();
    function triangle(g, rot, r) {
      for (let i = 0; i <= 3; i++) {
        const a = rot + (i % 3) * (Math.PI * 2 / 3);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
    }
    eg.lineStyle(1.4, C.gold, 0.5);
    triangle(eg, -Math.PI / 2, 150);
    triangle(eg, Math.PI / 2, 150);
    h.circle(eg, 0, 0, 170, C.gold, 0.28, 1);
    /* ankh */
    eg.lineStyle(2, C.paleGold, 0.6);
    eg.drawCircle(0, 0, 28);
    eg.moveTo(0, 28); eg.lineTo(0, 92);
    eg.moveTo(-24, 50); eg.lineTo(24, 50);
    emblem.addChild(eg);
    h.glow(root, tex.glow, 800, 445, 3.0, C.gold, 0.28);

    /* travelling pulse */
    const pulseDot = h.dot(root, tex.dot, points[0].x, points[0].y, 0.6, 0xffffff, 0.9);

    let pulse = 0;
    return {
      update(t, dt) {
        pulse = Math.max(0, pulse - dt * 0.8);
        globes.forEach((g, i) => {
          const p = 0.5 + 0.5 * Math.sin(t * 1.2 - i * 0.55);
          g.glow.alpha = 0.32 + p * 0.4 + pulse * 0.2;
          const gv = 2.0 + p * 0.15;
          g.glow.scale.set(gv, gv);
          g.ring.alpha = 0.75 + p * 0.25;
          g.label.alpha = 0.5 + p * 0.35;
        });
        emblem.rotation = Math.sin(t * 0.2) * 0.04;
        const u = (t * 0.35) % 6;
        const i0 = Math.floor(u);
        const f = u - i0;
        pulseDot.x = points[i0].x + (points[i0 + 1].x - points[i0].x) * f;
        pulseDot.y = points[i0].y + (points[i0 + 1].y - points[i0].y) * f;
        pulseDot.alpha = 0.8;
        stars.forEach((s) => { s.sprite.alpha = 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase)); });
      },
      pointer() {},
      click() { pulse = 1; },
      destroy() { root.destroy({ children: true }); },
    };
  };

  /* ------------------------------------------------------------
     VIII. UFO TRADITIONS — contact
     ------------------------------------------------------------ */
  P.scenes.ufo = function (ctx) {
    const root = new PIXI.Container();
    ctx.world.addChild(root);
    const { tex } = ctx;

    h.glow(root, tex.glow, 800, 300, 13, 0x12324a, 0.35);
    const stars = h.starfield(root, 180, 0xbce8ff, 0.5, tex.dot);

    /* halftone texture */
    const dots = new PIXI.Graphics();
    for (let y = 40; y < 900; y += 28) {
      for (let x = 40; x < 1600; x += 28) {
        dots.beginFill(0x9fd8e8, 0.025).drawCircle(x, y, 1.1).endFill();
      }
    }
    root.addChild(dots);

    /* mountains */
    const land = new PIXI.Graphics();
    land.beginFill(0x050b12, 1).drawPolygon([0, 900, 0, 760, 220, 680, 400, 750, 600, 690, 820, 770, 1020, 700, 1240, 760, 1420, 690, 1600, 750, 1600, 900]).endFill();
    land.lineStyle(1, 0x2b5a6a, 0.5).drawPolygon([0, 760, 220, 680, 400, 750, 600, 690, 820, 770, 1020, 700, 1240, 760, 1420, 690, 1600, 750]);
    root.addChild(land);

    /* radar */
    const radar = new PIXI.Container();
    radar.position.set(250, 740);
    root.addChild(radar);
    const rg = new PIXI.Graphics();
    rg.lineStyle(1, 0x6fc8d6, 0.35).drawCircle(0, 0, 90);
    rg.lineStyle(1, 0x6fc8d6, 0.22).drawCircle(0, 0, 60);
    rg.lineStyle(1, 0x6fc8d6, 0.14).drawCircle(0, 0, 30);
    h.line(rg, 0, 0, 0, -90, 0x6fc8d6, 0.2, 1);
    h.line(rg, 0, 0, 78, 45, 0x6fc8d6, 0.2, 1);
    h.line(rg, 0, 0, -78, 45, 0x6fc8d6, 0.2, 1);
    radar.addChild(rg);
    const sweep = new PIXI.Graphics();
    sweep.beginFill(0x6fc8d6, 0.08).drawPolygon([0, 0, 0, -90, 90, -90]).endFill();
    radar.addChild(sweep);
    const radarCore = h.dot(radar, tex.dot, 0, 0, 0.25, 0xffffff, 0.9);

    /* radio tower */
    const tower = new PIXI.Graphics();
    tower.lineStyle(1.5, 0x6fc8d6, 0.35);
    tower.moveTo(1320, 720); tower.lineTo(1320, 520);
    tower.moveTo(1300, 720); tower.lineTo(1320, 520); tower.lineTo(1340, 720);
    tower.moveTo(1305, 650); tower.lineTo(1335, 650);
    tower.moveTo(1310, 590); tower.lineTo(1330, 590);
    root.addChild(tower);
    const waves = [];
    for (let i = 0; i < 3; i++) {
      const w = new PIXI.Graphics();
      w.lineStyle(1, 0x6fc8d6, 0.2).arc(1320, 520, 40 + i * 26, -Math.PI * 0.8, -Math.PI * 0.2);
      root.addChild(w);
      waves.push(w);
    }

    /* saucers */
    function saucer(x, y, scale) {
      const c = new PIXI.Container();
      c.position.set(x, y);
      c.scale.set(scale);
      const body = new PIXI.Graphics();
      body.beginFill(0x1c3440, 0.95).drawEllipse(0, 0, 110, 28).endFill();
      body.lineStyle(1.4, 0x8fe0e8, 0.6).drawEllipse(0, 0, 110, 28);
      body.beginFill(0xbce8ff, 0.28).drawEllipse(0, -22, 42, 26).endFill();
      body.lineStyle(1, 0xbce8ff, 0.5).drawEllipse(0, -22, 42, 26);
      body.beginFill(0x6fc8d6, 0.55).drawEllipse(0, 4, 80, 10).endFill();
      for (let i = -3; i <= 3; i++) {
        body.beginFill(i % 2 ? 0xffd27a : 0xc15a3a, 0.8).drawCircle(i * 24, 10, 3).endFill();
      }
      c.addChild(body);
      root.addChild(c);
      return c;
    }
    const saucer1 = saucer(800, 330, 1.2);
    const saucer2 = saucer(430, 220, 0.65);
    const saucer3 = saucer(1180, 200, 0.5);

    /* beam */
    const beam = new PIXI.Graphics();
    beam.beginFill(0x8fe0e8, 0.08).drawPolygon([740, 350, 860, 350, 940, 720, 660, 720]).endFill();
    beam.lineStyle(1, 0x8fe0e8, 0.2);
    beam.moveTo(740, 350); beam.lineTo(660, 720);
    beam.moveTo(860, 350); beam.lineTo(940, 720);
    root.addChild(beam);
    h.glow(root, tex.glow, 800, 430, 3.4, 0x6fc8d6, 0.18);

    let pulse = 0;
    return {
      update(t, dt) {
        pulse = Math.max(0, pulse - dt * 0.8);
        saucer1.y = 330 + Math.sin(t * 0.8) * 10;
        saucer2.x = 430 + Math.sin(t * 0.35) * 40;
        saucer2.y = 220 + Math.sin(t * 0.7 + 1) * 8;
        saucer3.x = 1180 + Math.sin(t * 0.3 + 2) * 55;
        saucer3.y = 200 + Math.sin(t * 0.6 + 2) * 7;
        beam.alpha = 0.55 + Math.sin(t * 1.6) * 0.25 + pulse * 0.3;
        sweep.rotation = t * 1.2;
        radarCore.alpha = 0.6 + Math.sin(t * 3) * 0.3;
        waves.forEach((w, i) => {
          w.alpha = 0.1 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.5 - i));
        });
        stars.forEach((s) => { s.sprite.alpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase)); });
      },
      pointer() {},
      click() { pulse = 1; },
      destroy() { root.destroy({ children: true }); },
    };
  };
})();
