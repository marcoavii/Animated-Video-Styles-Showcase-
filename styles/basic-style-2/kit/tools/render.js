// Headless renderer. Ratio comes from --ratio or project.json. Run from the project folder.
//   node tools/render.js --stills 1.2,3.4 --out build/stills     JPG stills at given times
//   node tools/render.js --video                                  full render + mux to out/<name>-<ratio>.mp4
//   node tools/render.js --video --from 8 --to 12                 test a range (no mux)
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const CHROME = [process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA && process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", process.env.HOME && process.env.HOME + "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"]
  .find((p) => p && fs.existsSync(p));
if (!CHROME) throw new Error("Chrome or Edge not found. Install Google Chrome, or set CHROME_PATH to chrome.exe / msedge.exe.");
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i < 0 ? null : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const proj = fs.existsSync(path.join(ROOT, 'project.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'project.json'), 'utf8')) : {};
const RATIO = opt('ratio') || proj.ratio || '16:9';
if (!['16:9', '9:16'].includes(RATIO)) { console.error('ratio must be 16:9 or 9:16'); process.exit(1); }
const [OW, OH] = RATIO === '9:16' ? [1080, 1920] : [1920, 1080];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const file = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(r);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
async function openPage(browser, port) {
  const page = await browser.newPage();
  await page.setViewport({ width: OW, height: OH });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });
  await page.goto(`http://127.0.0.1:${port}/index.html?ratio=${RATIO}`);
  await page.evaluate(() => window.ready);
  return page;
}
const launch = () => puppeteer.launch({
  executablePath: CHROME, headless: 'new', defaultViewport: null,
  args: ['--disable-gpu-vsync', '--mute-audio', '--force-device-scale-factor=1', '--force-color-profile=srgb', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
});
const grab = (page, t, q = .97) => page.evaluate((t, q) => { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', q).split(',')[1]; }, t, q);

async function stills(times, out) {
  fs.mkdirSync(out, { recursive: true });
  const srv = await serve(), browser = await launch(), page = await openPage(browser, srv.address().port);
  for (const t of times) fs.writeFileSync(path.join(out, `t${t.toFixed(3).padStart(8, '0')}.jpg`), Buffer.from(await grab(page, t, .9), 'base64'));
  await browser.close(); srv.close();
}
async function worker(id, port, f0, f1, fps, out) {
  const browser = await launch(); const page = await openPage(browser, port);
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(fps), '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-x264-params', 'threads=3', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const started = Date.now();
  for (let f = f0; f < f1; f++) {
    const b = Buffer.from(await grab(page, f / fps), 'base64');
    if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 300 === 0 && f > f0) console.log(`w${id} ${f - f0}/${f1 - f0}  ${((f - f0) / ((Date.now() - started) / 1000)).toFixed(1)} fps`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await browser.close();
}
const run = (a) => new Promise((res, rej) => spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' }).on('close', c => c ? rej(new Error('ffmpeg failed')) : res()));
async function video() {
  const tl = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/timeline.json'), 'utf8'));
  const fps = 60, partial = opt('from') !== null || opt('to') !== null;
  const from = parseFloat(opt('from') || 0), to = parseFloat(opt('to') || tl.dur), n = parseInt(opt('workers') || 5);
  const F0 = Math.round(from * fps), F1 = Math.round(to * fps), chunk = Math.ceil((F1 - F0) / n);
  const tag = RATIO.replace(':', 'x'), dir = path.join(ROOT, 'build', 'chunks-' + tag); fs.mkdirSync(dir, { recursive: true });
  const srv = await serve(), port = srv.address().port, jobs = [], list = [];
  for (let i = 0; i < n; i++) {
    const a = F0 + i * chunk, b = Math.min(F1, a + chunk), file = path.join(dir, `c${i}.mp4`);
    list.push(`file '${file.replace(/\\/g, '/')}'`);
    jobs.push(worker(i, port, a, b, fps, file));
  }
  await Promise.all(jobs); srv.close();
  const lf = path.join(dir, 'list.txt'); fs.writeFileSync(lf, list.join('\n'));
  const silent = path.join(ROOT, 'build', `video-${tag}.mp4`);
  await run(['-f', 'concat', '-safe', '0', '-i', lf, '-c', 'copy', '-r', '60', silent]);
  fs.rmSync(dir, { recursive: true, force: true });
  if (partial) return console.log('wrote', silent);
  const outDir = path.join(ROOT, 'out'); fs.mkdirSync(outDir, { recursive: true });
  const final = path.join(outDir, `${proj.name || path.basename(ROOT)}-${tag}.mp4`);
  await run(['-i', silent, '-i', path.join(ROOT, 'audio/mix.wav'), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-shortest', '-movflags', '+faststart', final]);
  fs.rmSync(silent, { force: true });
  console.log('wrote', final);
}
(async () => {
  if (opt('stills')) await stills(String(opt('stills')).split(',').map(Number), opt('out') || 'build/stills');
  else if (opt('video')) await video();
  else console.error('use --stills or --video');
})().catch(e => { console.error(e); process.exit(1); });
