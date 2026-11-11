// Static server + headless Chrome (discrete GPU forced), shared by stills and the final render.
// node_modules lives one level above the video project, so every video shares one install.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(import.meta.dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff" };

function resolveUrl(url) {
  const rel = decodeURIComponent(url.split("?")[0]);
  const here = path.join(ROOT, rel);
  if (here.startsWith(ROOT) && fs.existsSync(here)) return here;
  if (rel.startsWith("/node_modules/")) {
    const up = path.join(ROOT, "..", rel);
    if (fs.existsSync(up)) return up;
  }
  return null;
}

export function startServer() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = resolveUrl(req.url);
      if (!p || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-store" });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, "127.0.0.1", () => res({ srv, port: srv.address().port }));
  });
}

const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((p) => fs.existsSync(p));

export async function openPage(w, h, extra = "") {
  const { srv, port } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    protocolTimeout: 600000,
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl", "--force_high_performance_gpu", "--disable-gpu-vsync", "--disable-frame-rate-limit", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", `--window-size=${w},${h}`],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  page.on("console", (m) => { const t = m.text(); if (m.type() === "error" || m.type() === "warning" || t.startsWith("[")) { if (!/GPU stall|GL Driver Message|THREE.WebGLRenderer: Context/.test(t)) console.log("page:", t.slice(0, 600)); } });
  page.on("pageerror", (e) => console.log("pageerror:", String(e).slice(0, 800)));
  await page.goto(`http://127.0.0.1:${port}/scenes/index.html?w=${w}&h=${h}${extra}`);
  await page.waitForFunction("window.__ready===true||window.__error", { timeout: 300000 });
  const err = await page.evaluate("window.__error");
  if (err) { console.error(err); await browser.close(); srv.close(); process.exit(1); }
  const renderer = await page.evaluate(() => { const g = document.getElementById("gl").getContext("webgl2"); const e = g && g.getExtension("WEBGL_debug_renderer_info"); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?"; });
  if (/SwiftShader|Software/i.test(renderer)) console.log("WARNING: rendering on the CPU:", renderer);
  return { page, browser, srv };
}
