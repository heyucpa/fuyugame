// 🖥️ 大螢幕（2560×1080）大地圖：地面快取要裝得下整個畫面，不能每一格重畫；飛的時候前面會先畫好
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 2560, height: 1080 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true; G.guide = 'done'; openIsland(); await w(1200); cancelAnimationFrame(isl.raf);
    let built = 0; const oc = document.createElement.bind(document); document.createElement = t => { if (t === 'canvas') built++; return oc(t); };
    for (let i = 0; i < 20; i++) islDraw(performance.now());
    o.noRebuildEveryFrame = built === 0;
    // 往下飛：前面那一排趁空檔先畫好
    isl.cam.x = 30; isl.cam.y = 10; islDraw(performance.now()); built = 0; let inDraw = 0;
    const od = islDraw; let drawing = false; islDraw = function (n) { drawing = true; const b0 = built; try { return od.call(this, n); } finally { drawing = false; inDraw += built - b0; } };
    for (let i = 0; i < 100; i++) { isl.cam.y += .3; islDraw(performance.now()); await w(40); }
    islDraw = od; document.createElement = oc;
    o.prefetched = built > 0 && inDraw <= 4;   // 大部分是空檔先畫的，畫面那一格幾乎不用等
    o.cacheBounded = isl.m._chunks.size <= 60;
    o.info = { built, inDraw, cache: isl.m._chunks.size };
    return o;
  });
  const info = o.info; delete o.info;
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), JSON.stringify(info), errs.slice(0, 2));
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
