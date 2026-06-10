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

function makeDiagramPath(sourceMajor, position) {
  return `assets/diagrams/${sourceMajor}_major_pos${position}.jpg`;
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
      src: makeDiagramPath(sourceMajor, position.id),
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

  const image = document.createElement("img");
  image.className = "diagram-image";
  image.src = match.src;
  image.alt = match.alt;
  image.loading = "lazy";
  image.decoding = "async";
  image.tabIndex = 0;
  image.title = "点击放大";
  image.addEventListener("click", () => openLightbox(match));
  image.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(match);
    }
  });
  image.addEventListener("error", () => {
    const fallback = document.createElement("div");
    fallback.className = "diagram-missing";
    fallback.textContent = "图片加载失败";
    image.replaceWith(fallback);
  }, { once: true });

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
  '<figure><img alt=""><figcaption></figcaption></figure>';
document.body.append(lightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox || event.target.closest(".lightbox-close")) {
    lightbox.close();
  }
});

function openLightbox(match) {
  const img = lightbox.querySelector("img");
  img.src = match.src;
  img.alt = match.alt;
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
