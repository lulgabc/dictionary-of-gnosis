# Dictionary of Gnosis &amp; Western Esotericism — digital edition

A complete, self-contained reading edition of the *Dictionary of Gnosis & Western Esotericism*, edited by **Wouter J. Hanegraaff** in collaboration with Antoine Faivre, Roelof van den Broek and Jean-Pierre Brach (Brill, Leiden & Boston, 2006).

The site reproduces the dictionary text itself: every headword, every explanation, every bibliography and every author credit, from page 1 to page 1,186.

## What is included

| | |
|---|---|
| Headwords | **420** |
| Full dictionary entries | **344** |
| See-references | **76** |
| Grouped sections | **12** (Alchemy, Astrology, Gnosticism, Hermetic Literature, Magic, Music, Neoplatonism, …) |
| Pages of dictionary text | **1,186** |
| Words | **972,393** |

Features:

- full-text search across entries, bibliographies and figures
- alphabetical index and a complete table of contents
- grouped sections shown as sections, not as loose entries
- clickable `→` cross-references inside the running text
- light “paper” and dark themes, saved between visits
- responsive layout with an off-canvas index on phones
- print styles for individual entries
- no frameworks, no external fonts, no build step

## Run it

Open `index.html` directly in a browser. The data is loaded with a normal `<script>` tag, so it also works from `file://`.

Or serve the folder:

```sh
python3 -m http.server 8765
# open http://localhost:8765
```

## Project layout

```
index.html                 app shell
assets/style.css           paper-and-ink design
assets/app.js              router, search, index, cross-reference linkifier
assets/favicon.svg         sun seal
data/entries.js            browser data (window.DOGWE)
data/entries.json          full extraction, with concatenated text fields
data/entries.min.json      compact payload used by the audit
scripts/extract.py         PDF → structured JSON
scripts/build_data.py      JSON → browser payload, resolves cross-references
scripts/audit.py           completeness audit → AUDIT.md
AUDIT.md                   latest audit result
```

## Completeness

`python3 scripts/audit.py` re-opens the PDF and checks the edition against the printed book. The current result is **PASS**:

- 420 headword blocks detected in the PDF, 420 in the edition
- 344 printed *List of Entries* entries, 344 matched
- 12 printed section groups, 12 matched
- 76 see-references, all resolved
- 3,801 non-heading source blocks, all verified as complete normalised strings in the final text
- 1,186 pages covered
- no empty bodies, no duplicate ids, no unresolved cross-references, no leftover ligatures or double spaces

See [`AUDIT.md`](AUDIT.md) for the generated report.

## Rebuilding

Requirements: Python 3, [PyMuPDF](https://pymupdf.readthedocs.io/) (`python3 -c "import fitz"`), and the source PDF. The default path expected by the scripts is:

```
~/Downloads/Dictionary of Gnosis  Western Esotericism (Wouter J. Hanegraaff) (z-library.sk, 1lib.sk, z-lib.sk).pdf
```

Then:

```sh
python3 scripts/extract.py     # PDF → data/entries.json (about 20 s)
python3 scripts/build_data.py  # → data/entries.js + data/entries.min.json
python3 scripts/audit.py       # → AUDIT.md
```

The extractor:

1. reads the two-column pages in left-then-right order;
2. removes running heads and page numbers;
3. rebuilds paragraphs from first-line indents and page/column continuations;
4. rejoins hyphenated line breaks using corpus frequency plus a system word list, while keeping meaningful compounds;
5. splits the book at every 11 pt headword block (420 of them);
6. matches the 344 printed *List of Entries* titles, including the 12 group labels;
7. splits author credits from bibliographies, including entries with two authors;
8. verifies every source block against the final text.

## A note on the text

The PDF's text layer uses legacy fonts for some Arabic, Greek and Hebrew transliterations. A few characters may therefore appear as unusual glyphs (for example `≠`, `™` or `£`) instead of the intended transliteration. They are preserved rather than silently guessed at. A small number of dropped spaces and hyphens at font changes were repaired where the intended reading is unambiguous; no wording was added or removed.

The dictionary text remains the copyright of Koninklijke Brill NV and the individual contributors. This is a personal reading edition made from a copy of the book and is not intended for redistribution. The source PDF is not included in this repository. See [`COPYRIGHT.md`](COPYRIGHT.md).

The application code (HTML, CSS, JavaScript and Python) is released under the MIT licence.
