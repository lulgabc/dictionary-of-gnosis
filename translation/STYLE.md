# Chinese translation style guide

This guide applies to the Chinese translations of the *Dictionary of Gnosis & Western Esotericism* used by the bilingual reader.

## Register and fidelity

- Use **Simplified Chinese** and a calm, scholarly register.
- Translate the meaning, not the line breaks. Do not summarize, expand, explain or censor.
- Preserve the author's qualifications, hedges, citations and rhetorical structure.
- Keep the paragraph boundaries exactly as they are in the English `body` array. **One English paragraph = one Chinese paragraph.**
- Translate subheads as subheads. Do not merge a subhead with the paragraph that follows.
- Do not translate the bibliography (`bib`). It remains in the original languages.
- Do not add footnotes, bracketed explanations or translator's introductions.

## Names and terms

- On first occurrence, give the common Chinese rendering followed by the original in parentheses when useful, e.g. 雅各布·波墨（Jacob Boehme）.
- Thereafter use the Chinese name.
- Keep dates, page numbers, Latin titles, book titles and manuscript sigla in their original form.
- Use established Chinese forms where they exist:
  - Gnosis 诺斯 / 灵知
  - Gnosticism 诺斯替主义 / 灵知主义
  - Western Esotericism 西方秘传主义
  - Hermetism / Hermeticism 赫尔墨斯主义
  - Hermes Trismegistus 赫尔墨斯·特里斯墨吉斯忒斯
  - Alchemy 炼金术
  - Astrology 占星学
  - Kabbalah 卡巴拉
  - Theosophy 神智学
  - Anthroposophy 人智学
  - Rosicrucianism 玫瑰十字会
  - Freemasonry 共济会
  - Martinism 马丁主义
  - Illuminism 光照派 / 光明主义（依语境）
  - Neoplatonism 新柏拉图主义
  - Reformation 宗教改革
  - Thirty Years' War 三十年战争
  - Pleroma 普累若麻
  - Archon 执政官
  - Aeon 移涌
  - Quellgeister 源灵
  - tria prima 三原质
  - prisca theologia 上古神学
  - philosophia perennis 常青哲学
- For terms with no stable Chinese equivalent, keep the original term and add a short Chinese gloss on first occurrence.

## Titles

- Provide a natural Chinese title in `title_zh`; keep the original entry title in the English column.
- Do not translate bibliographic titles.

## Output schema

Each translated entry is a separate JSON file at `data/translations/<entry-id>.json`:

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

Requirements:

- `body` has exactly the same length as the English entry's `body` array.
- `i` runs from 0 to `body.length - 1` without gaps.
- `type` must match the English item's `type` (`body` or `subhead`).
- `zh` must be non-empty and must not contain the English source paragraph.
- `title_zh` must be non-empty.
- The file must parse as UTF-8 JSON.

## Quality checks

Before writing the file, check:

1. paragraph count matches;
2. no paragraph is a summary of a longer English paragraph;
3. no bibliography text has been inserted into `body`;
4. names and dates are consistent;
5. the Chinese reads as continuous prose, not word-by-word translation.
