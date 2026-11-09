import { loadContent } from "./content.js";
import { deck as presentation } from "./deck.js";

const deck = await loadContent();
const baseTitle = document.title;
if (deck.length !== presentation.length) {
  throw new Error(`content.md has ${deck.length} slides but deck.js has ${presentation.length}`);
}

const screen = document.querySelector("#screen");
const description = document.querySelector("#slide-description");
const counter = document.querySelector("#counter");
const progress = document.querySelector("#progress span");
const hint = document.querySelector("#hint");
const notesPanel = document.querySelector("#notes-panel");
const notesSection = document.querySelector("#notes-section");
const notesNumber = document.querySelector("#notes-number");
const notesVoice = document.querySelector("#notes-voice");
const notesText = document.querySelector("#notes-text");

let index = readHash();
let touchStartX = null;

function element(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function multiline(text, className) {
  const container = element("div", className);
  text.split("\n").forEach((line, lineIndex) => {
    if (lineIndex > 0) container.append(document.createElement("br"));
    container.append(document.createTextNode(line));
  });
  return container;
}

function readHash() {
  const raw = window.location.hash.slice(1);
  const numeric = Number.parseInt(raw, 10);
  if (Number.isFinite(numeric)) return Math.min(deck.length - 1, Math.max(0, numeric - 1));
  return 0;
}

function visualTheme(visual) {
  return visual.theme ?? "cream";
}

function afterColon(value) {
  return value.slice(value.indexOf(":") + 1).trim();
}

function presentationLines(words, breaks = []) {
  const lines = [];
  let start = 0;
  breaks.forEach((end) => {
    lines.push(words.slice(start, end));
    start = end + 1;
  });
  lines.push(words.slice(start));
  return lines;
}

function visualFor(slide, slideIndex) {
  const style = presentation[slideIndex] ?? { layout: "word", theme: "cream" };
  const lines = presentationLines(slide.words, style.breaks);
  const common = { type: style.layout, ...style };

  switch (style.layout) {
    case "title":
      return {
        ...common,
        title: lines[0],
        subtitle: lines[1],
        presenter: lines[2],
        footer: lines.slice(4).join(" "),
      };
    case "word":
    case "question":
      return { ...common, text: lines.join("\n") };
    case "tiles":
      return { ...common, items: lines };
    case "document":
      return { ...common, eyebrow: lines[0], title: lines[1], lines: lines.slice(2, -1), stamp: lines.at(-1) };
    case "progress":
      return { ...common, value: Number.parseInt(lines[0], 10), label: lines[1] };
    case "comparison":
      return {
        ...common,
        left: { label: lines[0].split(":")[0], text: afterColon(lines[0]) },
        right: { label: lines[1].split(":")[0], text: afterColon(lines[1]) },
      };
    case "steps":
      return { ...common, steps: lines.map((line) => ({ label: line.split(".")[0], text: line.slice(line.indexOf(".") + 1).trim() })) };
    case "package":
      return { ...common, title: lines[0], contents: lines.slice(1, -1), missing: afterColon(lines.at(-1)).split(/,\s*/) };
    case "addition":
      return { ...common, add: lines[0].replace(/^FINAL\.pdf\s*\+\s*/, ""), caption: lines[1] };
    case "quote":
      return { ...common, text: lines[0].replace(/^“|”$/g, ""), attribution: lines[1].replace(/^—\s*/, "") };
    case "example": {
      const [object, action] = lines[0].split(/\s*→\s*/);
      return { ...common, object, action, detail: lines[1] };
    }
    case "iceberg":
      return { ...common, top: lines[0], below: lines.slice(1) };
    case "image":
    case "logo":
      return { ...common, alt: style.imageAlt ?? "", src: slide.image, caption: slide.words };
    case "fixed-image":
      return { ...common, alt: style.imageAlt ?? "", src: slide.image };
    case "definition":
      return { ...common, term: lines[0], text: lines[1], note: lines.slice(2).join(" ") };
    case "principle":
      return { ...common, letter: lines[0], name: lines[1], tagline: lines[2], question: lines[3], definition: lines.slice(4).join(" ") };
    case "network":
      return { ...common, center: lines[0], nodes: lines.slice(1) };
    case "open-science":
      return {
        ...common,
        alt: style.imageAlt ?? "",
        src: slide.image,
        text: slide.words,
        dartmouthLogo: style.dartmouthLogo,
        dartmouthLogoAlt: style.dartmouthLogoAlt ?? "Dartmouth College wordmark.",
      };
    case "closing-links":
      return { ...common, alt: style.imageAlt ?? "", src: slide.image, links: slide.words.split(";").map((link) => link.trim()) };
    case "concept": {
      const [term, definition] = slide.words.split(";").map((part) => part.trim());
      return { ...common, term, definition };
    }
    case "stamped": {
      const [title, ...principleLines] = slide.words.split(";").map((part) => part.trim()).filter(Boolean);
      const active = style.activePrinciples ?? null;
      const principles = principleLines.map((line) => {
        const separator = line.indexOf(":");
        const name = separator < 0 ? line : line.slice(0, separator).trim();
        const description = separator < 0 ? "" : line.slice(separator + 1).trim();
        return { name, description, active: active === null || active.includes(name) };
      });
      return { ...common, title, principles, alt: style.imageAlt ?? "", src: slide.image };
    }
    default:
      throw new Error(`Unknown layout for slide ${slideIndex + 1}: ${style.layout}`);
  }
}

function renderTitle(visual) {
  const group = element("div", "title-group");
  group.append(multiline(visual.title, "title-main"));
  group.append(element("p", "title-subtitle", visual.subtitle));
  group.append(element("p", "title-presenter", visual.presenter));
  group.append(element("p", "title-footer", visual.footer));
  screen.append(group);
}

function renderWord(visual) {
  const classes = ["word-main"];
  if (visual.scale) classes.push(`scale-${visual.scale}`);
  if (visual.tilt) classes.push("tilt");
  if (visual.accent) classes.push(`accent-${visual.accent}`);
  screen.append(multiline(visual.text, classes.join(" ")));
}

function renderQuestion(visual) {
  if (visual.icon) screen.append(element("div", "question-icon", visual.icon));
  const text = multiline(visual.text, "question-main");
  if (visual.accent) text.classList.add(`accent-${visual.accent}`);
  screen.append(text);
}

function renderTiles(visual) {
  const grid = element("div", "tiles-grid");
  visual.items.forEach((item, itemIndex) => {
    grid.append(element("div", `tile tile-${(itemIndex % 6) + 1}`, item));
  });
  screen.append(grid);
}

function renderDocument(visual) {
  const paper = element("div", "document-paper");
  paper.append(element("div", "document-eyebrow", visual.eyebrow));
  paper.append(element("h1", "document-title", visual.title));
  const lines = element("div", "document-lines");
  visual.lines.forEach((line, lineIndex) => {
    const row = element("div", "document-line");
    row.style.setProperty("--line-width", `${86 - lineIndex * 9}%`);
    row.append(element("span", "document-line-label", line));
    lines.append(row);
  });
  paper.append(lines);
  paper.append(element("div", "document-stamp", visual.stamp));
  screen.append(paper);
}

function renderProgress(visual) {
  const group = element("div", "completion-group");
  const value = element("div", "completion-value", `${visual.value}%`);
  const track = element("div", "completion-track");
  const bar = element("span", "completion-bar");
  bar.style.width = `${visual.value}%`;
  track.append(bar);
  group.append(value, track, element("div", "completion-label", visual.label));
  screen.append(group);
}

function renderComparison(visual) {
  const group = element("div", "comparison-grid");
  [visual.left, visual.right].forEach((side, sideIndex) => {
    const card = element("div", `comparison-card comparison-${sideIndex ? "right" : "left"}`);
    card.append(element("div", "comparison-label", side.label));
    card.append(element("div", "comparison-text", side.text));
    group.append(card);
  });
  screen.append(group);
}

function renderSteps(visual) {
  const group = element("div", "steps-grid");
  visual.steps.forEach((step, stepIndex) => {
    const card = element("div", "step-card");
    card.append(element("div", "step-number", step.label));
    card.append(element("div", "step-text", step.text));
    group.append(card);
    if (stepIndex < visual.steps.length - 1) group.append(element("div", "step-arrow", "→"));
  });
  screen.append(group);
}

function renderPackage(visual) {
  const group = element("div", "package-group");
  const packageCard = element("div", "package-card");
  packageCard.append(element("div", "package-title", visual.title));
  visual.contents.forEach((item) => packageCard.append(element("div", "package-content", item)));
  const missing = element("div", "package-missing");
  missing.append(element("div", "package-missing-label", "NOT INCLUDED"));
  visual.missing.forEach((item) => missing.append(element("span", "missing-chip", item)));
  group.append(packageCard, missing);
  screen.append(group);
}

function renderAddition(visual) {
  const group = element("div", "addition-group");
  group.append(element("div", "addition-document", "FINAL.pdf"));
  group.append(element("div", "addition-plus", "+"));
  const added = element("div", "addition-added");
  added.append(element("strong", "addition-name", visual.add));
  added.append(element("span", "addition-caption", visual.caption));
  group.append(added);
  screen.append(group);
}

function renderQuote(visual) {
  const quote = element("blockquote", "quote-card");
  quote.append(element("div", "quote-mark", "“"));
  quote.append(element("p", "quote-text", visual.text));
  quote.append(element("footer", "quote-attribution", `— ${visual.attribution}`));
  screen.append(quote);
}

function renderExample(visual) {
  const group = element("div", "example-group");
  const object = element("div", "example-object", visual.object);
  object.append(element("span", "example-corner", "ARTIFACT"));
  const action = element("div", "example-action", visual.action);
  group.append(object, element("div", "example-arrow", "→"), action);
  group.append(element("p", "example-detail", visual.detail));
  screen.append(group);
}

function renderIceberg(visual) {
  const group = element("div", "iceberg-group");
  group.append(element("div", "iceberg-top", visual.top));
  group.append(element("div", "waterline", "VISIBLE RESULT"));
  const below = element("div", "iceberg-below");
  visual.below.forEach((item) => below.append(element("span", "iceberg-item", item)));
  group.append(below);
  screen.append(group);
}

function renderImage(visual) {
  const image = element("img", "image-visual");
  image.src = visual.src;
  image.alt = visual.alt;
  screen.append(image);
  if (visual.caption) screen.append(element("div", "image-caption", visual.caption));
}

function renderLogo(visual) {
  const image = element("img", "logo-visual");
  image.src = visual.src;
  image.alt = visual.alt;
  screen.append(image, element("div", "logo-caption", visual.caption));
}

function renderDefinition(visual) {
  const group = element("div", "definition-group");
  group.append(element("div", "definition-term", visual.term));
  group.append(element("p", "definition-text", visual.text));
  group.append(element("p", "definition-note", visual.note));
  screen.append(group);
}

function renderPrinciple(visual) {
  const letter = element("div", "principle-letter", visual.letter);
  const content = element("div", "principle-content");
  content.append(element("div", "principle-name", visual.name));
  content.append(element("div", "principle-tagline", visual.tagline));
  content.append(element("div", "principle-question", visual.question));
  screen.append(letter, content, element("div", "principle-definition", visual.definition));
}

function renderNetwork(visual) {
  const group = element("div", "network-group");
  group.append(element("div", "network-center", visual.center));
  visual.nodes.forEach((nodeText, nodeIndex) => {
    group.append(element("div", `network-node network-node-${nodeIndex + 1}`, nodeText));
  });
  screen.append(group);
}

function renderOpenScience(visual) {
  const group = element("div", "open-science-group");
  const logos = element("div", "open-science-logos");
  if (visual.dartmouthLogo) {
    const dartmouthLogo = element("img", "open-science-dartmouth-logo");
    dartmouthLogo.src = visual.dartmouthLogo;
    dartmouthLogo.alt = visual.dartmouthLogoAlt;
    logos.append(dartmouthLogo);
  }
  const conLogo = element("img", "open-science-logo");
  conLogo.src = visual.src;
  conLogo.alt = visual.alt;
  logos.append(conLogo);
  group.append(logos, element("div", "open-science-text", visual.text));
  screen.append(group);
}

function renderClosingLinks(visual) {
  const group = element("div", "closing-links-group");
  const logo = element("img", "closing-links-logo");
  logo.src = visual.src;
  logo.alt = visual.alt;
  const links = element("div", "closing-links-list");
  visual.links.forEach((href) => {
    const link = element("a", "closing-link", href.replace(/^https:\/\//, ""));
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    links.append(link);
  });
  group.append(logo, links);
  screen.append(group);
}

function renderConcept(visual) {
  const group = element("div", "concept-group");
  group.append(element("div", "concept-term", visual.term));
  group.append(element("div", "concept-definition", visual.definition));
  screen.append(group);
}

function renderStamped(visual) {
  const group = element("div", "stamped-overview");
  const identity = element("div", "stamped-identity");
  const image = element("img", "stamped-overview-logo");
  image.src = visual.src;
  image.alt = visual.alt;
  identity.append(image);

  const list = element("div", "stamped-principles");
  visual.principles.forEach((principle) => {
    const row = element("div", `stamped-principle${principle.active ? "" : " is-faded"}`);
    row.append(element("div", "stamped-letter", principle.name.slice(0, 1)));
    row.append(element("div", "stamped-name", principle.name));
    row.append(element("div", "stamped-description", principle.description));
    list.append(row);
  });

  group.append(identity, list);
  screen.append(group);
}

const renderers = {
  title: renderTitle,
  word: renderWord,
  question: renderQuestion,
  tiles: renderTiles,
  document: renderDocument,
  progress: renderProgress,
  comparison: renderComparison,
  steps: renderSteps,
  package: renderPackage,
  addition: renderAddition,
  quote: renderQuote,
  example: renderExample,
  iceberg: renderIceberg,
  image: renderImage,
  "fixed-image": renderImage,
  logo: renderLogo,
  definition: renderDefinition,
  principle: renderPrinciple,
  network: renderNetwork,
  "open-science": renderOpenScience,
  "closing-links": renderClosingLinks,
  concept: renderConcept,
  stamped: renderStamped,
};

function renderNotes(slide) {
  notesSection.textContent = "Slide";
  notesNumber.textContent = `${index + 1} / ${deck.length}`;
  notesVoice.textContent = slide.spoken;
  notesText.textContent = slide.notes;
}

function render({ updateHash = true } = {}) {
  const slide = deck[index];
  const visual = visualFor(slide, index);
  screen.replaceChildren();
  screen.className = `screen layout-${visual.type} theme-${visualTheme(visual)}`;
  const renderer = renderers[visual.type];
  if (!renderer) throw new Error(`Unknown visual type: ${visual.type}`);
  renderer(visual);
  description.textContent = visual.alt ?? visual.text ?? visual.title ?? slide.spoken;
  counter.textContent = `${index + 1} / ${deck.length}`;
  progress.style.width = `${((index + 1) / deck.length) * 100}%`;
  document.title = `${index + 1}/${deck.length} — ${baseTitle}`;
  renderNotes(slide);
  if (updateHash) history.replaceState(null, "", `#${index + 1}`);
}

function goTo(nextIndex) {
  index = Math.min(deck.length - 1, Math.max(0, nextIndex));
  render();
  hint.classList.add("hidden");
}

function next() {
  goTo(index + 1);
}

function previous() {
  goTo(index - 1);
}

function toggleNotes() {
  const open = document.body.classList.toggle("notes-open");
  notesPanel.setAttribute("aria-hidden", String(!open));
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await document.documentElement.requestFullscreen();
  }
}

document.querySelector("#next").addEventListener("click", next);
document.querySelector("#previous").addEventListener("click", previous);
document.querySelector("#next-zone").addEventListener("click", next);
document.querySelector("#previous-zone").addEventListener("click", previous);
document.querySelector("#notes").addEventListener("click", toggleNotes);
document.querySelector("#fullscreen").addEventListener("click", toggleFullscreen);

document.addEventListener("keydown", (event) => {
  if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    next();
  } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    previous();
  } else if (event.key === "Home") {
    event.preventDefault();
    goTo(0);
  } else if (event.key === "End") {
    event.preventDefault();
    goTo(deck.length - 1);
  } else if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFullscreen();
  } else if (event.key.toLowerCase() === "n") {
    event.preventDefault();
    toggleNotes();
  }
});

document.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0]?.screenX ?? null;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const distance = (event.changedTouches[0]?.screenX ?? touchStartX) - touchStartX;
  touchStartX = null;
  if (distance > 45) previous();
  if (distance < -45) next();
}, { passive: true });

window.addEventListener("hashchange", () => {
  index = readHash();
  render({ updateHash: false });
});

setTimeout(() => hint.classList.add("hidden"), 5000);
render();
