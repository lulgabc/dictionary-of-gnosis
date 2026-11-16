/* Shared Pixi helpers for the pilot scenes. All scenes are drawn on a
   1600 x 900 virtual stage and scaled by the player. */
(function () {
  "use strict";

  const P = (window.PILOT = window.PILOT || {});
  P.W = 1600;
  P.H = 900;
  P.C = {
    black: 0x0b0907,
    ink: 0x241c15,
    gold: 0xd1a75f,
    paleGold: 0xf2dca6,
    ivory: 0xe9dfcc,
    parchment: 0xe8d4ad,
    oxblood: 0x8b3a2a,
    red: 0xc15a3a,
    indigo: 0x0d1226,
    deepBlue: 0x1b2a4a,
    nile: 0x3f6f78,
    cyan: 0x6fc8d6,
    violet: 0x6a4b8a,
    teal: 0x2b6f6a,
    pewter: 0x8b8378,
  };

  function makeDot(size) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const rg = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    rg.addColorStop(0, "rgba(255,255,255,1)");
    rg.addColorStop(0.3, "rgba(255,240,200,.95)");
    rg.addColorStop(1, "rgba(255,220,150,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, size, size);
    return PIXI.Texture.from(c);
  }

  function makeGlow(size) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const rg = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    rg.addColorStop(0, "rgba(255,250,225,.95)");
    rg.addColorStop(0.16, "rgba(255,225,160,.7)");
    rg.addColorStop(0.45, "rgba(220,160,80,.18)");
    rg.addColorStop(1, "rgba(220,160,80,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, size, size);
    return PIXI.Texture.from(c);
  }

  P.initTextures = function () {
    if (P.textures) return P.textures;
    P.textures = { dot: makeDot(24), glow: makeGlow(128) };
    return P.textures;
  };

  P.h = {
    text(str, size, color, alpha, opts) {
      const style = Object.assign({
        fontFamily: "Iowan Old Style, Palatino, Georgia, serif",
        fontSize: size,
        fill: color,
        align: "center",
      }, opts || {});
      const t = new PIXI.Text(str, style);
      t.anchor.set(0.5);
      t.alpha = alpha == null ? 1 : alpha;
      t.resolution = 2;
      return t;
    },

    line(g, x1, y1, x2, y2, color, alpha, width) {
      g.lineStyle(width || 1, color == null ? P.C.gold : color, alpha == null ? 1 : alpha);
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
    },

    circle(g, x, y, r, color, alpha, width) {
      if (width) {
        g.lineStyle(width, color, alpha == null ? 1 : alpha);
        g.drawCircle(x, y, r);
      } else {
        g.beginFill(color, alpha == null ? 1 : alpha);
        g.drawCircle(x, y, r);
        g.endFill();
      }
    },

    ring(g, x, y, rx, ry, color, alpha, width) {
      g.lineStyle(width || 1, color == null ? P.C.gold : color, alpha == null ? 1 : alpha);
      g.drawEllipse(x, y, rx, ry);
    },

    star(g, x, y, points, outer, inner, color, alpha, width) {
      g.lineStyle(width || 1, color, alpha == null ? 1 : alpha);
      for (let i = 0; i <= points * 2; i++) {
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.closePath();
    },

    glow(layer, tex, x, y, scale, color, alpha) {
      const s = new PIXI.Sprite(tex || P.textures.glow);
      s.anchor.set(0.5);
      s.position.set(x, y);
      s.scale.set(scale);
      s.tint = color == null ? P.C.gold : color;
      s.alpha = alpha == null ? 0.6 : alpha;
      s.blendMode = PIXI.BLEND_MODES.ADD;
      layer.addChild(s);
      return s;
    },

    dot(layer, tex, x, y, scale, color, alpha) {
      const s = new PIXI.Sprite(tex || P.textures.dot);
      s.anchor.set(0.5);
      s.position.set(x, y);
      s.scale.set(scale);
      s.tint = color == null ? P.C.gold : color;
      s.alpha = alpha == null ? 0.7 : alpha;
      s.blendMode = PIXI.BLEND_MODES.ADD;
      layer.addChild(s);
      return s;
    },

    starfield(layer, count, color, alpha, tex) {
      const out = [];
      for (let i = 0; i < count; i++) {
        const s = new PIXI.Sprite(tex || P.textures.dot);
        s.anchor.set(0.5);
        s.position.set(Math.random() * P.W, Math.random() * P.H);
        s.scale.set(0.08 + Math.random() * 0.22);
        s.tint = color == null ? P.C.gold : color;
        s.alpha = (alpha == null ? 0.5 : alpha) * (0.3 + Math.random() * 0.7);
        s.blendMode = PIXI.BLEND_MODES.ADD;
        layer.addChild(s);
        out.push({ sprite: s, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 1.1 });
      }
      return out;
    },

    tickRing(g, x, y, r1, r2, count, color, alpha, width) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const long = i % 5 === 0;
        const rr1 = long ? r1 - 8 : r1;
        const rr2 = r2;
        g.lineStyle(width || 1, color, alpha == null ? 0.5 : alpha);
        g.moveTo(x + Math.cos(a) * rr1, y + Math.sin(a) * rr1);
        g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2);
      }
    },
  };
})();
