# Pilot · eight entries, one PixiJS renderer

Phase 1 of the motion programme for the *Dictionary of Gnosis & Western Esotericism*.

**Live page:** <https://lulgabc.github.io/dictionary-of-gnosis/motion/pilot/>

## What was built

Eight entries across eight visual families, all rendered by one PixiJS 7.4.2 application and one canvas:

| # | Entry | Scene | Family |
|---|---|---|---|
| 1 | Dee, John | The Skrying Glass | Ritual / portrait |
| 2 | Alchemy I: Introduction | The Great Work | Alchemical apparatus |
| 3 | Astrology I: Introduction | As Above, So Below | Celestial wheel |
| 4 | Gnosticism I: Gnostic Religion | The Spark and the Archons | Hierarchical cosmos |
| 5 | Hermetic Literature I: Antiquity | The Corpus Hermeticum | Scroll / codex |
| 6 | Freemasonry | The Tracing Board | Geometric emblem |
| 7 | Theosophical Society | The Seven Globes | Chain of globes |
| 8 | UFO Traditions | Contact | Mid-century technical |

The Boehme entry remains the separate five-study benchmark at [`../boehme/`](../boehme/).

## Measured pilot footprint

- **1** WebGL renderer, **1** canvas, **8** scenes.
- **0** raster assets; everything is drawn with PixiJS `Graphics`, sprites and text.
- **~970** lines of scene code plus a **161-line** shared helper library.
- Scene switching destroys the old scene and reuses the same renderer and canvas.
- Off-screen scenes stop updating; the player respects reduced-motion.
- Desktop: one 1,182 × 665 canvas, DPR capped at 2, 60 fps requestAnimationFrame in headless Chrome.
- Mobile: 390 × 844 viewport, 4:3 stage, the same single renderer.

These are pilot measurements, not production SLAs.

## Production estimates

The page gives per-scene estimates including research, art direction, implementation, integration and QA — not the time spent on this prototype.

| Scene | Estimate | Main risk |
|---|---|---|
| The Skrying Glass | 2.5–3.5 days | sigil accuracy / glass look |
| The Great Work | 3–4 days | historical apparatus |
| As Above, So Below | 2.5–3.5 days | zodiac order / chart logic |
| The Spark and the Archons | 2–3 days | abstract hierarchy readability |
| The Corpus Hermeticum | 3–4 days | Greek text / scroll masking |
| The Tracing Board | 3–4 days | symbol accuracy |
| The Seven Globes | 2.5–3.5 days | emblem sensitivity |
| Contact | 2.5–3.5 days | period style / not kitsch |

**Pilot total:** roughly **21–29 production days** for eight one-off scenes, or **2.6–3.6 days per scene**.

## What this changes about the full estimate

- If all **344** full entries were one-off scenes at this level of specificity: **≈ 900–1,240 person-days**, or **45–62 person-months**. A team of four would need **11–16 months**, plus release QA.
- If the eight scenes are turned into **visual families** with parameterized reuse, marginal cost should fall to **1–2 days per entry**. Then 344 entries are **≈ 344–688 person-days**, or **17–34 person-months**; a team of four could cover it in **5–9 months**.
- The difference between those two numbers is the whole argument for a family system rather than 344 bespoke posters.

## What the pilot proves

- One renderer can carry very different visual languages without a new page or a new WebGL context.
- Procedural scenes remove the raster-asset pipeline for diagrammatic entries: no image licensing, no atlas downloads, no per-entry asset folders.
- The expensive work is **content research and visual judgement**, not PixiJS code.
- Mobile, reduced motion, off-screen pausing and scene teardown can be solved once in the player.

## What it does not solve

- Eight scenes are not 344. The dictionary still needs a shared grammar so the entries do not become unrelated posters.
- Some entries need maps, portraits, manuscript images or object photography; those require an asset pipeline and rights clearance.
- Historical and symbolic review remains manual. A wrong zodiac order or a misread masonic symbol is a content error, not a rendering bug.
- The pilot is a feasibility pass. The next step is a costed family system, not 336 more one-offs.

## Recommended next step

1. Turn the eight scenes into **8–12 reusable visual families** with a shared motion grammar.
2. Run a second pilot of **20 entries** drawn from those families, measuring marginal production time rather than one-off time.
3. Only then commit to the remaining 324 entries.
