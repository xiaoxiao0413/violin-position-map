const POSITIONS = [
  { id: "1", label: "一把位" },
  { id: "2", label: "二把位" },
  { id: "3", label: "三把位" },
  { id: "4", label: "四把位" },
  { id: "5", label: "五把位" },
  { id: "6", label: "六把位" },
  { id: "7", label: "七把位" },
];

const MAJOR_KEYS = [
  { id: "c", label: "C" },
  { id: "g", label: "G" },
  { id: "d", label: "D" },
  { id: "a", label: "A" },
  { id: "e", label: "E" },
  { id: "b", label: "B" },
  { id: "fs", label: "#F" },
  { id: "gb", label: "♭G" },
  { id: "db", label: "♭D" },
  { id: "ab", label: "♭A" },
  { id: "eb", label: "♭E" },
  { id: "bb", label: "♭B" },
  { id: "f", label: "F" },
];

const MINOR_KEYS = [
  { id: "a", label: "A", sourceMajor: "c", sourceMajorLabel: "C" },
  { id: "e", label: "E", sourceMajor: "g", sourceMajorLabel: "G" },
  { id: "b", label: "B", sourceMajor: "d", sourceMajorLabel: "D" },
  { id: "fs", label: "#F", sourceMajor: "a", sourceMajorLabel: "A" },
  { id: "cs", label: "#C", sourceMajor: "e", sourceMajorLabel: "E" },
  { id: "gs", label: "#G", sourceMajor: "b", sourceMajorLabel: "B" },
  { id: "ds", label: "#D", sourceMajor: "fs", sourceMajorLabel: "#F" },
  { id: "eb", label: "♭E", sourceMajor: "gb", sourceMajorLabel: "♭G" },
  { id: "bb", label: "♭B", sourceMajor: "db", sourceMajorLabel: "♭D" },
  { id: "f", label: "F", sourceMajor: "ab", sourceMajorLabel: "♭A" },
  { id: "c", label: "C", sourceMajor: "eb", sourceMajorLabel: "♭E" },
  { id: "g", label: "G", sourceMajor: "bb", sourceMajorLabel: "♭B" },
  { id: "d", label: "D", sourceMajor: "f", sourceMajorLabel: "F" },
];

const DEFAULTS = {
  mode: "major",
  majorTonic: "c",
  minorTonic: "a",
  position: "1",
};

const STORAGE_KEY = "violin-position-filter";

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return null;
    const mode = saved.mode === "minor" ? "minor" : "major";
    const keys = mode === "minor" ? MINOR_KEYS : MAJOR_KEYS;
    return {
      mode,
      tonic: keys.some((key) => key.id === saved.tonic)
        ? saved.tonic
        : mode === "minor" ? DEFAULTS.minorTonic : DEFAULTS.majorTonic,
      position: saved.position === "all" || POSITIONS.some((p) => p.id === saved.position)
        ? saved.position
        : DEFAULTS.position,
    };
  } catch {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ mode: getMode(), tonic: tonicSelect.value, position: positionSelect.value })
    );
  } catch {
    /* 隐私模式下 localStorage 可能不可用，忽略 */
  }
}

const filters = document.querySelector("#filters");
const tonicSelect = document.querySelector("#tonic");
const positionSelect = document.querySelector("#position");
const resultTitle = document.querySelector("#result-title");
const results = document.querySelector("#results");
const resetButton = document.querySelector("#reset");
const minorNote = document.querySelector("#minor-note");

function getMode() {
  return new FormData(filters).get("mode");
}

function getKeysForMode(mode) {
  return mode === "minor" ? MINOR_KEYS : MAJOR_KEYS;
}

function fillTonicOptions(mode, preferredValue) {
  const keys = getKeysForMode(mode);
  const fallback = mode === "minor" ? DEFAULTS.minorTonic : DEFAULTS.majorTonic;
  tonicSelect.replaceChildren();

  for (const key of keys) {
    const option = document.createElement("option");
    option.value = key.id;
    option.textContent = key.label;
    tonicSelect.append(option);
  }

  tonicSelect.value = keys.some((key) => key.id === preferredValue) ? preferredValue : fallback;
}

/* ===== SVG 指法图绘制（按截图海报规范重绘） ===== */

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// 各大调音阶（与海报一致的记谱：升号调用 #，降号调用 ♭）
const MAJOR_SCALES = {
  c: ["C", "D", "E", "F", "G", "A", "B"],
  g: ["G", "A", "B", "C", "D", "E", "#F"],
  d: ["D", "E", "#F", "G", "A", "B", "#C"],
  a: ["A", "B", "#C", "D", "E", "#F", "#G"],
  e: ["E", "#F", "#G", "A", "B", "#C", "#D"],
  b: ["B", "#C", "#D", "E", "#F", "#G", "#A"],
  fs: ["#F", "#G", "#A", "B", "#C", "#D", "#E"],
  gb: ["♭G", "♭A", "♭B", "♭C", "♭D", "♭E", "F"],
  db: ["♭D", "♭E", "F", "♭G", "♭A", "♭B", "C"],
  ab: ["♭A", "♭B", "C", "♭D", "♭E", "F", "G"],
  eb: ["♭E", "F", "G", "♭A", "♭B", "C", "D"],
  bb: ["♭B", "C", "D", "♭E", "F", "G", "A"],
  f: ["F", "G", "A", "♭B", "C", "D", "E"],
};

// 每个调一种底色（呼应海报配色）
const KEY_COLORS = {
  c: "#3aa6b9", g: "#7cb342", d: "#5c9ce6", a: "#e2703a", e: "#c2588f",
  b: "#4db6ac", fs: "#8d7bd8", gb: "#5fb0a0", db: "#d98e32", ab: "#e06a5a",
  eb: "#6aa84f", bb: "#b96ab0", f: "#e0a02e",
};

const STRINGS = [
  { name: "G", pc: 7 },
  { name: "D", pc: 2 },
  { name: "A", pc: 9 },
  { name: "E", pc: 4 },
];

function noteLabelToPc(label) {
  const accidental = label[0] === "#" ? 1 : label[0] === "♭" ? -1 : 0;
  const letter = accidental === 0 ? label[0] : label[1];
  return ((LETTER_PC[letter] + accidental) % 12 + 12) % 12;
}

// 某弦上、某把位的 4 个音（1~4 指）：取半音偏移 >= 2p-1 的最低音及其后 3 个音阶音
function stringNotesForPosition(stringPc, scale, position) {
  const startSemi = 2 * position - 1;
  const all = [];
  for (let offset = 1; offset <= startSemi + 14 && all.length < 24; offset += 1) {
    const pc = (stringPc + offset) % 12;
    const note = scale.find((n) => n.pc === pc);
    if (note) all.push({ ...note, offset });
  }
  const startIndex = all.findIndex((n) => n.offset >= startSemi);
  return all.slice(startIndex, startIndex + 4);
}

function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function makeDiagramSvg(majorId, position) {
  const scale = MAJOR_SCALES[majorId].map((label) => ({ label, pc: noteLabelToPc(label) }));
  const tonicPc = scale[0].pc;
  const color = KEY_COLORS[majorId];
  const columns = STRINGS.map((s) => ({ ...s, notes: stringNotesForPosition(s.pc, scale, position) }));

  const offsets = columns.flatMap((c) => c.notes.map((n) => n.offset));
  const minOff = Math.min(...offsets);
  const maxOff = Math.max(...offsets);
  const pxPerSemi = 30;
  const top = 96;
  const width = 320;
  const xs = [56, 126, 196, 266];
  const height = top + (maxOff - minOff) * pxPerSemi + 48;
  const y = (offset) => top + (offset - minOff) * pxPerSemi;

  const parts = [];
  parts.push(`<svg class="diagram-svg" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img">`);
  // 底色 + 顶部弦名条
  parts.push(`<rect x="0" y="0" width="${width}" height="${height}" rx="10" fill="${color}"/>`);
  parts.push(`<rect x="14" y="14" width="${width - 28}" height="34" rx="6" fill="rgba(16,24,32,0.82)"/>`);
  for (let i = 0; i < 4; i += 1) {
    parts.push(`<text x="${xs[i]}" y="38" text-anchor="middle" font-size="20" font-weight="800" fill="#ffffff">${STRINGS[i].name}</text>`);
  }
  // 把位水印
  parts.push(`<text x="${width / 2}" y="${top + ((maxOff - minOff) * pxPerSemi) / 2 + 50}" text-anchor="middle" font-size="150" font-weight="900" fill="rgba(255,255,255,0.22)">${position}</text>`);
  // 琴弦
  for (const x of xs) {
    parts.push(`<line x1="${x}" y1="56" x2="${x}" y2="${height - 18}" stroke="rgba(255,255,255,0.85)" stroke-width="3"/>`);
  }
  // 同一半音高度的横向参考线
  for (let off = minOff; off <= maxOff; off += 1) {
    parts.push(`<line x1="${xs[0]}" y1="${y(off)}" x2="${xs[3]}" y2="${y(off)}" stroke="rgba(255,255,255,0.28)" stroke-width="1"/>`);
  }
  // 音名圆圈（主音黑底白字）
  for (let i = 0; i < 4; i += 1) {
    for (const note of columns[i].notes) {
      const isTonic = note.pc === tonicPc;
      const cy = y(note.offset);
      const fill = isTonic ? "#171a1d" : "#fffdf6";
      const textColor = isTonic ? "#ffffff" : "#1c2530";
      parts.push(`<circle cx="${xs[i]}" cy="${cy}" r="19" fill="${fill}" stroke="rgba(20,28,36,0.55)" stroke-width="2"/>`);
      parts.push(`<text x="${xs[i]}" y="${cy + 5.5}" text-anchor="middle" font-size="${note.label.length > 1 ? 14 : 16}" font-weight="800" fill="${textColor}">${escapeXml(note.label)}</text>`);
    }
  }
  parts.push("</svg>");
  return parts.join("");
}

function getSelectedKey(mode) {
  return getKeysForMode(mode).find((key) => key.id === tonicSelect.value);
}

function getSelectedPositions() {
  if (positionSelect.value === "all") {
    return POSITIONS;
  }

  return POSITIONS.filter((position) => position.id === positionSelect.value);
}

function buildMatches(mode, key, positions) {
  return positions.map((position) => {
    const isMinor = mode === "minor";
    const sourceMajor = isMinor ? key.sourceMajor : key.id;
    const sourceMajorLabel = isMinor ? key.sourceMajorLabel : key.label;
    const modeLabel = isMinor ? "小调" : "大调";
    const relativeMinor = MINOR_KEYS.find((minorKey) => minorKey.sourceMajor === sourceMajor);

    return {
      keyTitle: `${key.label}${modeLabel}`,
      positionLabel: position.label,
      sourceLabel: `${sourceMajorLabel}大调图块`,
      pairLabel: isMinor
        ? `关系大调 ${sourceMajorLabel}`
        : relativeMinor
          ? `关系小调 ${relativeMinor.label}`
          : "",
      svg: makeDiagramSvg(sourceMajor, Number(position.id)),
      alt: `${position.label} ${key.label}${modeLabel} 指法图`,
    };
  });
}

function render() {
  const mode = getMode();
  const key = getSelectedKey(mode);
  const positions = getSelectedPositions();

  if (!key) {
    results.replaceChildren();
    resultTitle.textContent = "没有匹配结果";
    return;
  }

  const matches = buildMatches(mode, key, positions);
  const modeLabel = mode === "minor" ? "小调" : "大调";
  const positionLabel = positionSelect.value === "all" ? "全部把位" : positions[0].label;
  resultTitle.textContent = `${positionLabel} ${key.label}${modeLabel}`;
  results.dataset.layout = matches.length === 1 ? "single" : "multi";

  if (mode === "minor") {
    minorNote.hidden = false;
    minorNote.textContent = `小调使用关系大调图块显示：${key.label}小调对应 ${key.sourceMajorLabel}大调。`;
  } else {
    minorNote.hidden = true;
    minorNote.textContent = "";
  }

  results.replaceChildren(...matches.map(createCard));
  saveState();
}

function createCard(match) {
  const card = document.createElement("article");
  card.className = "diagram-card";

  const media = document.createElement("div");
  media.className = "diagram-media";

  const pill = document.createElement("div");
  pill.className = "diagram-pill";
  pill.textContent = match.keyTitle;

  const positionMark = document.createElement("div");
  positionMark.className = "position-mark";
  positionMark.textContent = match.positionLabel;

  const image = document.createElement("div");
  image.className = "diagram-image";
  image.innerHTML = match.svg;
  image.setAttribute("role", "img");
  image.setAttribute("aria-label", match.alt);
  image.tabIndex = 0;
  image.title = "点击放大";
  image.addEventListener("click", () => openLightbox(match));
  image.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(match);
    }
  });

  const caption = document.createElement("div");
  caption.className = "diagram-caption";

  const title = document.createElement("h3");
  title.textContent = match.positionLabel;

  const meta = document.createElement("p");
  meta.textContent = `${match.sourceLabel}${match.pairLabel ? ` / ${match.pairLabel}` : ""}`;

  media.append(pill, positionMark, image);
  caption.append(title, meta);
  card.append(media, caption);
  return card;
}

const lightbox = document.createElement("dialog");
lightbox.className = "lightbox";
lightbox.innerHTML =
  '<button class="lightbox-close" type="button" aria-label="关闭">×</button>' +
  '<figure><div class="lightbox-media"></div><figcaption></figcaption></figure>';
document.body.append(lightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox || event.target.closest(".lightbox-close")) {
    lightbox.close();
  }
});

function openLightbox(match) {
  const media = lightbox.querySelector(".lightbox-media");
  media.innerHTML = match.svg;
  media.setAttribute("aria-label", match.alt);
  lightbox.querySelector("figcaption").textContent = `${match.keyTitle} · ${match.positionLabel}`;
  lightbox.showModal();
}

function handleModeChange() {
  fillTonicOptions(getMode(), tonicSelect.value);
  render();
}

for (const modeInput of filters.querySelectorAll('input[name="mode"]')) {
  modeInput.addEventListener("change", handleModeChange);
}

tonicSelect.addEventListener("input", render);
tonicSelect.addEventListener("change", render);
positionSelect.addEventListener("input", render);
positionSelect.addEventListener("change", render);

filters.addEventListener("submit", (event) => {
  event.preventDefault();
  render();
});

resetButton.addEventListener("click", () => {
  filters.elements.mode.value = DEFAULTS.mode;
  positionSelect.value = DEFAULTS.position;
  fillTonicOptions(DEFAULTS.mode, DEFAULTS.majorTonic);
  render();
});

const saved = loadSavedState();
if (saved) {
  filters.elements.mode.value = saved.mode;
  positionSelect.value = saved.position;
  fillTonicOptions(saved.mode, saved.tonic);
} else {
  fillTonicOptions(DEFAULTS.mode, DEFAULTS.majorTonic);
}
render();
