"""Build the public slideshow from its exported slide images and notes."""
from pathlib import Path
import html
import json
import re

root = Path(__file__).resolve().parents[1] / "docs"
slides = json.loads((root / "slides/content.json").read_text())
parts = []
for number, slide in enumerate(slides, 1):
    layout = json.loads((root / f"slides/slide-{number}.layout.json").read_text())
    title = next((s for s in slide["text"] if len(s) > 18 and not s.startswith(("Pew Research Center", "Vote & Vantage"))), slide["text"][0])
    notes = html.escape(slide["notes"])
    notes = re.sub(r'https?://[^\s]+', lambda m: f'<a href="{m[0]}">{m[0]}</a>', notes)
    links = []
    for line in slide["notes"].splitlines():
        for url in re.findall(r'https?://[^\s]+', line):
            label = line.split(url)[0].strip(" :—") or url.split("/")[2]
            if len(label)>70: label=url.split("/")[2]
            links.append(f'<a href="{html.escape(url)}">{html.escape(label)}</a>')
    alt = " ".join(slide["text"] + [e["alt"] for e in layout["elements"] if e.get("alt")])
    parts.append(f'<article id="slide-{number}"><img src="slides/slide-{number}.png" alt="{html.escape(alt,quote=True)}"><details><summary>Slide {number} · Notes and references</summary><div class="notes">{notes}</div></details><footer>{" · ".join(links)}</footer></article>')
page = """<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Looking for the Wizard of Oz · John Lee</title><style>*{box-sizing:border-box}body{margin:0;background:#e9e7df;color:#102f32;font:1rem/1.55 system-ui}header,main{max-width:1100px;margin:auto}header{padding:1em 0}article{background:#faf8f1;margin:0 0 2rem}img{width:100%;display:block}details,footer{padding:.65rem 3%}summary{cursor:pointer}footer{font-size:.9rem}.notes{white-space:pre-line;overflow-wrap:anywhere;max-width:84ch;padding:1em 0}a{color:#126d69}@media print{article{break-after:page;margin:0}header,details,footer{display:none}}</style><header>John Lee · Toastmasters</header><main>""" + "".join(parts) + "</main></html>"
(root / "index.html").write_text(page)
