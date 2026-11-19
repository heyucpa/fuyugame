// 🔄 自動更新：網站上的檔案比現在這一份新 → 先存檔、自動重新載入新版（進度還在）；同一版只試一次；正在玩小遊戲時先等
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
(async () => {
  const root = path.resolve(__dirname, '..'); let lm = new Date(Date.now() - 3600e3);
  const srv = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8', 'Last-Modified': (f.endsWith('house.html') ? lm : new Date()).toUTCString(), 'Cache-Control': 'max-age=600' }); res.end(req.method === 'HEAD' ? undefined : fs.readFileSync(f)); }).listen(0);
  const port = srv.address().port, url = `http://127.0.0.1:${port}/house.html`;
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' }); const p = await ctx.newPage();
  await p.addInitScript(() => { window.__UPD_TEST = true; });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const o = {};
  await p.goto(url); await p.waitForTimeout(6000);
  o.noUpdateWhenSame = await p.evaluate(() => !/[?&]v=/.test(location.search) && !UPDATE_PENDING);
  await p.evaluate(() => { document.getElementById('modal').hidden = true; G.bells = 123456; saveGame(); });
  // 網站上出了新版；小遊戲開著 → 先等
  lm = new Date(Date.now() + 120e3);
  await p.evaluate(async () => { openCopChase(1); await updateCheckNow(); }); await p.waitForTimeout(2500);
  o.waitsInGame = await p.evaluate(() => !!UPDATE_PENDING && !/[?&]v=/.test(location.search));
  await p.evaluate(() => { closeGameWindow(); });
  let reloaded = false; for (let k = 0; k < 40 && !reloaded; k++) { await p.waitForTimeout(500); reloaded = /[?&]v=\d+/.test(p.url()); }
  o.reloaded = reloaded;
  await p.waitForTimeout(3000);
  o.progressKept = await p.evaluate(() => G.bells === 123456);
  o.onlyOnce = await p.evaluate(() => { try { return !!sessionStorage.getItem('myHouse_updTried'); } catch (e) { return false; } });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 2)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); srv.close(); process.exit(ok ? 0 : 1);
})();
