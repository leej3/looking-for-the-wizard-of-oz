import { loadContent } from "./content.js";

const deck = await loadContent();
const summary = document.querySelector("#summary");
const slides = document.querySelector("#slides");

const spokenWords = deck.reduce(
  (total, slide) => {
    const spoken = slide.spoken.trim();
    return total + (spoken ? spoken.split(/\s+/).length : 0);
  },
  0,
);

[
  ["Beats", String(deck.length)],
  ["Spoken words", String(spokenWords)],
].forEach(([term, value]) => {
  summary.append(Object.assign(document.createElement("dt"), { textContent: term }));
  summary.append(Object.assign(document.createElement("dd"), { textContent: value }));
});

deck.forEach((slide, index) => {
  const article = document.createElement("article");
  article.id = `slide-${index + 1}`;

  const heading = document.createElement("h2");
  heading.textContent = `Slide ${index + 1}`;
  article.append(heading);

  [
    ["Spoken", slide.spoken],
    ["Words", slide.words],
    ["Image", slide.image || "—"],
    ["Notes", slide.notes],
  ].forEach(([label, value]) => {
    const term = document.createElement("strong");
    term.textContent = label;
    const text = document.createElement("p");
    text.textContent = value;
    article.append(term, text);
  });

  slides.append(article);
});
