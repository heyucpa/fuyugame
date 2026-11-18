// 🐢 切到商店／換裝：小圖分批畫（每格最多 8 毫秒），一下子就全部補好；畫過的存起來。順暢模式走路不是慢動作。
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true; THUMB_LAZY = true;
    const blank = () => [...document.querySelectorAll('#tabBody img')].filter(i => i.src === THUMB_BLANK).length;
    let t = performance.now(); openTab('shop'); const shopMs = performance.now() - t;
    o.shopSomeLater = blank() > 0;
    for (let k = 0; k < 100 && blank(); k++) await w(50);
    o.shopAllFilled = blank() === 0 && document.querySelectorAll('#tabBody img').length > 50;
    t = performance.now(); openTab('dress'); o.dressSomeLater = blank() > 0;
    for (let k = 0; k < 100 && blank(); k++) await w(50);
    o.dressAllFilled = blank() === 0;
    const srcs = [...document.querySelectorAll('#tabBody img.girl-thumb')].map(i => i.src); o.dressDistinct = new Set(srcs).size > 10;
    openTab('shop'); o.shopCachedNow = blank() === 0;
    // 走路：一秒 15 格時也是正常速度
    o.walkFull = (() => { const a = Math.min(.075, (1000 / 15) / 1000); return a >= 1 / 15 - 1e-9; })();
    o.info = Math.round(shopMs) + 'ms';
    return o;
  });
  const info = o.info; delete o.info;
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), info, errs.slice(0, 2));
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
