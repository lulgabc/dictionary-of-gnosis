#!/usr/bin/env python3
"""Turn the extracted entries into the browser data file and resolve
cross-references between entries."""
import json, re, os, unicodedata, glob
from difflib import SequenceMatcher

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "entries.json")
OUT = os.path.join(ROOT, "data", "entries.js")

data = json.load(open(SRC, encoding="utf-8"))

def norm(s):
    s = s.replace("→", " ")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("&", " and ")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def slug(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()

entries = data["entries"]
by_id = {e["id"]: e for e in entries}

# ------------------------------------------------------------------ translations
TRANS_DIR = os.path.join(ROOT, "data", "translations")
translations = {}
translation_errors = []
if os.path.isdir(TRANS_DIR):
    for path in sorted(glob.glob(os.path.join(TRANS_DIR, "*.json"))):
        try:
            t = json.load(open(path, encoding="utf-8"))
        except Exception as exc:
            translation_errors.append((os.path.basename(path), "JSON: " + str(exc)))
            continue
        tid = t.get("id")
        e = by_id.get(tid)
        if not e:
            translation_errors.append((os.path.basename(path), "unknown id " + str(tid)))
            continue
        items = t.get("body") or []
        if len(items) != len(e["body"]):
            translation_errors.append((tid, f"body length {len(items)} != {len(e['body'])}"))
            continue
        bad = False
        for i, (item, src) in enumerate(zip(items, e["body"])):
            if item.get("i") != i:
                translation_errors.append((tid, f"index {item.get('i')} at {i}")); bad = True; break
            if item.get("type") != src.get("type"):
                translation_errors.append((tid, f"type mismatch at {i}")); bad = True; break
            if not str(item.get("zh") or "").strip():
                translation_errors.append((tid, f"empty zh at {i}")); bad = True; break
        if bad:
            continue
        if not str(t.get("title_zh") or "").strip():
            translation_errors.append((tid, "missing title_zh"))
            continue
        translations[tid] = t

print("translations:", len(translations), "errors:", len(translation_errors))
for x in translation_errors[:12]:
    print("  TRANS", x)

by_title = {}
for e in entries:
    by_title.setdefault(norm(e["title"]), []).append(e)

ALIAS = {
    "schwaller de lubicz rene adolphe": "Schwaller, René Adolphe",
}

def resolve(target):
    t = norm(target)
    if t in ALIAS:
        return by_title[norm(ALIAS[t])][0]
    if t in by_title:
        return by_title[t][0]
    # longest entry title that starts with the reference
    cands = [e for e in entries if norm(e["title"]).startswith(t + " ")]
    if cands:
        return max(cands, key=lambda e: len(e["title"]))
    # reference starts with a title (e.g. "Jewish Influences III")
    cands = [e for e in entries if t.startswith(norm(e["title"]) + " ")]
    if cands:
        return max(cands, key=lambda e: len(e["title"]))
    # token subset: Orléans, Bathilde d' -> Orléans, Louise ... Bathilde d'
    tt = set(t.split())
    cands = [e for e in entries if tt and tt <= set(norm(e["title"]).split())]
    if len(cands) == 1:
        return cands[0]
    # fuzzy
    best = None
    for e in entries:
        r = SequenceMatcher(None, t, norm(e["title"])).ratio()
        if r > 0.86 and (best is None or r > best[0]):
            best = (r, e)
    if best:
        return best[1]
    return None

groups = []
group_ids = {}
for g in data["groups"]:
    gid = slug(g)
    group_ids[norm(g)] = gid
    groups.append({"name": g, "id": gid})

unresolved = []
group_refs = []
for e in entries:
    e.pop("list_title", None)
    e["group_id"] = group_ids.get(norm(e["group"])) if e.get("group") else None
    if not e.get("xref"):
        e["xref_id"] = None
        e["xref_group"] = None
        continue
    gid = group_ids.get(norm(e["xref"]))
    if gid:
        e["xref_id"] = None
        e["xref_group"] = gid
        group_refs.append((e["title"], e["xref"], gid))
        continue
    r = resolve(e["xref"])
    if r:
        e["xref_id"] = r["id"]
        e["xref_group"] = None
    else:
        gid = group_ids.get(norm(e["xref"]))
        if gid:
            e["xref_id"] = None
            e["xref_group"] = gid
            group_refs.append((e["title"], e["xref"], gid))
        else:
            e["xref_id"] = None
            e["xref_group"] = None
            unresolved.append((e["title"], e["xref"]))

print("entries:", len(entries), "groups:", len(groups))
print("unresolved xrefs:", len(unresolved))
for a,b in unresolved: print("  ", a, "->", b)
print("group xrefs:", group_refs)

# slim browser payload: drop duplicated concatenated text
translated_paragraphs = 0
total_paragraphs = 0
slim = []
for e in entries:
    t = translations.get(e["id"])
    status = "complete" if t else ("reference" if e.get("xref") else "pending")
    zh_items = t["body"] if t else []
    chars = len(re.findall(r"[\u4e00-\u9fff]", "".join(str(x.get("zh") or "") for x in zh_items)))
    if not e.get("xref"):
        total_paragraphs += len(e["body"])
        if t:
            translated_paragraphs += len(e["body"])
    slim.append({
        "id": e["id"], "title": e["title"], "heading": e["heading"],
        "title_zh": t.get("title_zh") if t else None,
        "translation_status": status,
        "translated_chars": chars,
        "bib_note_zh": t.get("bib_note_zh") if t else None,
        "letter": e["letter"], "group": e["group"], "group_id": e["group_id"],
        "page": e["page"], "author": e["author"],
        "body": [
            {"type": p["type"], "text": p["text"], "page": p["page"],
             "zh": (zh_items[i]["zh"] if t and i < len(zh_items) else None)}
            for i, p in enumerate(e["body"])
        ],
        "bib": [{"type": p.get("type", "bib"), "text": p["text"]} for p in e["bib"]],
        "words": e["words"], "allwords": e["allwords"],
        "xref": e["xref"], "xref_id": e["xref_id"], "xref_group": e["xref_group"],
    })

data["meta"]["translation"] = {
    "total_entries": sum(1 for e in entries if not e.get("xref")),
    "translated_entries": len(translations),
    "total_paragraphs": total_paragraphs,
    "translated_paragraphs": translated_paragraphs,
    "translated_headwords": len(translations) + sum(1 for e in entries if e.get("xref")),
    "total_headwords": len(entries),
}

payload = {"meta": data["meta"], "groups": groups, "entries": slim}
json.dump(payload, open(os.path.join(ROOT, "data", "entries.min.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
js = "window.DOGWE=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(OUT, "w", encoding="utf-8").write(js)
print("wrote", OUT, round(os.path.getsize(OUT)/1024/1024, 2), "MB")
