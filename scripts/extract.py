#!/usr/bin/env python3
"""Extract every entry of the Dictionary of Gnosis & Western Esotericism
from the source PDF into structured JSON.

The PDF has a two-column layout and a text layer in which small-caps
section headings are letter-spaced ("1 .  L i f e").  The script
reconstructs reading order, removes running heads, rebuilds paragraphs,
and splits the book into its 420 headword units (344 dictionary entries
plus 76 see-references).
"""
import fitz, re, json, unicodedata, os, sys
from difflib import SequenceMatcher

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.environ.get(
    "DOGWE_PDF",
    os.path.expanduser("~/Downloads/Dictionary of Gnosis  Western Esotericism (Wouter J. Hanegraaff) (z-library.sk, 1lib.sk, z-lib.sk).pdf"),
)
OUT = os.path.join(ROOT, "data")

doc = fitz.open(PDF)

DICT = set()
try:
    with open("/usr/share/dict/words", encoding="utf-8", errors="ignore") as f:
        for w in f:
            w = w.strip().lower()
            if w: DICT.add(w)
except OSError:
    pass

DERIVATIONAL = ("ing","ed","ly","tion","sion","ment","ness","er","ers","ist","ists",
                "ism","isms","ic","ical","ically","al","ous","ious","ive","ity","ize",
                "ise","ate","ary","ory","ance","ence","able","ible")

# ---------------------------------------------------------------- helpers
LIGATURES = {"\ufb00":"ff","\ufb01":"fi","\ufb02":"fl","\ufb03":"ffi","\ufb04":"ffl","\ufb05":"st","\ufb06":"st"}

def clean_chars(s):
    for a,b in LIGATURES.items():
        s = s.replace(a,b)
    s = s.replace("\u00ad","").replace("\u200b","")
    s = s.replace("\u00a0"," ")
    return s

def norm_space(s):
    s = re.sub(r"\s+([,;:?!])", r"\1", s)
    s = re.sub(r"(\d)\.(?=[A-Z][a-z])", r"\1. ", s)
    return re.sub(r"[ \t]+", " ", s).strip()

def norm_match(s):
    """Aggressive normalisation used only for matching list titles."""
    s = clean_chars(s)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    # remove parenthetical / bracketed interpolations, repeatedly
    for _ in range(4):
        s2 = re.sub(r"\([^()]*\)", " ", s)
        s2 = re.sub(r"\[[^\[\]]*\]", " ", s2)
        if s2 == s: break
        s = s2
    s = re.sub(r"\b(count|sir|dom|abbe|abbé|mrs|mr|dr)\b", " ", s, flags=re.I)
    s = s.replace("&", " and ")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return norm_space(s)

def letter_of(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    m = re.search(r"[A-Za-z]", s)
    return m.group(0).upper() if m else "#"

def join_author_lines(lines):
    out = ""
    for l in lines:
        t = norm_space(line_text(l).strip())
        if not t: continue
        if not out:
            out = t
        elif out.endswith("&") or out.endswith("-"):
            out += " " + t
        else:
            out += " · " + t
    return out

def join_heading(lines):
    out = ""
    for ln in lines:
        ln = letter_spaced(ln).strip()
        if not ln: continue
        if not out:
            out = ln
        elif out.endswith("-"):
            out += ln
        else:
            out = out + " " + ln
    return norm_space(out)

def slugify(s):
    s = clean_chars(s)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:80] or "entry"

# ---------------------------------------------------------------- list of entries
def read_list_of_entries():
    items = []
    for pi in range(24, 31):
        lines = []
        for b in doc[pi].get_text("dict")["blocks"]:
            if b["bbox"][3] < 52: continue
            for l in b.get("lines", []):
                if l["bbox"][1] < 50: continue
                txt = clean_chars(norm_space("".join(s["text"] for s in l["spans"])))
                if not txt or txt == "LIST OF ENTRIES": continue
                lines.append((l["bbox"][0], l["bbox"][1], txt))
        lines.sort(key=lambda z: z[1])
        if not lines: continue
        base = min(x for x, y, t in lines)
        for x, y, t in lines:
            items.append({"indent": round(x-base,1), "title": t})
    # a group label is a top-level item directly followed by an indented item
    for i, it in enumerate(items):
        it["group"] = bool(i+1 < len(items) and items[i+1]["indent"] > it["indent"] + 2)
    return items

LIST = read_list_of_entries()
SECTIONS = [it for it in LIST if not it["group"]]
GROUPS = [it for it in LIST if it["group"]]

# ---------------------------------------------------------------- page flow
def page_blocks(page):
    blocks = []
    for b in page.get_text("dict")["blocks"]:
        if "lines" not in b: continue
        if b["bbox"][3] < 52: continue          # running head / page number
        if not b["lines"]: continue
        blocks.append(b)
    left  = sorted([b for b in blocks if b["bbox"][0] < 240], key=lambda b:(b["bbox"][1], b["bbox"][0]))
    right = sorted([b for b in blocks if b["bbox"][0] >= 240], key=lambda b:(b["bbox"][1], b["bbox"][0]))
    return ([(b, "L", i == 0) for i, b in enumerate(left)] +
            [(b, "R", i == 0) for i, b in enumerate(right)])

def is_sc_line(l):
    spans = [s for s in l["spans"] if s["text"].strip()]
    return bool(spans) and all("SC" in s["font"] for s in spans)

def is_authorish_line(l):
    """Short, right-aligned line set mostly in small caps (author credit)."""
    txt = line_text(l).strip()
    if not (0 < len(txt) < 70):
        return False
    spans = [s for s in l["spans"] if s["text"].strip()]
    if not spans:
        return False
    sc = sum(len(s["text"]) for s in spans if "SC" in s["font"])
    total = sum(len(s["text"]) for s in spans)
    return sc >= total * 0.5

def letter_spaced(s):
    """Collapse text-layer letter spacing: '1 .  L i f e' -> '1. Life'."""
    chunks = re.split(r"\s{2,}", s.strip())
    if len(chunks) == 1:
        toks = s.split()
        singles = sum(1 for t in toks if len(t) == 1)
        if len(toks) >= 4 and singles >= len(toks) * 0.75:
            return "".join(toks)
        return s
    out = []
    changed = False
    for ch in chunks:
        toks = ch.split()
        singles = sum(1 for t in toks if len(t) == 1)
        if len(toks) >= 2 and singles >= len(toks) * 0.7:
            out.append("".join(toks)); changed = True
        else:
            out.append(ch)
    return " ".join(out) if changed else s

def line_text(l):
    return clean_chars("".join(s["text"] for s in l["spans"]))

def block_parts(b):
    """Return list of (kind, lines, indented) for a block.

    Letter-spaced small-caps headings at the start of a block become a
    separate 'subhead' part.  Remaining lines are split into paragraphs
    whenever a first-line indent (some 8 pt to the right of the column
    margin) is detected."""
    lines = b["lines"]
    # A block made up entirely of short small-caps lines, set off to the
    # right of the column, is an author credit (possibly two names).
    col_left = 39 if b["bbox"][0] < 240 else 244
    nonempty = [l for l in lines if line_text(l).strip()]
    if nonempty and b["bbox"][0] > col_left + 55 and all(is_authorish_line(l) for l in nonempty):
        txt = join_author_lines(nonempty)
        if len(txt) < 130:
            return [("author", [txt], True)]

    head_lines = []
    i = 0
    while i < len(lines):
        raw = line_text(lines[i])
        if is_sc_line(lines[i]) and letter_spaced(raw).strip() != raw.strip():
            head_lines.append(letter_spaced(raw).strip())
            i += 1
        else:
            break
    parts = []
    if head_lines:
        parts.append(("subhead", [norm_space(" ".join(head_lines))], True))
    rest = lines[i:]
    author_part = None
    if rest:
        col_threshold = 90 if b["bbox"][0] < 240 else 300
        # trailing run of small-caps author lines (at most three)
        j = len(rest)
        while j > 0 and len(rest) - j < 3:
            last = rest[j - 1]
            lt = line_text(last).strip()
            lx = last["bbox"][0]
            if is_authorish_line(last) and 0 < len(lt) < 90 and lx > col_threshold:
                j -= 1
            else:
                break
        if j < len(rest):
            author_part = ("author", [join_author_lines(rest[j:])], True)
            rest = rest[:j]
    if not rest:
        if author_part:
            parts.append(author_part)
        return parts
    xs = [l["bbox"][0] for l in rest]
    base = min(xs)
    groups = []
    cur = []
    cur_start_ind = False
    prev_x = None
    for l in rest:
        x = l["bbox"][0]
        indented = x > base + 5
        if cur and indented and prev_x is not None and prev_x <= base + 5:
            groups.append((cur, cur_start_ind))
            cur = [l]
            cur_start_ind = True
        else:
            if not cur:
                cur_start_ind = indented
            cur.append(l)
        prev_x = x
    if cur:
        groups.append((cur, cur_start_ind))
    for g, ind in groups:
        parts.append(("text", [line_text(l) for l in g], ind))
    if author_part:
        parts.append(author_part)
    return parts

# ---------------------------------------------------------------- scanning
raw_blocks = []
for pi in range(32, 1218):
    page = doc[pi]
    for bi, (b, col, first_in_col) in enumerate(page_blocks(page)):
        spans = [s for l in b["lines"] for s in l["spans"] if s["text"].strip()]
        if not spans: continue
        mx = max(s["size"] for s in spans)
        txt = norm_space(" ".join(line_text(l) for l in b["lines"]))
        if not txt: continue
        kind = "text"
        if mx >= 10.5:
            kind = "heading"
        elif mx <= 8.6:
            all_sc = all("SC" in s["font"] for s in spans)
            col_right = 252 if col == "L" else 458
            if all_sc and len(txt) < 80 and b["bbox"][2] > col_right - 80:
                kind = "author"
            else:
                kind = "bib"
        raw_blocks.append({
            "idx": len(raw_blocks),
            "page": pi - 31,
            "col": col,
            "first_in_col": first_in_col,
            "kind": kind,
            "size": round(mx,1),
            "bbox": [round(v,1) for v in b["bbox"]],
            "lines": [line_text(l) for l in b["lines"]],
            "parts": block_parts(b),
            "text": txt,
        })

# ---------------------------------------------------------------- dehyphenation vocabulary
TOKEN_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[-’'][A-Za-zÀ-ÖØ-öø-ÿ]+)*")
vocab = {}
for blk in raw_blocks:
    for ln in blk["lines"]:
        s = letter_spaced(ln)
        if s.rstrip().endswith("-"):
            s = s.rstrip()[:-1] + " "
        for m in TOKEN_RE.finditer(s):
            w = m.group(0).lower().replace("’","'")
            vocab[w] = vocab.get(w, 0) + 1

COMPOUND_PREFIXES = {
    "self","non","anti","co","semi","neo","pseudo","quasi","well","ill","half",
    "all","mid","cross","multi","pan","proto","ultra","counter","vice","self","oft",
    "nineteenth","twentieth","eighteenth","seventeenth","sixteenth","fifteenth",
    "fourteenth","thirteenth","twelfth","eleventh","tenth","nineteenth-",
}

def decide_hyphen(prefix, suffix):
    p = prefix.strip().lower()
    s = suffix.strip()
    if not p or not s: return "join-space"
    if "-" in p:                      # e.g. out-of- + hand
        return "keep"
    if s[:1].isdigit() or p[-1:].isdigit():
        return "keep"
    joined = (p + s).lower()
    hyph = (p + "-" + s).lower()
    j = re.sub(r"[^a-zà-ÿ'’-]", "", joined)
    h = re.sub(r"[^a-zà-ÿ'’-]", "", hyph)
    cj, ch = vocab.get(j,0), vocab.get(h,0)
    if cj > ch: return "join"
    if ch > cj: return "keep"
    # corpus gives no clear answer: consult the system dictionary
    if j in DICT: return "join"
    if h in DICT: return "keep"
    if p in DICT and s in DICT and not s.endswith(DERIVATIONAL):
        return "keep"
    if p in COMPOUND_PREFIXES: return "keep"
    return "join"

def join_two(a, b):
    """Join two text fragments that were split at a line/column/page break."""
    a = a.rstrip()
    b = b.lstrip()
    if not a: return b
    if not b: return a
    if a.endswith("-") and len(a) > 1:
        # find the word fragment before the hyphen
        m = re.search(r"([A-Za-zÀ-ÖØ-öø-ÿ’'-]+)-$", a)
        if m:
            action = decide_hyphen(m.group(1), re.match(r"[A-Za-zÀ-ÖØ-öø-ÿ]*", b).group(0))
            if action == "keep":
                return a + b
            return a[:-1] + b
    if a.endswith("’") or a.endswith("'"):
        return a + b
    return a + " " + b

def join_lines(lines):
    out = ""
    for ln in lines:
        ln = letter_spaced(ln)
        if not out:
            out = ln.strip()
        else:
            out = join_two(out, ln)
    return norm_space(out)

def sentence_end(s):
    return bool(re.search(r"[.!?][\"'”’)\]]?$", s.strip()))

# ---------------------------------------------------------------- build entries
entries = []
cur = None
for blk in raw_blocks:
    if blk["kind"] == "heading":
        heading = join_heading(blk["lines"])
        cur = {
            "heading": heading,
            "page": blk["page"],
            "blocks": [],
        }
        entries.append(cur)
        continue
    if cur is None:
        continue
    cur["blocks"].append(blk)

print("headings:", len(entries))

# merge block texts into paragraphs, handling page/column continuations
def build_paragraphs(entry):
    paras = []
    for blk in entry["blocks"]:
        kinds = blk["parts"]
        for idx, (kind, payload, indented) in enumerate(kinds):
            if kind == "subhead":
                stype = "bib-subhead" if blk["kind"] == "bib" else "subhead"
                paras.append({"type":stype,"text":payload[0],"page":blk["page"]})
                continue
            text = join_lines(payload)
            if not text: continue
            ptype = "bib" if blk["kind"] == "bib" else "body"
            if kind == "author" or blk["kind"] == "author":
                ptype = "author"
            # continuation across column/page: first block in column, not a
            # new indented paragraph, starting lower-case mid-sentence
            if paras and ptype in ("body","bib") and paras[-1]["type"] == ptype:
                prev = paras[-1]
                starts_lower = text[:1].islower()
                prev_open = not sentence_end(prev["text"])
                if blk["first_in_col"] and not indented and starts_lower and prev_open:
                    prev["text"] = join_two(prev["text"], text)
                    continue
            paras.append({"type":ptype,"text":text,"page":blk["page"],"indented":indented})
    return paras

for e in entries:
    e["paras"] = build_paragraphs(e)
    # author credits: keep every author-typed paragraph (some entries have two)
    authors = [p["text"] for p in e["paras"] if p["type"] == "author"]
    e["paras"] = [p for p in e["paras"] if p["type"] != "author"]
    e["author"] = " · ".join(authors) if authors else None

# ---------------------------------------------------------------- match canonical titles
def title_key_from_heading(h):
    if "→" in h:
        return h.split("→")[0]
    t = h
    # drop the biographical tail
    t = re.split(r",\s*[\*†]|\s+\(\*|\s+†", t, maxsplit=1)[0]
    t = re.split(r",\s*(?:ca\.|fl\.|before|after|early|late|year|place|probably|unknown|\d)", t, maxsplit=1)[0]
    return t.strip(" ,;")

# manual aliases where the printed list title is a shortened form
MANUAL = {
    "saltzmann, frederick rodolphe": "Saltzmann, Frédérick-Rodolphe",
    "roberts, dorothy jane": "Roberts, Jane",
}

section_keys = []
for i, it in enumerate(SECTIONS):
    section_keys.append((norm_match(it["title"]), i, it["title"]))

def match_section(h):
    hk = norm_match(title_key_from_heading(h))
    ht = hk.split()
    if not ht: return None
    best = None
    for key, i, title in section_keys:
        kt = key.split()
        if not kt: continue
        score = 0
        if ht[:len(kt)] == kt:
            score = 100 + len(kt)
        elif kt == ht:
            score = 110
        elif all(t in ht for t in kt) and ht[0] == kt[0]:
            score = 50 + len(kt) / 100
        else:
            r = SequenceMatcher(None, " ".join(ht), key).ratio()
            if r >= 0.86:
                score = 20 + r
        if score and (best is None or score > best[0]):
            best = (score, i, title)
    if best and best[0] >= 20:
        return best[2]
    return None

seen = {}
for e in entries:
    h = e["heading"]
    if "→" in h:
        title = h.split("→")[0].strip()
        target = h.split("→",1)[1].strip()
        e["xref"] = target
        e["title"] = title
        e["list_title"] = None
    else:
        m = match_section(h)
        if not m:
            mk = MANUAL.get(norm_match(title_key_from_heading(h)))
            m = mk
        e["list_title"] = m
        e["title"] = m or title_key_from_heading(h)
        e["xref"] = None
    e["title"] = clean_chars(norm_space(e["title"]))
    e["heading"] = clean_chars(norm_space(e["heading"]))
    # canonical id
    base = slugify(e["title"])
    n = seen.get(base, 0)
    seen[base] = n + 1
    e["id"] = base if n == 0 else f"{base}-{n+1}"
    e["letter"] = letter_of(e["title"])

# group mapping
group_of = {}
for it in LIST:
    if it["group"]:
        continue
for gi, g in enumerate(GROUPS):
    pass
# map section title -> group by list order
cur_group = None
for it in LIST:
    if it["group"]:
        cur_group = it["title"]
        continue
    if it["indent"] > 0:
        group_of[norm_match(it["title"])] = cur_group
    else:
        group_of[norm_match(it["title"])] = None

for e in entries:
    e["group"] = group_of.get(norm_match(e["title"])) if e["list_title"] else None

# ---------------------------------------------------------------- finalise text
for e in entries:
    body = [p for p in e["paras"] if p["type"] in ("body","subhead")]
    bib  = [p for p in e["paras"] if p["type"] in ("bib", "bib-subhead")]
    # move bibliography-looking paragraphs that were classified as body
    if not bib:
        started = False
        newbody = []
        for p in body:
            if p["type"] == "body" and re.match(r"^(Lit\.|See also|Bibliography|Complete bibliography|Sources|Texts|Editions|Manuscripts|Primary sources|Secondary sources)", p["text"]):
                started = True
            if started:
                bib.append({"type":"bib","text":p["text"],"page":p["page"]})
            else:
                newbody.append(p)
        body = newbody
    e["body"] = body
    e["bib"] = bib
    e["text"] = "\n\n".join(p["text"] for p in body)
    e["bibtext"] = "\n\n".join(p["text"] for p in bib)
    e["words"] = len(re.findall(r"\S+", e["text"]))
    e["allwords"] = len(re.findall(r"\S+", e["text"] + " " + e["bibtext"]))
    e.pop("paras", None)

# ---------------------------------------------------------------- block coverage check
def alnum(s):
    return re.sub(r"[^a-z0-9]", "", clean_chars(s).lower())

missing_blocks = []
missing_full = []
checked = 0
for e in entries:
    final = alnum(e["heading"] + " " + e["text"] + " " + e["bibtext"] + " " + (e["author"] or ""))
    for blk in e["blocks"]:
        raw = alnum(blk["text"])
        if len(raw) < 20:
            continue
        checked += 1
        head, tail = raw[:22], raw[-22:]
        if head not in final or tail not in final:
            missing_blocks.append((e["id"], blk["page"], blk["text"][:90], head in final, tail in final))
        if raw not in final:
            missing_full.append((e["id"], blk["page"], blk["text"][:90]))
print("block coverage: checked", checked, "missing edges", len(missing_blocks), "missing full blocks", len(missing_full))
for m in missing_blocks[:12]:
    print("  COVERAGE", m)
for m in missing_full[:12]:
    print("  FULL", m)


# ---------------------------------------------------------------- typographic repairs
# The PDF text layer occasionally drops a space or a hyphen at a font change.
# These are repairs of spacing only; no words are added or removed.
TEXT_FIXES = {
    "andCatholicism": "and Catholicism",
    "postRevolutionary": "post-Revolutionary",
    "neoRosicrucian": "neo-Rosicrucian",
    "subGrades": "sub-Grades",
    "masonicIlluminaten": "masonic Illuminaten",
    "postRenaissance": "post-Renaissance",
    "neoPlatonic": "neo-Platonic",
    "westAramaic": "west Aramaic",
    "preNicaean": "pre-Nicaean",
    "archGalenic": "arch-Galenic",
    "orphiquesHymnes": "orphiques, Hymnes",
    "esotericChristian": "esoteric Christian",
    "nonOriental": "non-Oriental",
    "postChristian": "post-Christian",
    "neoPythagorean": "neo-Pythagorean",
    "alMagusi": "al-Magusi",
    "alSahl": "al-Sahl",
    "haPanim": "ha-Panim",
    "dHaiyi": "d-Haiyi",
    "finite.This": "finite. This",
    "anthropology.Someofthemareconstructedaround": "anthropology. Some of them are constructed around",
    "Chicago&London:Religio-PhilosophicalPubl.House/ Redway": "Chicago & London: Religio-Philosophical Publ. House / Redway",
    "St.Petersburg": "St. Petersburg",
    "St.Clair": "St. Clair",
    "unknown.IsaacLuria": "unknown. Isaac Luria",
    "circumlocutions.The": "circumlocutions. The",
    "Edinburg/GrandRapids": "Edinburgh/Grand Rapids",
    "Grundbegriffe,BandII,Stuttgart-Berlin-Köln:W.Kohlhammer": "Grundbegriffe, Band II, Stuttgart-Berlin-Köln: W. Kohlhammer",
    "Christianesotericism,Platonism,andmanylesser-known": "Christian esotericism, Platonism, and many lesser-known",
    "Refutatio,VI": "Refutatio, VI",
    "AbelardSchuman": "Abelard Schuman",
    "‘Claveus’DuClo": "‘Claveus’ DuClo",
    "LüdyTenger": "Lüdy Tenger",
    "EmperorJudge": "Emperor Judge",
    "HermetischesJournal": "Hermetisches Journal",
    "HansUlrich Kolb": "Hans-Ulrich Kolb",
    "DanielMaltomini": "Daniel Maltomini",
    "BerlinCharlottenburg": "Berlin-Charlottenburg",
    "AbraxasGemmen": "Abraxas-Gemmen",
    "AhuraMazdao": "Ahura Mazdao",
    "NimrudDagh": "Nimrud Dagh",
    "FuzeauBraesch": "Fuzeau-Braesch",
    "SocialPhilosophy": "Social Philosophy",
    "Baader’sInfluence": "Baader’s Influence",
    "alObowwat": "al-Obowwat",
    "dHiia": "d-Hiia",
    "deHaiyi": "de-Haiyi",
    "famousJewish": "famous Jewish",
    "antiChurch": "anti-Church",
}

def fix_text(s):
    if not s: return s
    for a, b in TEXT_FIXES.items():
        s = s.replace(a, b)
    return s

for e in entries:
    e["title"] = fix_text(e["title"])
    e["heading"] = fix_text(e["heading"])
    e["author"] = fix_text(e["author"]) if e["author"] else e["author"]
    e["xref"] = fix_text(e["xref"]) if e["xref"] else e["xref"]
    for p in e["body"] + e["bib"]:
        p["text"] = fix_text(p["text"])
    e["text"] = "\n\n".join(p["text"] for p in e["body"])
    e["bibtext"] = "\n\n".join(p["text"] for p in e["bib"])
    e["words"] = len(re.findall(r"\S+", e["text"]))
    e["allwords"] = len(re.findall(r"\S+", e["text"] + " " + e["bibtext"]))

for e in entries:
    e.pop("blocks", None)

# ---------------------------------------------------------------- report
matched = [e for e in entries if e["list_title"]]
xrefs = [e for e in entries if e["xref"]]
print("matched sections:", len(matched), "/", len(SECTIONS))
print("xrefs:", len(xrefs))
miss = [it["title"] for it in SECTIONS if not any(e["list_title"] == it["title"] for e in entries)]
print("missing sections:", len(miss))
for m in miss: print("  MISS", m)
un = [e for e in entries if not e["xref"] and not e["list_title"]]
print("unmatched headings:", len(un))
for e in un: print("  UNMATCHED", e["heading"][:120])

# save
os.makedirs(OUT, exist_ok=True)
data = {
    "meta": {
        "title": "Dictionary of Gnosis & Western Esotericism",
        "editor": "Wouter J. Hanegraaff",
        "publisher": "Brill, Leiden / Boston",
        "year": 2006,
        "source_pages": 1186,
        "entry_count": len(entries),
        "section_count": len(SECTIONS),
        "crossref_count": len(xrefs),
        "word_count": sum(e["allwords"] for e in entries),
        "block_coverage": {"checked": checked, "missing": len(missing_blocks), "missing_full": len(missing_full)},
    },
    "groups": [g["title"] for g in GROUPS],
    "entries": entries,
}
with open(os.path.join(OUT,"entries.json"),"w",encoding="utf-8") as f:
    json.dump(data,f,ensure_ascii=False,indent=1)
print("wrote", os.path.join(OUT,"entries.json"))
