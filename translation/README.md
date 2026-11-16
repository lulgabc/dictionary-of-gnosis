# Chinese bilingual edition

The dictionary now has a bilingual reading mode. The original text is on the left, Chinese on the right, and paragraphs are paired one-to-one.

## Using it

- Open any entry and press **双语** in the top bar.
- On a translated entry the layout becomes two columns: English left, Chinese right.
- On a phone the columns stack, each paragraph labelled `EN` / `中文`.
- Bibliographies remain in their original languages.
- The preference is stored in `localStorage`.
- Untranslated entries show their status and the current translation progress.

## Current status

See [`PROGRESS.md`](PROGRESS.md) for the generated count. The page also shows the count in the home-page colophon and in the *About this edition* dialog.

The full dictionary is about **972,000 English words**. Translation is therefore produced in batches, one entry at a time, with the same paragraph boundaries as the source.

## Data format

Each translation is a separate file:

```
data/translations/<entry-id>.json
```

```json
{
  "id": "astrology-i-introduction",
  "title_zh": "占星学 I：导论",
  "body": [
    { "i": 0, "type": "body", "zh": "……" },
    { "i": 1, "type": "subhead", "zh": "……" }
  ],
  "bib_note_zh": "书目保留原文。",
  "translator": "AI-assisted draft",
  "status": "complete"
}
```

Rules:

- `body` must have exactly the same length as the English `body`.
- `i` must run from 0 to `n - 1`.
- `type` must match the English item (`body` or `subhead`).
- `zh` must be non-empty.
- Do not translate `bib`.
- Do not merge or split paragraphs.

The full style and terminology guide is in [`STYLE.md`](STYLE.md).

## Build

After adding files:

```sh
python3 scripts/build_data.py         # merge translations into data/entries.js
python3 scripts/audit_translations.py # validate and write PROGRESS.md
```

`build_data.py` validates every translation and refuses files with the wrong paragraph count, index sequence, type or empty text.

## Batch workflow

1. Pick a batch of entries (mix of short biographies, thematic entries and one or two long surveys).
2. Translate each entry against the English `body` array, paragraph by paragraph.
3. Run `audit_translations.py`; fix any structural errors.
4. Run `build_data.py` and check the bilingual view on desktop and mobile.
5. Record the batch in `PROGRESS.md`.

The next batches should prioritise the eight pilot entries and the most frequently opened headwords, so that the feature is visible where readers arrive first.
