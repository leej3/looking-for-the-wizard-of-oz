"""Build a self-hosted Reveal.js deck from slide artwork and speaker notes."""
from pathlib import Path
import html
import json
import re

root = Path(__file__).resolve().parents[1] / "docs"
slides = json.loads((root / "slides/content.json").read_text())
sections = []
for number, slide in enumerate(slides, 1):
    layout = json.loads((root / f"slides/slide-{number}.layout.json").read_text())
    descriptions = [e["alt"] for e in layout["elements"] if e.get("alt")]
    alt = html.escape(" ".join(slide["text"] + descriptions), quote=True)
    notes = html.escape(slide["notes"])
    notes = re.sub(r'https?://[^\s]+', lambda m: f'<a href="{m[0]}" target="_blank" rel="noopener">{m[0]}</a>', notes)
    sections.append(
        f'<section aria-label="Slide {number}"><img src="slides/slide-{number}.png" alt="{alt}">'
        f'<aside class="notes">{notes.replace(chr(10), "<br>")}</aside></section>'
    )

template = (root / "player/template.html").read_text()
(root / "index.html").write_text(template.replace("<!-- SLIDES -->", "\n".join(sections)))
