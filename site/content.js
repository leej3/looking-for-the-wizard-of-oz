const TABLE_HEADER = ["Slide", "Spoken", "Words", "Image", "Notes"];

function splitRow(line) {
  const cells = [];
  let cell = "";
  let escaped = false;

  for (const character of line.slice(1, -1)) {
    if (escaped) {
      cell += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function normalizeCell(cell) {
  return cell === "-" ? "" : cell;
}

export async function loadContent() {
  const response = await fetch("content.md", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load content.md: ${response.status}`);

  const lines = (await response.text()).split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    if (!line.trim().startsWith("|")) return false;
    const cells = splitRow(line.trim());
    return cells.length === TABLE_HEADER.length && cells.every((cell, index) => cell === TABLE_HEADER[index]);
  });
  if (headerIndex < 0) throw new Error("content.md does not contain the expected talk table");

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) break;
    const cells = splitRow(line.trim());
    if (cells.length !== TABLE_HEADER.length) {
      throw new Error(`Expected five cells in content.md row: ${line}`);
    }
    const expectedSlide = rows.length + 1;
    if (Number.parseInt(cells[0], 10) !== expectedSlide) {
      throw new Error(`Expected slide ${expectedSlide} in content.md row: ${line}`);
    }
    rows.push(Object.fromEntries(
      TABLE_HEADER.map((header, index) => [header.toLowerCase(), normalizeCell(cells[index])]),
    ));
  }

  return rows;
}
