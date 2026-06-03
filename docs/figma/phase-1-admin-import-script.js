// Use Me With Style - Phase 1 Admin Figma Import
// Paste this file into a single Figma MCP `use_figma` call once Figma Pro is active.
// It creates editable admin frames that mirror docs/phase-1-admin-high-fidelity.html.

const PAGE_NAME = "Phase 1 Admin - High Fidelity";
const OWNED_PREFIX = "UMWS Admin / ";

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
    shell: "#F1EADF",
    champagne: "#E5C24F",
    gold: "#CAA039",
    goldDeep: "#937027",
    rose: "#A66F63",
    sage: "#78816F",
    blue: "#426A70",
    success: "#3F754D",
    alert: "#B95545",
    warning: "#B9822F"
  },
  font: {
    regular: { family: "Inter", style: "Regular" },
    medium: { family: "Inter", style: "Medium" },
    semi: { family: "Inter", style: "Semi Bold" },
    bold: { family: "Inter", style: "Bold" }
  }
};

const createdNodeIds = [];

await Promise.all([
  figma.loadFontAsync(tokens.font.regular),
  figma.loadFontAsync(tokens.font.medium),
  figma.loadFontAsync(tokens.font.semi),
  figma.loadFontAsync(tokens.font.bold)
]);

const existingPage = figma.root.children.find((page) => page.name === PAGE_NAME);
if (existingPage) {
  existingPage.remove();
}

const page = figma.createPage();
page.name = PAGE_NAME;
figma.currentPage = page;

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

function track(node, name) {
  node.name = `${OWNED_PREFIX}${name}`;
  createdNodeIds.push(node.id);
  return node;
}

function frame(parent, name, x, y, w, h, fill = tokens.colors.paper, radius = 0) {
  const node = track(figma.createFrame(), name);
  node.resize(w, h);
  node.fills = [solid(fill)];
  node.cornerRadius = radius;
  node.clipsContent = true;
  parent.appendChild(node);
  node.x = x;
  node.y = y;
  return node;
}

function rect(parent, name, x, y, w, h, fill, radius = 0, stroke = null) {
  const node = track(figma.createRectangle(), name);
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

function text(parent, name, value, x, y, w, size, fill = tokens.colors.ink, font = tokens.font.regular, align = "LEFT") {
  const node = track(figma.createText(), name);
  node.fontName = font;
  node.characters = String(value);
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

function badge(parent, label, x, y, w = 92, variant = "plain") {
  const fills = {
    plain: [tokens.colors.paper, tokens.colors.line, tokens.colors.ink],
    gold: ["#FCF3D8", "#E8D28D", tokens.colors.goldDeep],
    green: ["#EFF4EC", "#BFD3B6", tokens.colors.success],
    blue: ["#EDF4F3", "#B8D2D0", tokens.colors.blue],
    red: ["#FFF0EB", "#E1B3AA", tokens.colors.alert],
    dark: [tokens.colors.black, tokens.colors.black, tokens.colors.champagne]
  };
  const [fill, stroke, color] = fills[variant] || fills.plain;
  const node = frame(parent, `Badge / ${label}`, x, y, w, 26, fill, 6);
  node.strokes = [solid(stroke)];
  node.strokeWeight = 1;
  text(node, "Badge Label", label, 0, 8, w, 9, color, tokens.font.bold, "CENTER");
  return node;
}

function button(parent, label, x, y, w, variant = "plain") {
  const dark = variant === "primary";
  const node = frame(parent, `Button / ${label}`, x, y, w, 42, dark ? tokens.colors.black : tokens.colors.paper, 6);
  node.strokes = [solid(dark ? tokens.colors.black : tokens.colors.line)];
  node.strokeWeight = 1;
  text(node, "Button Label", label, 0, 14, w, 10, dark ? tokens.colors.champagne : tokens.colors.ink, tokens.font.bold, "CENTER");
  return node;
}

function card(parent, name, x, y, w, h) {
  const node = frame(parent, name, x, y, w, h, tokens.colors.paper, 8);
  node.strokes = [solid(tokens.colors.lineSoft)];
  node.strokeWeight = 1;
  return node;
}

function logo(parent, x, y, color = tokens.colors.champagne) {
  text(parent, "Logo / Use Me", "Use Me", x, y, 138, 28, color, tokens.font.regular, "CENTER");
  text(parent, "Logo / with style", "with style", x + 24, y + 30, 90, 9, color, tokens.font.medium, "CENTER");
}

function sidebar(parent, active, note = "Phase 1 launch admin") {
  const side = frame(parent, "Sidebar", 0, 0, 236, 918, tokens.colors.black, 0);
  logo(side, 51, 26, tokens.colors.champagne);
  const nav = ["Dashboard", "Orders", "Products", "Settings"];
  nav.forEach((item, index) => {
    const y = 118 + index * 48;
    const activeNav = item === active;
    const row = frame(side, `Nav / ${item}`, 18, y, 200, 42, activeNav ? "#221C12" : tokens.colors.black, 6);
    row.strokes = [solid(activeNav ? "#765E24" : tokens.colors.black)];
    row.strokeWeight = 1;
    text(row, "Nav Label", item, 12, 14, 132, 11, activeNav ? tokens.colors.champagne : "#BEB8AE", tokens.font.bold);
    if (item === "Orders") badge(row, "3", 166, 10, 24, activeNav ? "gold" : "plain");
    if (item === "Products") badge(row, "7", 166, 10, 24, activeNav ? "gold" : "plain");
  });
  const foot = frame(side, "Sidebar Note", 18, 762, 200, 130, "#12100D", 8);
  foot.strokes = [solid("#5F4A1B")];
  foot.strokeWeight = 1;
  text(foot, "Sidebar Note Title", note, 14, 16, 172, 12, tokens.colors.champagne, tokens.font.bold);
  text(foot, "Sidebar Note Body", "Deferred: AI campaigns, Meta Ads, advanced analytics, roles, full accounts, wishlist, loyalty, and VIP.", 14, 43, 166, 10, "#C9C0B5", tokens.font.regular);
}

function topbar(parent, kicker, title, subtitle, primaryLabel = "Save") {
  text(parent, "Page Kicker", kicker, 260, 25, 360, 10, tokens.colors.goldDeep, tokens.font.bold);
  text(parent, "Page Title", title, 260, 44, 520, 34, tokens.colors.ink, tokens.font.bold);
  text(parent, "Page Subtitle", subtitle, 260, 83, 680, 12, tokens.colors.muted, tokens.font.regular);
  button(parent, "Search", 1116, 28, 42);
  button(parent, "Notify", 1164, 28, 42);
  button(parent, primaryLabel, 1216, 28, 140, "primary");
}

function desktopFrame(name, x, y, active, kicker, title, subtitle, primaryLabel) {
  const f = frame(page, name, x, y, 1360, 918, tokens.colors.ivory, 8);
  f.strokes = [solid(tokens.colors.black)];
  f.strokeWeight = 1;
  sidebar(f, active);
  topbar(f, kicker, title, subtitle, primaryLabel);
  return f;
}

function metric(parent, label, value, note, x, y, variant = "plain") {
  const fill = variant === "gold" ? "#FCF3D8" : variant === "red" ? "#FFF0EB" : tokens.colors.paper;
  const stroke = variant === "gold" ? "#E8D28D" : variant === "red" ? "#E1B3AA" : tokens.colors.lineSoft;
  const node = frame(parent, `Metric / ${label}`, x, y, 203, 112, fill, 8);
  node.strokes = [solid(stroke)];
  node.strokeWeight = 1;
  text(node, "Metric Label", label, 14, 14, 170, 10, tokens.colors.goldDeep, tokens.font.bold);
  text(node, "Metric Value", value, 14, 42, 170, 30, tokens.colors.ink, tokens.font.bold);
  text(node, "Metric Note", note, 14, 84, 170, 10, tokens.colors.muted, tokens.font.regular);
}

function attention(parent, label, note, x, y, variant = "plain") {
  const node = card(parent, `Attention / ${label}`, x, y, 656, 70);
  rect(node, "Priority", 12, 13, 10, 44, variant === "gold" ? tokens.colors.warning : tokens.colors.sage, 5);
  text(node, "Attention Title", label, 34, 15, 414, 12, tokens.colors.ink, tokens.font.bold);
  text(node, "Attention Note", note, 34, 36, 430, 10, tokens.colors.muted, tokens.font.regular);
  badge(node, variant === "gold" ? "Review" : "Open", 544, 21, 92, variant === "gold" ? "gold" : "blue");
}

function chart(parent, x, y) {
  const node = card(parent, "Revenue Trend", x, y, 420, 254);
  text(node, "Panel Title", "Revenue trend", 18, 18, 200, 23, tokens.colors.ink, tokens.font.bold);
  text(node, "Panel Meta", "Last 7 days", 310, 23, 80, 10, tokens.colors.muted, tokens.font.bold, "RIGHT");
  const heights = [72, 86, 61, 112, 96, 126, 150];
  const days = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];
  heights.forEach((height, index) => {
    const bx = 28 + index * 56;
    rect(node, `Chart Bar / ${days[index]}`, bx, 194 - height, 34, height, index === 6 ? tokens.colors.gold : tokens.colors.stone, 5);
    text(node, `Chart Day / ${days[index]}`, days[index], bx, 208, 34, 9, tokens.colors.muted, tokens.font.bold, "CENTER");
  });
}

function simpleRow(parent, title, note, x, y, badgeText = "", badgeVariant = "plain") {
  const parentWidth = parent.width || 420;
  const rowWidth = Math.max(160, parentWidth - x * 2);
  const badgeWidth = 86;
  const labelWidth = badgeText ? Math.max(110, rowWidth - badgeWidth - 14) : rowWidth;
  const badgeX = x + rowWidth - badgeWidth;
  text(parent, `Row Title / ${title}`, title, x, y, labelWidth, 12, tokens.colors.ink, tokens.font.bold);
  text(parent, `Row Note / ${title}`, note, x, y + 21, labelWidth, 10, tokens.colors.muted, tokens.font.regular);
  if (badgeText) badge(parent, badgeText, badgeX, y + 6, badgeWidth, badgeVariant);
  rect(parent, `Row Divider / ${title}`, x, y + 54, rowWidth, 1, tokens.colors.lineSoft);
}

function buildDashboard(x, y) {
  const f = desktopFrame("A01 / Admin Dashboard", x, y, "Dashboard", "Wednesday, June 3, 2026", "Morning check", "Angola and Portugal orders, payment review, low stock, and launch setup gaps.", "Export summary");
  const labels = [
    ["Orders today", "12", "7 Angola, 5 Portugal", "plain"],
    ["Revenue today", "Kz 286K", "EUR 410 equivalent", "plain"],
    ["Payment review", "3", "Manual confirmation needed", "gold"],
    ["Processing", "8", "4 ready for shipment", "plain"],
    ["Low stock", "7", "Sizes with 2 units or less", "red"]
  ];
  labels.forEach((item, index) => metric(f, item[0], item[1], item[2], 260 + index * 214, 126, item[3]));
  const queue = card(f, "Attention Queue", 260, 244, 700, 280);
  text(queue, "Panel Title", "Attention queue", 18, 18, 260, 23, tokens.colors.ink, tokens.font.bold);
  text(queue, "Panel Meta", "Next best actions", 540, 23, 120, 10, tokens.colors.muted, tokens.font.bold, "RIGHT");
  attention(queue, "#1045 Mariana Sousa needs payment review", "Angola order, Appy Pay pending confirmation, WhatsApp preferred.", 18, 62, "gold");
  attention(queue, "#1044 Ana Pereira is ready for Portugal fulfilment", "Lisboa, MBWay confirmed, CTT label before 16:00.", 18, 140, "blue");
  attention(queue, "Mares Dress has a size S stockout", "Keep published for M/L and mark S unavailable.", 18, 218, "red");
  chart(f, 260, 538);
  const setup = card(f, "Market Setup", 684, 538, 276, 254);
  text(setup, "Panel Title", "Market setup", 18, 18, 180, 23, tokens.colors.ink, tokens.font.bold);
  simpleRow(setup, "Portugal payments", "PayPal, Stripe, MBWay placeholders ready.", 18, 62, "Ready", "green");
  simpleRow(setup, "Angola payments", "Appy Pay team response pending.", 18, 126, "Open", "gold");
  simpleRow(setup, "Messaging automation", "WhatsApp and Instagram included.", 18, 190, "Build", "blue");
  const recent = card(f, "Recent Orders", 976, 244, 330, 548);
  text(recent, "Panel Title", "Recent orders", 18, 18, 180, 23, tokens.colors.ink, tokens.font.bold);
  simpleRow(recent, "#1045 Mariana Sousa", "Luanda, Appy Pay, manual delivery", 18, 66, "Review", "gold");
  simpleRow(recent, "#1044 Ana Pereira", "Lisboa, MBWay, CTT", 18, 132, "New", "plain");
  simpleRow(recent, "#1043 Beatriz Lima", "Luanda, manual coordination", 18, 198, "Processing", "blue");
  simpleRow(recent, "#1042 Sofia Mendes", "Porto, CTT tracking added", 18, 264, "Shipped", "green");
}

function table(parent, x, y, rows) {
  const t = card(parent, "Orders Table", x, y, 748, 530);
  const headers = ["Order", "Customer", "Market", "Payment", "Delivery", "Status", "Total"];
  const widths = [70, 152, 70, 110, 100, 118, 76];
  let cx = 14;
  headers.forEach((header, index) => {
    text(t, `Header / ${header}`, header, cx, 16, widths[index], 9, tokens.colors.goldDeep, tokens.font.bold);
    cx += widths[index] + 10;
  });
  rows.forEach((row, index) => {
    const yRow = 48 + index * 78;
    if (index === 0) rect(t, "Selected Row", 0, yRow - 9, 748, 76, "#FFF7DD");
    cx = 14;
    row.forEach((cell, cellIndex) => {
      if (cellIndex === 5) {
        const variant = cell.includes("Review") ? "gold" : cell.includes("Processing") ? "blue" : cell.includes("Shipped") || cell.includes("Delivered") ? "green" : "plain";
        badge(t, cell, cx, yRow + 3, 110, variant);
      } else {
        text(t, `Cell / ${index} / ${cellIndex}`, cell, cx, yRow, widths[cellIndex], 11, tokens.colors.ink, cellIndex === 0 || cellIndex === 6 ? tokens.font.bold : tokens.font.medium);
      }
      cx += widths[cellIndex] + 10;
    });
    rect(t, `Divider / ${index}`, 0, yRow + 66, 748, 1, tokens.colors.lineSoft);
  });
}

function buildOrders(x, y) {
  const f = desktopFrame("A02 / Orders Queue", x, y, "Orders", "Orders", "Order queue", "Capture customer details, confirm payment, coordinate delivery, and update status.", "WhatsApp update");
  const chips = ["All 24", "New 6", "Payment Review 3", "Processing 8", "Shipped 5", "Delivered 1", "Cancelled 1"];
  let chipX = 260;
  chips.forEach((chip, index) => {
    const w = index === 2 ? 144 : 94;
    badge(f, chip, chipX, 126, w, index === 0 ? "dark" : "plain");
    chipX += w + 8;
  });
  table(f, 260, 176, [
    ["#1045", "Mariana Sousa", "AO", "Appy Pay", "Manual", "Payment Review", "Kz 18.5K"],
    ["#1044", "Ana Pereira", "PT", "MBWay", "CTT", "New", "EUR 48"],
    ["#1043", "Beatriz Lima", "AO", "Transfer", "Manual", "Processing", "Kz 36K"],
    ["#1042", "Sofia Mendes", "PT", "Stripe", "CTT", "Shipped", "EUR 72"],
    ["#1041", "Carla Dias", "AO", "Cash", "Manual", "Delivered", "Kz 16.5K"]
  ]);
  const side = card(f, "Selected Order Panel", 1018, 176, 288, 530);
  text(side, "Side Label", "Selected order", 18, 20, 160, 10, tokens.colors.goldDeep, tokens.font.bold);
  text(side, "Side Title", "#1045 payment review", 18, 48, 210, 26, tokens.colors.ink, tokens.font.bold);
  text(side, "Side Copy", "Mariana sent an Appy Pay confirmation, but Angola payment rules are still being finalized. Keep the order in Payment Review until the admin manually confirms.", 18, 102, 238, 11, tokens.colors.muted, tokens.font.regular);
  simpleRow(side, "Next action", "Check proof, then mark Processing.", 18, 202, "High", "gold");
  simpleRow(side, "Customer note", "Prefers WhatsApp updates.", 18, 268);
  simpleRow(side, "Automation", "Prepare WhatsApp and Instagram messages.", 18, 334, "Phase 1", "blue");
  button(side, "Open order detail", 18, 456, 236, "primary");
}

function buildOrderDetail(x, y) {
  const f = desktopFrame("A03 / Order Detail and Payment Review", x, y, "Orders", "Orders / #1045", "Payment review", "Manual payment confirmation before processing and manual Angola coordination.", "Confirm payment");
  text(f, "Order Kicker", "Order summary", 260, 128, 180, 10, tokens.colors.goldDeep, tokens.font.bold);
  text(f, "Order Title", "#1045 Mariana Sousa", 260, 150, 420, 36, tokens.colors.ink, tokens.font.bold);
  badge(f, "Payment Review", 1160, 144, 150, "gold");
  const statuses = ["New", "Payment Review", "Processing", "Shipped", "Delivered", "Cancelled"];
  statuses.forEach((status, index) => {
    const box = card(f, `Status / ${status}`, 260 + index * 153, 214, 142, 76);
    if (index < 2) box.fills = [solid("#FCF3D8")];
    text(box, "Status Title", status, 12, 14, 114, 12, tokens.colors.ink, tokens.font.bold);
    text(box, "Status Note", index === 1 ? "Current" : index === 0 ? "12 min ago" : "Pending", 12, 38, 114, 10, tokens.colors.muted, tokens.font.regular);
  });
  const fields = [
    ["Name", "Mariana Sousa"],
    ["Phone / WhatsApp", "+244 923 456 789"],
    ["Email", "mariana.s@email.com"],
    ["Address", "Rua do Cassequel, 123"],
    ["City / Country", "Luanda, Angola"],
    ["Notes", "Confirm by WhatsApp before delivery."]
  ];
  fields.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const c = card(f, `Field / ${item[0]}`, 260 + col * 260, 314 + row * 84, 246, 70);
    text(c, "Field Label", item[0], 12, 12, 200, 9, tokens.colors.goldDeep, tokens.font.bold);
    text(c, "Field Value", item[1], 12, 35, 210, 12, tokens.colors.ink, tokens.font.bold);
  });
  const item = card(f, "Items Ordered", 260, 510, 778, 112);
  rect(item, "Photo Pending", 14, 18, 62, 76, tokens.colors.ivory, 6, tokens.colors.goldDeep);
  text(item, "Photo Label", "Photo\npending", 18, 43, 54, 9, tokens.colors.goldDeep, tokens.font.bold, "CENTER");
  text(item, "Item Name", "Vestido Aurora", 96, 30, 240, 16, tokens.colors.ink, tokens.font.bold);
  text(item, "Item Detail", "Size M, Areia", 96, 58, 220, 11, tokens.colors.muted, tokens.font.regular);
  text(item, "Item Qty", "Qty 1", 430, 45, 80, 12, tokens.colors.ink, tokens.font.bold);
  text(item, "Item Price", "Kz 18.5K", 540, 45, 90, 12, tokens.colors.ink, tokens.font.bold);
  badge(item, "In stock", 652, 39, 92, "green");
  const side = card(f, "Payment Delivery", 1056, 214, 250, 408);
  text(side, "Side Label", "Payment and delivery", 18, 18, 180, 10, tokens.colors.goldDeep, tokens.font.bold);
  text(side, "Side Title", "Manual confirmation needed", 18, 48, 200, 26, tokens.colors.ink, tokens.font.bold);
  simpleRow(side, "Payment method", "Appy Pay, pending provider rules.", 18, 128, "Review", "gold");
  simpleRow(side, "Delivery method", "Manual coordination in Luanda.", 18, 194);
  simpleRow(side, "Order total", "Kz 18,500 plus delivery fee TBD.", 18, 260);
  button(side, "Approve and process", 18, 348, 214, "primary");
}

function productCard(parent, name, note, x, y, low = false) {
  const c = card(parent, `Product / ${name}`, x, y, 236, 270);
  rect(c, "Photo Pending", 18, 18, 200, 112, tokens.colors.shell, 6, tokens.colors.line);
  text(c, "Photo Label", "Photo pending", 18, 64, 200, 10, tokens.colors.goldDeep, tokens.font.bold, "CENTER");
  text(c, "Product Name", name, 14, 148, 190, 21, tokens.colors.ink, tokens.font.bold);
  text(c, "Product Note", note, 14, 178, 196, 10, tokens.colors.muted, tokens.font.regular);
  ["XS 4", "S 7", "M 9", "L 11"].forEach((stock, index) => {
    const fill = low && index === 1 ? "#FFF0EB" : tokens.colors.ivory;
    rect(c, `Stock / ${stock}`, 14 + index * 53, 224, 46, 36, fill, 6, low && index === 1 ? "#E1B3AA" : tokens.colors.lineSoft);
    text(c, `Stock Label / ${stock}`, low && index === 1 ? "S 0" : stock, 14 + index * 53, 237, 46, 9, low && index === 1 ? tokens.colors.alert : tokens.colors.ink, tokens.font.bold, "CENTER");
  });
}

function buildProducts(x, y) {
  const f = desktopFrame("A04 / Products Catalogue", x, y, "Products", "Products", "Catalogue control", "Manual product entry, stock by size, prices for both markets, and publish state.", "Add product");
  const chips = ["All 16", "Active 12", "Draft 4", "Low stock 7", "Photo pending 16"];
  let chipX = 260;
  chips.forEach((chip, index) => {
    const w = index === 4 ? 132 : 92;
    badge(f, chip, chipX, 126, w, index === 0 ? "dark" : "plain");
    chipX += w + 8;
  });
  const products = [
    ["Vestido Aurora", "AO Kz 18.5K / PT EUR 42.", false],
    ["Mares Dress", "Size S requires restock.", true],
    ["Top Brisa", "Good for bundles.", false],
    ["Conjunto Aurora", "Draft copy pending.", true],
    ["Leggings Tempo", "Active in both markets.", false],
    ["Sereno Set", "Portugal top seller.", false],
    ["Camisa Lua", "Draft.", true],
    ["Saia Alba", "Active.", true]
  ];
  products.forEach((product, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    productCard(f, product[0], product[1], 260 + col * 248, 176 + row * 290, product[2]);
  });
}

function buildProductEditor(x, y) {
  const f = desktopFrame("A05 / Product Editor", x, y, "Products", "Products / Add product", "Create catalogue item", "Enter everything needed to sell a piece before final photography arrives.", "Publish product");
  const media = card(f, "Media Upload", 260, 126, 328, 524);
  rect(media, "Photo Placeholder", 44, 36, 240, 336, tokens.colors.ivory, 8, tokens.colors.goldDeep);
  text(media, "Photo Placeholder Label", "Client photo pending", 74, 198, 180, 11, tokens.colors.goldDeep, tokens.font.bold, "CENTER");
  button(media, "Add photos", 0, 482, 328);
  const form = card(f, "Product Form", 604, 126, 702, 524);
  const fields = [
    ["Product name", "Vestido Celeste"],
    ["Category", "Dresses"],
    ["Status", "Draft"],
    ["Angola price", "Kz 18,500"],
    ["Portugal price", "EUR 42"],
    ["Visibility", "AO + PT"],
    ["Colors", "Areia, Preto, Marfim"],
    ["Delivery note", "Standard rules by market"]
  ];
  fields.forEach((field, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const w = index > 5 ? 330 : 210;
    const xField = 18 + (index > 5 ? (index - 6) * 344 : col * 222);
    const yField = 22 + row * 78;
    text(form, `Label / ${field[0]}`, field[0], xField, yField, w, 9, tokens.colors.goldDeep, tokens.font.bold);
    rect(form, `Input / ${field[0]}`, xField, yField + 20, w, 42, tokens.colors.ivory, 6, tokens.colors.line);
    text(form, `Value / ${field[0]}`, field[1], xField + 11, yField + 34, w - 22, 11, tokens.colors.ink, tokens.font.bold);
  });
  text(form, "Stock Label", "Stock by size", 18, 254, 180, 9, tokens.colors.goldDeep, tokens.font.bold);
  ["XS 4", "S 7", "M 9", "L 11", "XL 3"].forEach((stock, index) => {
    rect(form, `Editor Stock / ${stock}`, 18 + index * 76, 276, 64, 42, tokens.colors.ivory, 6, tokens.colors.lineSoft);
    text(form, `Editor Stock Label / ${stock}`, stock, 18 + index * 76, 291, 64, 10, tokens.colors.ink, tokens.font.bold, "CENTER");
  });
  text(form, "Description Label", "Description placeholder", 18, 350, 200, 9, tokens.colors.goldDeep, tokens.font.bold);
  rect(form, "Description Box", 18, 370, 660, 78, tokens.colors.ivory, 6, tokens.colors.line);
  text(form, "Description Copy", "Soft launch copy until client approves final product descriptions. Include fit, care, fabric, and styling notes.", 30, 392, 620, 11, tokens.colors.muted, tokens.font.regular);
}

function buildSettings(x, y) {
  const f = desktopFrame("A06 / Settings", x, y, "Settings", "Settings", "Launch configuration", "Safe placeholders until payment, fulfilment, and client media inputs are final.", "Save settings");
  const markets = [
    ["Angola", "Manual", "Currency", "Kwanza, prices shown as Kz.", "Payment", "Appy Pay under evaluation; Payment Review active.", "Delivery", "Manual coordination by admin.", "Order flow", "New to Payment Review to Processing."],
    ["Portugal", "Configured", "Currency", "Euro, prices shown as EUR.", "Payment", "PayPal, Stripe, MBWay placeholders ready.", "Delivery", "CTT and courier.", "Order flow", "New, Processing, Shipped, Delivered, Cancelled."],
    ["Messaging", "Phase 1", "WhatsApp", "Order confirmation, payment review, shipped update.", "Instagram", "Manual-trigger messages for new arrivals.", "Deferred", "Meta Ads automation, AI campaigns.", "Language", "Portuguese first, English support where needed."],
    ["Order Fields", "Required", "Customer", "Name, phone/WhatsApp, email, notes.", "Address", "Address, city, country.", "Methods", "Payment method and delivery method.", "Lookup", "Confirmation and lookup without full accounts."]
  ];
  markets.forEach((market, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const c = card(f, `Settings / ${market[0]}`, 260 + col * 458, 126 + row * 286, 440, 268);
    text(c, "Market Title", market[0], 18, 20, 180, 28, tokens.colors.ink, tokens.font.bold);
    badge(c, market[1], 318, 22, 100, index === 0 ? "gold" : index === 1 ? "green" : index === 2 ? "blue" : "plain");
    for (let i = 0; i < 4; i += 1) {
      const yRow = 74 + i * 48;
      text(c, `Config Label / ${i}`, market[2 + i * 2], 18, yRow, 110, 11, tokens.colors.ink, tokens.font.bold);
      text(c, `Config Value / ${i}`, market[3 + i * 2], 150, yRow, 250, 11, tokens.colors.muted, tokens.font.regular);
      if (i < 3) rect(c, `Config Divider / ${i}`, 18, yRow + 36, 402, 1, tokens.colors.lineSoft);
    }
  });
}

function messageCard(parent, title, badgeText, x, y, variant = "blue") {
  const c = card(parent, `Message / ${title}`, x, y, 336, 252);
  text(c, "Message Title", title, 18, 18, 218, 25, tokens.colors.ink, tokens.font.bold);
  badge(c, badgeText, 236, 20, 78, variant);
  text(c, "Message Body", "Phase 1 operational message support for order, payment, delivery, and product support moments.", 18, 64, 282, 11, tokens.colors.muted, tokens.font.regular);
  rect(c, "Template Preview", 18, 126, 300, 92, tokens.colors.ivory, 8, tokens.colors.line);
  text(c, "Template Copy", title.includes("WhatsApp") ? "Hi Mariana, your Use Me order #1045 is in payment review. We will confirm as soon as payment is approved." : "Thanks for messaging Use Me. Send us your order number and phone so we can check your status.", 32, 146, 264, 11, tokens.colors.ink, tokens.font.regular);
}

function buildMessaging(x, y) {
  const f = desktopFrame("A08 / Messaging Automation Foundation", x, y, "Settings", "Settings / Messaging", "Automation foundation", "Templates, triggers, human review, and channel readiness for launch support.", "Save rules");
  messageCard(f, "WhatsApp order updates", "Phase 1", 260, 126, "blue");
  messageCard(f, "Instagram support prompts", "Phase 1", 608, 126, "blue");
  const review = card(f, "Human Review Inbox", 260, 394, 336, 252);
  text(review, "Review Title", "Human review inbox", 18, 18, 220, 25, tokens.colors.ink, tokens.font.bold);
  badge(review, "Required", 236, 20, 78, "gold");
  text(review, "Review Copy", "Payment, address, cancellation, or unresolved delivery messages stay visible for admin action.", 18, 64, 282, 11, tokens.colors.muted, tokens.font.regular);
  simpleRow(review, "#1045 payment proof", "Attached to Payment Review.", 18, 126, "Review", "gold");
  simpleRow(review, "#1044 CTT label request", "Instagram question routed to order detail.", 18, 190, "Open", "blue");
  const boundary = card(f, "Automation Boundaries", 608, 394, 336, 252);
  text(boundary, "Boundary Title", "Automation boundaries", 18, 18, 220, 25, tokens.colors.ink, tokens.font.bold);
  badge(boundary, "Deferred", 236, 20, 78, "plain");
  text(boundary, "Boundary Copy", "Admin can prepare/send operational messages. AI campaign planning, Meta Ads, segmentation, and analytics triggers stay out of Phase 1.", 18, 64, 282, 11, tokens.colors.muted, tokens.font.regular);
  simpleRow(boundary, "Included", "Order and support message templates.", 18, 144);
  simpleRow(boundary, "Deferred", "AI campaigns, Meta Ads automation, VIP flows.", 18, 202);
  const trigger = card(f, "Trigger Map", 976, 126, 330, 520);
  text(trigger, "Trigger Label", "Trigger map", 18, 18, 160, 10, tokens.colors.goldDeep, tokens.font.bold);
  text(trigger, "Trigger Title", "Status changes create messages", 18, 48, 250, 26, tokens.colors.ink, tokens.font.bold);
  simpleRow(trigger, "New", "Order confirmation draft.", 18, 126);
  simpleRow(trigger, "Payment Review", "Payment proof or waiting message.", 18, 190, "Review", "gold");
  simpleRow(trigger, "Processing", "Preparation update.", 18, 254);
  simpleRow(trigger, "Shipped", "CTT/courier/manual delivery update.", 18, 318, "Send", "blue");
  simpleRow(trigger, "Delivered / Cancelled", "Closure message and lookup state.", 18, 382);
}

function stateCard(parent, title, note, label, x, y, variant = "plain") {
  const c = card(parent, `State / ${title}`, x, y, 336, 248);
  text(c, "State Title", title, 18, 18, 220, 25, tokens.colors.ink, tokens.font.bold);
  text(c, "State Note", note, 18, 58, 282, 11, tokens.colors.muted, tokens.font.regular);
  const fill = variant === "error" ? "#FFF0EB" : variant === "loading" ? tokens.colors.shell : tokens.colors.ivory;
  const stroke = variant === "error" ? "#E1B3AA" : tokens.colors.line;
  rect(c, "State Visual", 18, 118, 300, 96, fill, 8, stroke);
  text(c, "State Visual Label", label, 42, 152, 252, 11, variant === "error" ? tokens.colors.alert : tokens.colors.goldDeep, tokens.font.bold, "CENTER");
}

function buildStates(x, y) {
  const f = desktopFrame("A09 / Admin States and Edge Cases", x, y, "Dashboard", "Admin QA", "State coverage", "Required UI states for dashboard, orders, products, settings, messaging, and order lookup.", "Mark ready");
  stateCard(f, "Orders empty", "Shown before the first order or when filters return zero results.", "No matching orders / Clear filters", 260, 126);
  stateCard(f, "Orders loading", "Skeleton rows keep the table stable while order data loads.", "Loading orders", 608, 126, "loading");
  stateCard(f, "Orders error", "Admin can retry and still see the last known safe state.", "Could not load orders / Retry", 956, 126, "error");
  stateCard(f, "Products empty", "Manual entry remains the primary action when the catalogue starts blank.", "No products yet / Add first product", 260, 390);
  stateCard(f, "Provider pending", "Appy Pay can stay unavailable without blocking Portugal payments.", "Appy Pay pending / Use Payment Review", 608, 390);
  stateCard(f, "Order lookup", "Full accounts are deferred, but admin can help customers retrieve an order.", "Lookup by order number / Phone or email", 956, 390);
  const qa = card(f, "QA Checklist", 260, 680, 1044, 160);
  text(qa, "QA Title", "Required fallback copy", 18, 18, 260, 25, tokens.colors.ink, tokens.font.bold);
  simpleRow(qa, "Payment provider unavailable", "Show affected market and safe manual action.", 18, 70, "Covered", "green");
  simpleRow(qa, "Delivery fee missing", "Keep order draft or payment review until fee is confirmed.", 360, 70, "Covered", "green");
  simpleRow(qa, "Photo pending", "Allow product draft or placeholder publish based on admin choice.", 702, 70, "Covered", "green");
}

function mobileMetric(parent, label, value, note, x, y, variant = "plain") {
  const fill = variant === "red" ? "#FFF0EB" : tokens.colors.ivory;
  const stroke = variant === "red" ? "#E1B3AA" : tokens.colors.lineSoft;
  const node = frame(parent, `Mobile Metric / ${label}`, x, y, 170, 96, fill, 8);
  node.strokes = [solid(stroke)];
  node.strokeWeight = 1;
  text(node, "Metric Label", label, 12, 12, 120, 9, tokens.colors.goldDeep, tokens.font.bold);
  text(node, "Metric Value", value, 12, 36, 130, 25, tokens.colors.ink, tokens.font.bold);
  text(node, "Metric Note", note, 12, 72, 130, 9, tokens.colors.muted, tokens.font.regular);
}

function mobileAttention(parent, title, note, x, y, variant = "plain") {
  const node = card(parent, `Mobile Attention / ${title}`, x, y, 358, 84);
  text(node, "Attention Title", title, 14, 14, 270, 12, tokens.colors.ink, tokens.font.bold);
  text(node, "Attention Note", note, 14, 36, 260, 10, tokens.colors.muted, tokens.font.regular);
  const badgeVariant = variant === "gold" ? "gold" : variant === "red" ? "red" : "blue";
  badge(node, variant === "gold" ? "Review" : variant === "red" ? "Stock" : "Open", 268, 22, 74, badgeVariant);
}

function buildMobile(x, y) {
  const shell = frame(page, "A07 / Mobile Admin Quick Check", x, y, 390, 844, tokens.colors.paper, 24);
  shell.strokes = [solid(tokens.colors.black)];
  shell.strokeWeight = 10;
  text(shell, "Status Time", "9:41", 16, 10, 80, 10, tokens.colors.ink, tokens.font.bold);
  text(shell, "Status Signal", "5G 100%", 294, 10, 74, 10, tokens.colors.ink, tokens.font.bold, "RIGHT");
  rect(shell, "Top Divider", 0, 106, 390, 1, tokens.colors.lineSoft);
  button(shell, "Menu", 14, 48, 40);
  logo(shell, 126, 43, tokens.colors.ink);
  button(shell, "Notify", 336, 48, 40);
  text(shell, "Mobile Kicker", "Admin quick check", 16, 134, 160, 10, tokens.colors.goldDeep, tokens.font.bold);
  text(shell, "Mobile Title", "3 payments need review", 16, 158, 310, 30, tokens.colors.ink, tokens.font.bold);
  mobileMetric(shell, "Orders", "12", "Today", 16, 218, "plain");
  mobileMetric(shell, "Low stock", "7", "Needs action", 204, 218, "red");
  mobileAttention(shell, "#1045 Mariana Sousa", "Appy Pay review, Luanda, WhatsApp follow-up.", 16, 354, "gold");
  mobileAttention(shell, "#1044 Ana Pereira", "MBWay confirmed, CTT label still needed.", 16, 448, "blue");
  mobileAttention(shell, "Mares Dress S", "Sold out. Keep M/L available.", 16, 542, "red");
}

function buildCover() {
  const cover = frame(page, "00 / Admin Cover", 0, 0, 760, 430, tokens.colors.paper, 8);
  cover.strokes = [solid(tokens.colors.line)];
  cover.strokeWeight = 1;
  text(cover, "Kicker", "PHASE 1 ADMIN HIGH FIDELITY", 32, 34, 340, 11, tokens.colors.goldDeep, tokens.font.bold);
  text(cover, "Title", "Operations cockpit for launch orders, stock, markets, and manual coordination.", 32, 66, 612, 42, tokens.colors.ink, tokens.font.bold);
  text(cover, "Summary", "Desktop-first admin frames prepared for Figma transfer. Scope: Dashboard, Orders, Order Detail, Products, Product Editor, Settings, and mobile quick check.", 34, 194, 520, 16, tokens.colors.muted, tokens.font.regular);
  badge(cover, "Desktop admin first", 34, 286, 150, "dark");
  badge(cover, "Angola and Portugal", 198, 286, 148, "gold");
  badge(cover, "Figma import ready", 360, 286, 142, "blue");
  logo(cover, 540, 306, tokens.colors.ink);
}

buildCover();
buildDashboard(0, 520);
buildOrders(1460, 520);
buildOrderDetail(2920, 520);
buildProducts(0, 1540);
buildProductEditor(1460, 1540);
buildSettings(2920, 1540);
buildMobile(4380, 1540);
buildMessaging(0, 2560);
buildStates(1460, 2560);

figma.viewport.scrollAndZoomIntoView(page.children);

return {
  pageId: page.id,
  pageName: page.name,
  createdNodeIds,
  frameCount: page.children.length,
  note: "Admin Phase 1 high-fidelity frames created. Use docs/design-review/admin-phase-1 screenshots as visual QA references."
};
