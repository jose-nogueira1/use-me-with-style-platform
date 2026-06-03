// Use Me With Style - Phase 1 Storefront Figma Import
// Paste this file into a single Figma MCP `use_figma` call once Figma Pro is active.
// It expects a Figma design file context and returns created node IDs.

const PAGE_NAME = "Phase 1 Storefront - High Fidelity";
const OWNED_PREFIX = "UMWS / ";

const tokens = {
  colors: {
    black: "#050505",
    ink: "#171514",
    charcoal: "#2B2927",
    muted: "#6C655D",
    stone: "#E7DFCF",
    line: "#D8CDB7",
    lineSoft: "#ECE5D8",
    paper: "#FFFDF8",
    ivory: "#F8F4EC",
    champagne: "#E5C24F",
    gold: "#CAA039",
    goldDeep: "#937027",
    rose: "#A66F63",
    sage: "#78816F",
    blue: "#426A70",
    success: "#3F754D",
    alert: "#B95545"
  },
  font: {
    regular: { family: "Inter", style: "Regular" },
    medium: { family: "Inter", style: "Medium" },
    semi: { family: "Inter", style: "Semi Bold" },
    bold: { family: "Inter", style: "Bold" },
    extra: { family: "Inter", style: "Extra Bold" }
  }
};

const createdNodeIds = [];
const mutatedNodeIds = [];

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255
  };
}

function solid(hex, opacity = 1) {
  return { type: "SOLID", color: hexToRgb(hex), opacity };
}

function track(node) {
  createdNodeIds.push(node.id);
  return node;
}

function setName(node, name) {
  node.name = `${OWNED_PREFIX}${name}`;
  return node;
}

function frame(parent, name, x, y, w, h, fill = tokens.colors.paper, radius = 0) {
  const node = track(figma.createFrame());
  setName(node, name);
  node.resize(w, h);
  node.fills = [solid(fill)];
  node.clipsContent = true;
  node.cornerRadius = radius;
  parent.appendChild(node);
  node.x = x;
  node.y = y;
  return node;
}

function rect(parent, name, x, y, w, h, fill, radius = 0, stroke = null) {
  const node = track(figma.createRectangle());
  setName(node, name);
  node.resize(w, h);
  node.fills = [solid(fill)];
  node.cornerRadius = radius;
  if (stroke) {
    node.strokes = [solid(stroke)];
    node.strokeWeight = 1;
  }
  parent.appendChild(node);
  node.x = x;
  node.y = y;
  return node;
}

function ellipse(parent, name, x, y, w, h, fill, stroke = null) {
  const node = track(figma.createEllipse());
  setName(node, name);
  node.resize(w, h);
  node.fills = [solid(fill)];
  if (stroke) {
    node.strokes = [solid(stroke)];
    node.strokeWeight = 1;
  }
  parent.appendChild(node);
  node.x = x;
  node.y = y;
  return node;
}

function text(parent, name, value, x, y, w, size, fill = tokens.colors.ink, font = tokens.font.regular, align = "LEFT") {
  const node = track(figma.createText());
  setName(node, name);
  node.fontName = font;
  node.characters = value;
  node.fontSize = size;
  node.lineHeight = { unit: "PERCENT", value: 118 };
  node.fills = [solid(fill)];
  node.textAlignHorizontal = align;
  node.textAutoResize = "HEIGHT";
  node.resize(w, node.height);
  parent.appendChild(node);
  node.x = x;
  node.y = y;
  return node;
}

function button(parent, label, x, y, w, variant = "dark") {
  const fill = variant === "gold" ? tokens.colors.gold : variant === "light" ? tokens.colors.paper : tokens.colors.black;
  const textColor = variant === "gold" ? tokens.colors.black : variant === "light" ? tokens.colors.ink : tokens.colors.champagne;
  const stroke = variant === "light" ? tokens.colors.line : null;
  const group = frame(parent, `Button / ${label}`, x, y, w, 44, fill, 6);
  if (stroke) {
    group.strokes = [solid(stroke)];
    group.strokeWeight = 1;
  }
  text(group, "Button Label", label, 0, 14, w, 12, textColor, tokens.font.extra, "CENTER");
  return group;
}

function tag(parent, label, x, y, w = 96, variant = "gold") {
  const fill = variant === "sage" ? "#EFF2EA" : variant === "dark" ? tokens.colors.black : "#FCF3D8";
  const color = variant === "sage" ? "#4B5944" : variant === "dark" ? tokens.colors.champagne : tokens.colors.goldDeep;
  const node = frame(parent, `Tag / ${label}`, x, y, w, 28, fill, 6);
  node.strokes = [solid(variant === "dark" ? tokens.colors.black : tokens.colors.line)];
  node.strokeWeight = 1;
  text(node, "Tag Label", label, 0, 8, w, 10, color, tokens.font.extra, "CENTER");
  return node;
}

function wordmark(parent, x, y, color = tokens.colors.ink, width = 122) {
  text(parent, "Logo / Use Me", "Use Me", x, y, width, 32, color, tokens.font.regular, "CENTER");
  text(parent, "Logo / with style", "with style", x + 14, y + 34, width - 28, 10, color, tokens.font.medium, "CENTER");
}

function iconButton(parent, name, x, y, glyph = "bag", dark = false) {
  const bg = dark ? "#171310" : tokens.colors.paper;
  const stroke = dark ? "#6B531E" : tokens.colors.line;
  const color = dark ? tokens.colors.champagne : tokens.colors.ink;
  const box = frame(parent, `Icon Button / ${name}`, x, y, 34, 34, bg, 8);
  box.strokes = [solid(stroke)];
  box.strokeWeight = 1;
  const char = glyph === "menu" ? "☰" : glyph === "back" ? "‹" : glyph === "search" ? "⌕" : "▢";
  text(box, `Icon / ${glyph}`, char, 0, glyph === "back" ? 0 : 7, 34, glyph === "back" ? 28 : 16, color, tokens.font.bold, "CENTER");
  return box;
}

function statusBar(parent, dark = false) {
  text(parent, "Status / Time", "9:41", 14, 9, 80, 10, dark ? tokens.colors.champagne : tokens.colors.black, tokens.font.extra);
  text(parent, "Status / Signal", "5G 100%", 280, 9, 82, 10, dark ? tokens.colors.champagne : tokens.colors.black, tokens.font.extra, "RIGHT");
}

function topbar(parent, dark = false, left = "menu", right = "bag") {
  rect(parent, "Topbar Divider", 0, 83, 390, 1, dark ? "#352817" : tokens.colors.lineSoft);
  iconButton(parent, "Left", 14, 42, left, dark);
  wordmark(parent, 134, 37, dark ? tokens.colors.champagne : tokens.colors.ink, 122);
  iconButton(parent, "Right", 342, 42, right, dark);
}

function garment(parent, x, y, w, h, color = tokens.colors.gold, dark = false) {
  const base = rect(parent, "Garment", x, y, w, h, dark ? tokens.colors.black : color, 2);
  base.rotation = 0;
  for (let i = 0; i < 5; i += 1) {
    const stripe = rect(parent, "Garment Stripe", x + i * (w / 5), y, w / 10, h, dark ? "#2A2724" : tokens.colors.champagne, 0);
    stripe.opacity = dark ? 0.35 : 0.36;
  }
  return base;
}

function productPhoto(parent, x, y, w, h, mood = "gold") {
  const map = {
    gold: ["#EEE4D4", "#D0B165", tokens.colors.gold],
    dark: ["#171514", "#4C4030", tokens.colors.black],
    rose: ["#EFE0D8", "#B8796E", tokens.colors.rose],
    sage: ["#E9E1D1", "#9BA28F", tokens.colors.sage]
  };
  const palette = map[mood] || map.gold;
  const box = frame(parent, `Product Photo / ${mood}`, x, y, w, h, palette[1], 8);
  rect(box, "Photo Highlight", 0, 0, w, h * 0.45, palette[0], 8).opacity = 0.42;
  garment(box, w / 2 - 24, h / 2 - 42, 48, 84, palette[2], mood === "dark");
  return box;
}

function productCard(parent, x, y, w, title, price, eur, mood = "gold", badge = "") {
  const card = frame(parent, `Product Card / ${title}`, x, y, w, 224, tokens.colors.paper, 8);
  card.strokes = [solid(tokens.colors.lineSoft)];
  card.strokeWeight = 1;
  productPhoto(card, 0, 0, w, 142, mood);
  if (badge) tag(card, badge, 9, 152, Math.min(w - 18, 72), badge === "In stock" ? "sage" : "gold");
  text(card, "Product Name", title, 9, badge ? 186 : 158, w - 18, 12, tokens.colors.ink, tokens.font.extra);
  text(card, "Price Kz", price, 9, 206, 70, 11, tokens.colors.black, tokens.font.extra);
  text(card, "Price EUR", eur, w - 64, 206, 55, 10, tokens.colors.muted, tokens.font.bold, "RIGHT");
  return card;
}

function phoneFrame(parent, name, x, y, dark = false) {
  const screen = frame(parent, name, x, y, 390, 844, dark ? tokens.colors.black : tokens.colors.paper, 22);
  screen.strokes = [solid(tokens.colors.black)];
  screen.strokeWeight = 10;
  statusBar(screen, dark);
  return screen;
}

async function buildCover(parent, x, y) {
  const cover = frame(parent, "Cover / Design System", x, y, 760, 844, tokens.colors.paper, 8);
  cover.strokes = [solid(tokens.colors.line)];
  cover.strokeWeight = 1;
  text(cover, "Kicker", "PHASE 1 STOREFRONT HIGH FIDELITY", 32, 34, 360, 12, tokens.colors.goldDeep, tokens.font.extra);
  text(cover, "Title", "Mobile-first boutique commerce for Angola and Portugal.", 32, 70, 540, 54, tokens.colors.ink, tokens.font.bold);
  text(cover, "Summary", "Editable Figma import prepared from the local high-fidelity storefront pack. Covers mobile purchase path, responsive references, brand tokens, and handoff notes.", 34, 272, 580, 18, tokens.colors.muted, tokens.font.regular);
  tag(cover, "Ready for Figma pass", 34, 374, 146, "dark");
  tag(cover, "Mobile storefront first", 194, 374, 156, "gold");
  tag(cover, "Client media placeholders", 34, 414, 172, "gold");
  rect(cover, "Pattern Tile", 560, 250, 170, 170, tokens.colors.ivory, 0, tokens.colors.line);
  rect(cover, "Pattern Stripe", 628, 252, 2, 166, tokens.colors.gold, 0).rotation = 45;
  wordmark(cover, 496, 560, tokens.colors.ink, 200);

  const swatches = [
    ["Black", tokens.colors.black],
    ["Paper", tokens.colors.paper],
    ["Champagne", tokens.colors.champagne],
    ["Gold", tokens.colors.gold],
    ["Rose", tokens.colors.rose],
    ["Sage", tokens.colors.sage],
    ["Blue", tokens.colors.blue]
  ];
  swatches.forEach((item, index) => {
    const sx = 34 + (index % 4) * 150;
    const sy = 640 + Math.floor(index / 4) * 84;
    rect(cover, `Swatch / ${item[0]}`, sx, sy, 118, 44, item[1], 6, tokens.colors.lineSoft);
    text(cover, `Swatch Label / ${item[0]}`, `${item[0]}\\n${item[1]}`, sx, sy + 52, 118, 10, tokens.colors.muted, tokens.font.bold);
  });
  return cover;
}

async function buildHome(parent, x, y) {
  const f = phoneFrame(parent, "01. Home", x, y, true);
  topbar(f, true, "menu", "bag");
  const hero = frame(f, "Hero", 0, 84, 390, 320, "#1B1712", 0);
  rect(hero, "Hero Gold Wash", 180, 0, 210, 320, "#6D5128", 0).opacity = 0.7;
  ellipse(hero, "Model Head", 258, 58, 58, 58, "#C89B7A");
  garment(hero, 238, 114, 104, 198, tokens.colors.gold);
  tag(hero, "Angola / Portugal", 18, 24, 118, "gold");
  text(hero, "Hero Title", "New pieces for your next moment.", 18, 78, 182, 35, tokens.colors.paper, tokens.font.bold);
  text(hero, "Hero Copy", "Elevated dresses, tops, sets, and leggings curated for everyday confidence.", 18, 218, 170, 13, "#D9D1C2", tokens.font.regular);
  button(hero, "Shop new arrivals", 18, 276, 152, "gold");
  rect(f, "Announcement", 0, 404, 390, 36, tokens.colors.ivory);
  text(f, "Announcement PT", "Portugal: CTT and courier", 14, 416, 170, 10, tokens.colors.muted, tokens.font.extra);
  text(f, "Announcement AO", "AO manual delivery", 240, 416, 132, 10, tokens.colors.goldDeep, tokens.font.extra, "RIGHT");
  text(f, "Categories Title", "Shop by category", 14, 462, 170, 16, tokens.colors.paper, tokens.font.extra);
  ["Dresses", "Tops", "Sets", "Leggings"].forEach((label, i) => {
    const tx = 14 + i * 92;
    rect(f, `Category / ${label}`, tx, 492, 76, 74, tokens.colors.paper, 8);
    ellipse(f, `Category Dot / ${label}`, tx + 13, 516, 24, 24, [tokens.colors.gold, tokens.colors.rose, tokens.colors.sage, tokens.colors.blue][i]);
    text(f, `Category Label / ${label}`, label, tx + 10, 548, 58, 10, tokens.colors.black, tokens.font.extra);
  });
  text(f, "Featured Title", "Featured today", 14, 594, 170, 16, tokens.colors.paper, tokens.font.extra);
  productCard(f, 14, 622, 174, "Vestido Aurora", "18,500 Kz", "EUR 22", "gold");
  productCard(f, 202, 622, 174, "Conjunto Sereno", "24,500 Kz", "EUR 29", "dark");
}

async function buildBrowse(parent, x, y) {
  const f = phoneFrame(parent, "02. Browse and Filter", x, y, false);
  topbar(f, false, "menu", "bag");
  rect(f, "Search Field", 14, 104, 270, 42, tokens.colors.paper, 8, tokens.colors.line);
  text(f, "Search Placeholder", "Search dresses, tops, sets", 28, 118, 220, 11, tokens.colors.muted, tokens.font.bold);
  iconButton(f, "Filter", 298, 108, "menu");
  ["New", "Dresses", "In stock", "Under EUR 30"].forEach((label, i) => tag(f, label, 14 + i * 88, 160, i === 3 ? 108 : 72, i === 2 ? "sage" : "gold"));
  text(f, "Title", "New arrivals", 14, 204, 180, 16, tokens.colors.ink, tokens.font.extra);
  text(f, "Count", "24 items", 310, 208, 56, 10, tokens.colors.goldDeep, tokens.font.extra, "RIGHT");
  productCard(f, 14, 236, 174, "Vestido Aurora", "18,500 Kz", "EUR 22", "gold", "New");
  productCard(f, 202, 236, 174, "Vestido Lume", "19,500 Kz", "EUR 23", "rose", "Few left");
  productCard(f, 14, 474, 174, "Top Iris", "8,000 Kz", "EUR 9", "sage", "In stock");
  productCard(f, 202, 474, 174, "Conjunto Sereno", "24,500 Kz", "EUR 29", "dark", "Bestseller");
  rect(f, "Bottom Nav", 0, 784, 390, 60, tokens.colors.paper, 0, tokens.colors.lineSoft);
  ["Shop", "Search", "Orders", "Help"].forEach((label, i) => {
    ellipse(f, `Nav Dot / ${label}`, 48 + i * 91, 798, 18, 18, tokens.colors.paper, i === 0 ? tokens.colors.goldDeep : tokens.colors.muted);
    text(f, `Nav Label / ${label}`, label, 30 + i * 91, 824, 54, 9, i === 0 ? tokens.colors.goldDeep : tokens.colors.muted, tokens.font.extra, "CENTER");
  });
}

async function buildProduct(parent, x, y) {
  const f = phoneFrame(parent, "03. Product Detail", x, y, false);
  topbar(f, false, "back", "bag");
  const hero = frame(f, "Product Hero", 0, 84, 390, 306, "#4D3A1E", 0);
  rect(hero, "Hero Wash", 185, 0, 205, 306, tokens.colors.goldDeep, 0).opacity = 0.58;
  tag(hero, "New arrival", 266, 20, 96, "gold");
  garment(hero, 146, 88, 92, 196, tokens.colors.gold);
  text(f, "Title", "Vestido Aurora", 14, 412, 210, 31, tokens.colors.ink, tokens.font.bold);
  text(f, "Price", "18,500 Kz", 284, 418, 82, 14, tokens.colors.black, tokens.font.extra, "RIGHT");
  text(f, "Description", "Soft drape, sculpted waist, easy evening finish.", 14, 452, 220, 11, tokens.colors.muted, tokens.font.regular);
  text(f, "Colour Label", "COLOUR", 14, 500, 80, 10, tokens.colors.muted, tokens.font.extra);
  text(f, "Colour Value", "AREIA", 302, 500, 64, 10, tokens.colors.muted, tokens.font.extra, "RIGHT");
  [tokens.colors.gold, tokens.colors.black, tokens.colors.rose, tokens.colors.ivory].forEach((c, i) => rect(f, `Color Swatch ${i + 1}`, 14 + i * 38, 522, 30, 30, c, 8, tokens.colors.line));
  text(f, "Size Label", "SIZE", 14, 574, 80, 10, tokens.colors.muted, tokens.font.extra);
  text(f, "Stock", "4 LEFT IN M", 286, 574, 80, 10, tokens.colors.muted, tokens.font.extra, "RIGHT");
  ["XS", "S", "M", "L"].forEach((size, i) => {
    rect(f, `Size / ${size}`, 14 + i * 48, 596, 40, 34, size === "M" ? tokens.colors.black : tokens.colors.paper, 8, tokens.colors.line);
    text(f, `Size Label / ${size}`, size, 14 + i * 48, 608, 40, 11, size === "M" ? tokens.colors.champagne : tokens.colors.ink, tokens.font.extra, "CENTER");
  });
  const info = frame(f, "Market Info", 14, 654, 362, 84, tokens.colors.ivory, 8);
  info.strokes = [solid(tokens.colors.lineSoft)];
  info.strokeWeight = 1;
  [["Market", "Angola selected"], ["Delivery", "Manual coordination"], ["Payment", "Payment review after order"]].forEach((row, i) => {
    text(info, `Info Label / ${row[0]}`, row[0], 12, 13 + i * 24, 90, 11, tokens.colors.ink, tokens.font.extra);
    text(info, `Info Value / ${row[0]}`, row[1], 132, 13 + i * 24, 210, 11, tokens.colors.ink, tokens.font.regular, "RIGHT");
  });
  rect(f, "Sticky CTA", 0, 780, 390, 64, tokens.colors.paper, 0, tokens.colors.lineSoft);
  iconButton(f, "Search", 14, 794, "search");
  button(f, "Add to cart", 62, 794, 314, "dark");
}

async function buildCart(parent, x, y) {
  const f = phoneFrame(parent, "04. Cart", x, y, false);
  topbar(f, false, "back", "search");
  text(f, "Title", "Your cart", 14, 112, 160, 17, tokens.colors.ink, tokens.font.extra);
  text(f, "Item Count", "2 items", 304, 116, 62, 10, tokens.colors.goldDeep, tokens.font.extra, "RIGHT");
  [["Vestido Aurora", "Areia / M", "18,500 Kz"], ["Top Athena", "Preto / S", "9,500 Kz"]].forEach((item, i) => {
    const y0 = 146 + i * 116;
    const card = frame(f, `Cart Item / ${item[0]}`, 14, y0, 362, 104, tokens.colors.paper, 8);
    card.strokes = [solid(tokens.colors.lineSoft)];
    card.strokeWeight = 1;
    productPhoto(card, 10, 10, 76, 84, i === 0 ? "gold" : "dark");
    text(card, "Item Name", item[0], 98, 16, 180, 13, tokens.colors.ink, tokens.font.extra);
    text(card, "Item Options", item[1], 98, 38, 180, 11, tokens.colors.muted, tokens.font.regular);
    text(card, "Qty", "-   1   +", 98, 74, 78, 12, tokens.colors.ink, tokens.font.extra);
    text(card, "Line Price", item[2], 238, 74, 92, 12, tokens.colors.ink, tokens.font.extra, "RIGHT");
  });
  const delivery = frame(f, "Delivery Preview", 14, 386, 362, 70, tokens.colors.ivory, 8);
  [["Delivery market", "Portugal"], ["Method", "CTT or courier at checkout"]].forEach((row, i) => {
    text(delivery, `Delivery Label ${i}`, row[0], 12, 14 + i * 26, 120, 11, tokens.colors.ink, tokens.font.extra);
    text(delivery, `Delivery Value ${i}`, row[1], 188, 14 + i * 26, 150, 11, tokens.colors.ink, tokens.font.regular, "RIGHT");
  });
  ["MBWay", "Stripe", "PayPal"].forEach((label, i) => tag(f, label, 14 + i * 84, 476, 72, i === 0 ? "dark" : "gold"));
  const total = frame(f, "Order Total", 14, 532, 362, 126, tokens.colors.ivory, 8);
  [["Subtotal", "28,000 Kz"], ["Delivery", "Calculated next"], ["Total estimate", "28,000 Kz"]].forEach((row, i) => {
    text(total, `Total Label ${i}`, row[0], 12, 16 + i * 34, 130, 12, i === 2 ? tokens.colors.ink : tokens.colors.muted, i === 2 ? tokens.font.extra : tokens.font.regular);
    text(total, `Total Value ${i}`, row[1], 188, 16 + i * 34, 150, 12, tokens.colors.ink, tokens.font.extra, "RIGHT");
  });
  rect(f, "Sticky CTA", 0, 780, 390, 64, tokens.colors.paper, 0, tokens.colors.lineSoft);
  iconButton(f, "Search", 14, 794, "search");
  button(f, "Checkout", 62, 794, 314, "dark");
}

async function buildCheckout(parent, x, y) {
  const f = phoneFrame(parent, "05. Checkout", x, y, false);
  topbar(f, false, "back", "bag");
  text(f, "Title", "Checkout", 14, 112, 160, 17, tokens.colors.ink, tokens.font.extra);
  text(f, "Step", "Step 2 of 3", 284, 116, 82, 10, tokens.colors.goldDeep, tokens.font.extra, "RIGHT");
  [0, 1, 2].forEach((i) => rect(f, `Progress ${i + 1}`, 14 + i * 122, 146, 112, 6, i < 2 ? tokens.colors.gold : tokens.colors.lineSoft, 4));
  const market = frame(f, "Market Switch", 14, 170, 362, 40, tokens.colors.ivory, 8);
  rect(market, "Selected Portugal", 183, 4, 175, 32, tokens.colors.black, 6);
  text(market, "Angola", "Angola", 0, 15, 181, 11, tokens.colors.muted, tokens.font.extra, "CENTER");
  text(market, "Portugal", "Portugal", 181, 15, 181, 11, tokens.colors.champagne, tokens.font.extra, "CENTER");
  ["Name", "Phone / WhatsApp", "Email", "Address", "City", "Country"].forEach((label, i) => {
    const full = i === 0 || i === 3;
    const x0 = full ? 14 : i % 2 === 1 ? 14 : 200;
    const y0 = i === 0 ? 230 : i < 3 ? 282 : i === 3 ? 334 : 386;
    const w = full ? 362 : 176;
    rect(f, `Field / ${label}`, x0, y0, w, 42, tokens.colors.paper, 8, tokens.colors.line);
    text(f, `Field Label / ${label}`, label, x0 + 12, y0 + 14, w - 24, 11, tokens.colors.muted, tokens.font.medium);
  });
  text(f, "Delivery Label", "DELIVERY METHOD", 14, 448, 160, 10, tokens.colors.muted, tokens.font.extra);
  [["CTT delivery", "Best for nationwide Portugal shipping."], ["Courier delivery", "Manual quote for special handling."]].forEach((row, i) => {
    const card = frame(f, `Delivery Method / ${row[0]}`, 14, 468 + i * 68, 362, 56, i === 0 ? "#FCF3D8" : tokens.colors.paper, 8);
    card.strokes = [solid(i === 0 ? tokens.colors.gold : tokens.colors.line)];
    card.strokeWeight = 1;
    text(card, "Method Name", row[0], 12, 10, 220, 12, tokens.colors.ink, tokens.font.extra);
    text(card, "Method Copy", row[1], 12, 30, 300, 10, tokens.colors.muted, tokens.font.regular);
  });
  text(f, "Payment Label", "PAYMENT", 14, 614, 100, 10, tokens.colors.muted, tokens.font.extra);
  ["MBWay", "Stripe", "PayPal"].forEach((label, i) => tag(f, label, 14 + i * 84, 634, 72, i === 0 ? "dark" : "gold"));
  rect(f, "Notes Field", 14, 684, 362, 54, tokens.colors.paper, 8, tokens.colors.line);
  text(f, "Notes", "Notes for delivery", 26, 702, 180, 11, tokens.colors.muted, tokens.font.medium);
  rect(f, "Sticky CTA", 0, 780, 390, 64, tokens.colors.paper, 0, tokens.colors.lineSoft);
  iconButton(f, "Search", 14, 794, "search");
  button(f, "Review order", 62, 794, 314, "dark");
}

async function buildConfirmation(parent, x, y) {
  const f = phoneFrame(parent, "06. Confirmation and Lookup", x, y, false);
  rect(f, "Confirmation Hero", 0, 0, 390, 230, tokens.colors.black);
  statusBar(f, true);
  wordmark(f, 134, 48, tokens.colors.champagne, 122);
  ellipse(f, "Check Circle", 166, 98, 58, 58, tokens.colors.black, tokens.colors.champagne);
  text(f, "Check", "✓", 166, 112, 58, 28, tokens.colors.champagne, tokens.font.bold, "CENTER");
  text(f, "Title", "Order received", 70, 170, 250, 30, tokens.colors.paper, tokens.font.bold, "CENTER");
  text(f, "Ref", "Reference UMWS-1045 was sent to email and WhatsApp.", 52, 204, 286, 12, "#D9D1C2", tokens.font.regular, "CENTER");
  const summary = frame(f, "Order Summary", 14, 254, 362, 96, tokens.colors.paper, 8);
  summary.strokes = [solid(tokens.colors.lineSoft)];
  summary.strokeWeight = 1;
  [["Status", "Payment review"], ["Total", "18,500 Kz"], ["Delivery", "Manual Angola coordination"]].forEach((row, i) => {
    text(summary, `Summary Label ${i}`, row[0], 12, 14 + i * 26, 80, 11, tokens.colors.ink, tokens.font.extra);
    text(summary, `Summary Value ${i}`, row[1], 138, 14 + i * 26, 200, 11, tokens.colors.ink, tokens.font.regular, "RIGHT");
  });
  const timeline = frame(f, "Timeline", 14, 374, 362, 126, tokens.colors.ivory, 8);
  [["New", "Order captured successfully."], ["Payment review", "Admin team confirms payment."], ["Processing", "Items are prepared for delivery."]].forEach((row, i) => {
    ellipse(timeline, `Timeline Dot ${i}`, 14, 16 + i * 36, 12, 12, i < 2 ? (i === 0 ? tokens.colors.success : tokens.colors.gold) : tokens.colors.ivory, i < 2 ? null : tokens.colors.line);
    text(timeline, `Timeline Title ${i}`, row[0], 38, 12 + i * 36, 180, 11, tokens.colors.ink, tokens.font.extra);
    text(timeline, `Timeline Copy ${i}`, row[1], 38, 26 + i * 36, 260, 10, tokens.colors.muted, tokens.font.regular);
  });
  const message = frame(f, "WhatsApp Automation", 14, 524, 362, 82, "#EFF2EA", 8);
  text(message, "Message Title", "WhatsApp automation", 12, 12, 180, 12, "#41503B", tokens.font.extra);
  text(message, "Message Copy", "Hi Mariana, your Use Me With Style order UMWS-1045 was received. We will confirm payment and delivery details soon.", 12, 34, 318, 10, tokens.colors.muted, tokens.font.regular);
  text(f, "Lookup Title", "Track another order", 14, 638, 180, 15, tokens.colors.ink, tokens.font.extra);
  rect(f, "Lookup Field", 14, 670, 362, 42, tokens.colors.paper, 8, tokens.colors.line);
  text(f, "Lookup Placeholder", "Order reference or email", 28, 684, 180, 11, tokens.colors.muted, tokens.font.medium);
  button(f, "Check status", 14, 724, 362, "light");
}

async function buildDesktop(parent, x, y) {
  const f = frame(parent, "07. Desktop Home and Collection", x, y, 1440, 900, tokens.colors.paper, 8);
  f.strokes = [solid(tokens.colors.black)];
  f.strokeWeight = 12;
  wordmark(f, 48, 24, tokens.colors.ink, 180);
  ["New arrivals", "Dresses", "Tops", "Sets", "Order lookup"].forEach((label, i) => text(f, `Nav / ${label}`, label, 420 + i * 130, 46, 112, 13, tokens.colors.muted, tokens.font.extra, "CENTER"));
  const market = frame(f, "Desktop Market Switch", 1010, 30, 220, 42, tokens.colors.ivory, 8);
  rect(market, "Selected Angola", 4, 4, 106, 34, tokens.colors.black, 6);
  text(market, "Angola", "Angola", 4, 15, 106, 12, tokens.colors.champagne, tokens.font.extra, "CENTER");
  text(market, "Portugal", "Portugal", 112, 15, 104, 12, tokens.colors.muted, tokens.font.extra, "CENTER");
  const hero = frame(f, "Desktop Hero", 0, 96, 1440, 430, tokens.colors.black);
  rect(hero, "Hero Wash", 700, 0, 740, 430, "#5B421E");
  tag(hero, "Phase 1 launch edit", 70, 62, 190, "gold");
  text(hero, "Hero Title", "Style that travels with the moment.", 70, 118, 430, 68, tokens.colors.paper, tokens.font.bold);
  text(hero, "Hero Copy", "A premium storefront for quick discovery, clean checkout, and market-aware payment and delivery across Angola and Portugal.", 70, 346, 380, 16, "#D9D1C2", tokens.font.regular);
  button(hero, "Shop collection", 70, 400, 150, "gold");
  button(hero, "Track order", 236, 400, 130, "light");
  garment(hero, 910, 150, 170, 318, tokens.colors.gold);
  garment(hero, 1082, 205, 120, 246, tokens.colors.black, true);
  text(f, "Featured", "Featured edit", 42, 572, 220, 18, tokens.colors.ink, tokens.font.extra);
  ["Vestido Aurora", "Vestido Lume", "Conjunto Sereno", "Top Iris"].forEach((name, i) => productCard(f, 42 + i * 344, 616, 310, name, ["18,500 Kz", "19,500 Kz", "24,500 Kz", "8,000 Kz"][i], ["EUR 22", "EUR 23", "EUR 29", "EUR 9"][i], ["gold", "rose", "dark", "sage"][i], ["New", "Few left", "Bestseller", "In stock"][i]));
}

async function buildTablet(parent, x, y) {
  const f = frame(parent, "08. Tablet Product Detail", x, y, 834, 720, tokens.colors.paper, 8);
  f.strokes = [solid(tokens.colors.black)];
  f.strokeWeight = 12;
  rect(f, "Topbar", 0, 0, 834, 74, tokens.colors.paper, 0, tokens.colors.lineSoft);
  iconButton(f, "Back", 24, 20, "back");
  wordmark(f, 348, 12, tokens.colors.ink, 140);
  iconButton(f, "Cart", 776, 20, "bag");
  const hero = frame(f, "Product Hero", 0, 74, 390, 646, "#4D3A1E");
  rect(hero, "Gold Wash", 180, 0, 210, 646, tokens.colors.goldDeep).opacity = 0.58;
  tag(hero, "New arrival", 252, 24, 102, "gold");
  garment(hero, 142, 182, 104, 256, tokens.colors.gold);
  text(f, "Title", "Vestido Aurora", 432, 120, 250, 36, tokens.colors.ink, tokens.font.bold);
  text(f, "Price", "EUR 22", 724, 128, 70, 14, tokens.colors.ink, tokens.font.extra, "RIGHT");
  text(f, "Copy", "The same mobile product hierarchy, scaled for tablet: larger media, cleaner detail spacing, identical controls.", 432, 172, 314, 14, tokens.colors.muted, tokens.font.regular);
  text(f, "Colour", "COLOUR", 432, 250, 90, 10, tokens.colors.muted, tokens.font.extra);
  [tokens.colors.gold, tokens.colors.black, tokens.colors.rose, tokens.colors.ivory].forEach((c, i) => rect(f, `Tablet Swatch ${i}`, 432 + i * 42, 274, 32, 32, c, 8, tokens.colors.line));
  text(f, "Size", "SIZE", 432, 336, 90, 10, tokens.colors.muted, tokens.font.extra);
  ["XS", "S", "M", "L"].forEach((size, i) => {
    rect(f, `Tablet Size / ${size}`, 432 + i * 52, 360, 42, 34, size === "M" ? tokens.colors.black : tokens.colors.paper, 8, tokens.colors.line);
    text(f, `Tablet Size Label / ${size}`, size, 432 + i * 52, 372, 42, 11, size === "M" ? tokens.colors.champagne : tokens.colors.ink, tokens.font.extra, "CENTER");
  });
  const info = frame(f, "Tablet Market Info", 432, 428, 338, 100, tokens.colors.ivory, 8);
  [["Market", "Portugal selected"], ["Delivery", "CTT or courier"], ["Payment", "MBWay, Stripe, PayPal"]].forEach((row, i) => {
    text(info, `Info Label ${i}`, row[0], 14, 16 + i * 28, 90, 11, tokens.colors.ink, tokens.font.extra);
    text(info, `Info Value ${i}`, row[1], 138, 16 + i * 28, 178, 11, tokens.colors.ink, tokens.font.regular, "RIGHT");
  });
  button(f, "Add to cart", 432, 560, 338, "dark");
}

let page = figma.root.children.find((p) => p.name === PAGE_NAME);
if (!page) {
  page = figma.createPage();
  page.name = PAGE_NAME;
}
await figma.setCurrentPageAsync(page);

for (const child of [...page.children]) {
  if (child.name.startsWith(OWNED_PREFIX)) {
    child.remove();
  }
}

page.backgrounds = [solid(tokens.colors.ivory)];

await Promise.all([
  figma.loadFontAsync(tokens.font.regular),
  figma.loadFontAsync(tokens.font.medium),
  figma.loadFontAsync(tokens.font.semi),
  figma.loadFontAsync(tokens.font.bold),
  figma.loadFontAsync(tokens.font.extra)
]);

const wrapper = frame(page, "Phase 1 Storefront Import / Editable Frames", 80, 80, 4380, 2240, tokens.colors.ivory, 0);
wrapper.clipsContent = false;

await buildCover(wrapper, 0, 0);
await buildHome(wrapper, 820, 0);
await buildBrowse(wrapper, 1250, 0);
await buildProduct(wrapper, 1680, 0);
await buildCart(wrapper, 2110, 0);
await buildCheckout(wrapper, 2540, 0);
await buildConfirmation(wrapper, 2970, 0);
await buildDesktop(wrapper, 0, 940);
await buildTablet(wrapper, 1510, 940);

figma.viewport.scrollAndZoomIntoView([wrapper]);
mutatedNodeIds.push(page.id);

return {
  pageId: page.id,
  wrapperId: wrapper.id,
  createdNodeIds,
  mutatedNodeIds,
  frameCount: 9,
  message: "Phase 1 storefront high-fidelity frames prepared as editable Figma layers."
};
