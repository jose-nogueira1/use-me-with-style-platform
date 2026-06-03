import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "docs/design-review/admin-phase-1");
const chromeBin =
  process.env.CHROME_BIN ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = Number(process.env.ADMIN_EXPORT_PORT || 4194);
const baseUrl = `http://127.0.0.1:${port}/docs/phase-1-admin-high-fidelity.html`;

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
    size: [1760, 720],
  },
  {
    title: "Admin Design System Direction",
    file: "00-design-system.png",
    exportName: "00-design-system",
    size: [1440, 560],
  },
  {
    title: "Admin Dashboard",
    file: "01-admin-dashboard.png",
    exportName: "01-dashboard",
    size: [1360, 918],
  },
  {
    title: "Orders Queue",
    file: "02-orders-queue.png",
    exportName: "02-orders",
    size: [1360, 918],
  },
  {
    title: "Order Detail and Payment Review",
    file: "03-order-detail-payment-review.png",
    exportName: "03-order-detail",
    size: [1360, 918],
  },
  {
    title: "Products Catalogue",
    file: "04-products-catalogue.png",
    exportName: "04-products",
    size: [1360, 918],
  },
  {
    title: "Product Editor",
    file: "05-product-editor.png",
    exportName: "05-product-editor",
    size: [1360, 918],
  },
  {
    title: "Settings",
    file: "06-settings.png",
    exportName: "06-settings",
    size: [1360, 918],
  },
  {
    title: "Mobile Admin Quick Check",
    file: "07-mobile-admin-quick-check.png",
    exportName: "07-mobile-admin",
    size: [1360, 900],
  },
  {
    title: "Messaging Automation Foundation",
    file: "08-messaging-automation-foundation.png",
    exportName: "08-messaging-automation",
    size: [1360, 918],
  },
  {
    title: "Admin States and Edge Cases",
    file: "09-admin-states-edge-cases.png",
    exportName: "09-admin-states",
    size: [1360, 918],
  },
  {
    title: "Figma Handoff Checklist",
    file: "08-figma-handoff.png",
    exportName: "08-figma-handoff",
    size: [1360, 560],
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

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeReviewArtifacts() {
  const generatedAt = new Date().toISOString();
  const readmeBody = [
    "# Admin Phase 1 Design Review Screenshots",
    "",
    `Generated from \`docs/phase-1-admin-high-fidelity.html\` at ${generatedAt}.`,
    "",
    "Regenerate with:",
    "",
    "```bash",
    "npm run export:admin-screenshots",
    "```",
    "",
    ...targets.flatMap((target) => [
      `## ${target.title}`,
      "",
      `![${target.title}](./${target.file})`,
      "",
    ]),
  ].join("\n");

  const galleryCards = targets
    .map(
      (target) => `
        <article class="card">
          <h2>${escapeHtml(target.title)}</h2>
          <a href="./${escapeHtml(target.file)}">
            <img src="./${escapeHtml(target.file)}" alt="${escapeHtml(target.title)}" />
          </a>
        </article>
      `,
    )
    .join("\n");

  const galleryBody = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Use Me With Style - Admin Phase 1 Review</title>
    <style>
      :root {
        --black: #050505;
        --ink: #171514;
        --muted: #6c655d;
        --line: #d8cdb7;
        --paper: #fffdf8;
        --ivory: #f8f4ec;
        --gold: #caa039;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--ivory);
        color: var(--ink);
        font-family: Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
      }

      main {
        width: min(1280px, calc(100% - 40px));
        margin: 0 auto;
        padding: 32px 0 52px;
      }

      header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 18px;
        align-items: end;
        margin-bottom: 22px;
      }

      h1 {
        margin: 0;
        font-family: Georgia, serif;
        font-size: 44px;
        line-height: 1;
      }

      p {
        max-width: 720px;
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }

      a {
        color: inherit;
      }

      .button {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--black);
        border-radius: 6px;
        background: var(--black);
        color: var(--gold);
        padding: 0 14px;
        font-size: 12px;
        font-weight: 800;
        text-decoration: none;
        text-transform: uppercase;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .card {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper);
        padding: 14px;
      }

      .card h2 {
        margin: 0 0 12px;
        font-size: 15px;
        line-height: 1.3;
      }

      img {
        display: block;
        width: 100%;
        height: auto;
        border: 1px solid #ece5d8;
        border-radius: 6px;
        background: white;
      }

      @media (max-width: 800px) {
        header,
        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>Admin Phase 1 Review</h1>
          <p>Generated screenshots from the local high-fidelity admin design pack. Use these for quick visual review before the Figma transfer.</p>
        </div>
        <a class="button" href="../../phase-1-admin-high-fidelity.html">Open HTML Board</a>
      </header>
      <section class="grid">
        ${galleryCards}
      </section>
    </main>
  </body>
</html>`;

  writeFileSync(resolve(outDir, "README.md"), readmeBody);
  writeFileSync(resolve(outDir, "index.html"), galleryBody);
  writeFileSync(
    resolve(outDir, "manifest.json"),
    JSON.stringify(
      {
        generatedAt,
        source: "docs/phase-1-admin-high-fidelity.html",
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

  writeReviewArtifacts();
  console.log(`screenshots written to ${outDir}`);
} finally {
  server.kill("SIGINT");
}
