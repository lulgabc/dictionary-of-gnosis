#!/usr/bin/env python3
"""Turn the extracted entries into the browser data file and resolve
cross-references between entries."""
import json, re, os, unicodedata
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
slim = []
for e in entries:
    slim.append({
        "id": e["id"], "title": e["title"], "heading": e["heading"],
        "letter": e["letter"], "group": e["group"], "group_id": e["group_id"],
        "page": e["page"], "author": e["author"],
        "body": [{"type": p["type"], "text": p["text"], "page": p["page"]} for p in e["body"]],
        "bib": [{"type": p.get("type", "bib"), "text": p["text"]} for p in e["bib"]],
        "words": e["words"], "allwords": e["allwords"],
        "xref": e["xref"], "xref_id": e["xref_id"], "xref_group": e["xref_group"],
    })

payload = {"meta": data["meta"], "groups": groups, "entries": slim}
json.dump(payload, open(os.path.join(ROOT, "data", "entries.min.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
js = "window.DOGWE=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(OUT, "w", encoding="utf-8").write(js)
print("wrote", OUT, round(os.path.getsize(OUT)/1024/1024, 2), "MB")
