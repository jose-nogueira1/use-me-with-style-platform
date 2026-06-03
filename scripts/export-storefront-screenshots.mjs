import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "docs/design-review/storefront-phase-1");
const chromeBin =
  process.env.CHROME_BIN ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = Number(process.env.STOREFRONT_EXPORT_PORT || 4193);
const baseUrl = `http://127.0.0.1:${port}/docs/phase-1-storefront-high-fidelity.html`;

const targets = [
  {
    title: "Board Overview",
    file: "00-board-overview.png",
    url: baseUrl,
    size: [1440, 1200],
  },
  {
    title: "Cover",
    file: "00-cover.png",
    exportName: "00-cover",
    size: [980, 980],
  },
  {
    title: "Design System Direction",
    file: "00-design-system.png",
    exportName: "00-design-system",
    size: [1240, 760],
  },
  {
    title: "Mobile Home",
    file: "01-mobile-home.png",
    exportName: "01-mobile-home",
    size: [760, 1120],
  },
  {
    title: "Mobile Browse and Filter",
    file: "02-mobile-browse-filter.png",
    exportName: "02-mobile-browse-filter",
    size: [760, 1120],
  },
  {
    title: "Mobile Product Detail",
    file: "03-mobile-product-detail.png",
    exportName: "03-mobile-product-detail",
    size: [760, 1120],
  },
  {
    title: "Mobile Cart",
    file: "04-mobile-cart.png",
    exportName: "04-mobile-cart",
    size: [760, 1120],
  },
  {
    title: "Mobile Checkout",
    file: "05-mobile-checkout.png",
    exportName: "05-mobile-checkout",
    size: [760, 1120],
  },
  {
    title: "Mobile Confirmation and Lookup",
    file: "06-mobile-confirmation-lookup.png",
    exportName: "06-mobile-confirmation-lookup",
    size: [760, 1120],
  },
  {
    title: "Desktop Home and Collection",
    file: "07-desktop-home-collection.png",
    exportName: "07-desktop-home-collection",
    size: [1900, 1120],
  },
  {
    title: "Tablet Product Detail",
    file: "08-tablet-product-detail.png",
    exportName: "08-tablet-product-detail",
    size: [1100, 980],
  },
  {
    title: "Figma Handoff Checklist",
    file: "09-figma-handoff.png",
    exportName: "09-figma-handoff",
    size: [1180, 620],
  },
];

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
      } else {
        reject(new Error(`${command} exited ${code}\n${stdout}\n${stderr}`));
      }
    });
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Wait and retry.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`Timed out waiting for local server at ${baseUrl}`);
}

function screenshotUrl(target) {
  if (target.url) return target.url;
  const params = new URLSearchParams({ export: target.exportName });
  return `${baseUrl}?${params.toString()}`;
}

function writeReviewReadme() {
  const generatedAt = new Date().toISOString();
  const body = [
    "# Storefront Phase 1 Design Review Screenshots",
    "",
    `Generated from \`docs/phase-1-storefront-high-fidelity.html\` at ${generatedAt}.`,
    "",
    "Regenerate with:",
    "",
    "```bash",
    "npm run export:storefront-screenshots",
    "```",
    "",
    ...targets.flatMap((target) => [
      `## ${target.title}`,
      "",
      `![${target.title}](./${target.file})`,
      "",
    ]),
  ].join("\n");

  writeFileSync(resolve(outDir, "README.md"), body);
  writeFileSync(
    resolve(outDir, "manifest.json"),
    JSON.stringify(
      {
        generatedAt,
        source: "docs/phase-1-storefront-high-fidelity.html",
        targets,
      },
      null,
      2,
    ),
  );
}

if (!existsSync(chromeBin)) {
  throw new Error(
    `Chrome not found at ${chromeBin}. Set CHROME_BIN to the Chrome executable path.`,
  );
}

mkdirSync(outDir, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});

try {
  await waitForServer();

  for (const target of targets) {
    const [width, height] = target.size;
    const outputPath = resolve(outDir, target.file);
    await run(chromeBin, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--force-device-scale-factor=1",
      "--virtual-time-budget=2200",
      `--window-size=${width},${height}`,
      `--screenshot=${outputPath}`,
      screenshotUrl(target),
    ]);
    console.log(`exported ${target.file}`);
  }

  writeReviewReadme();
  console.log(`screenshots written to ${outDir}`);
} finally {
  server.kill("SIGINT");
}
