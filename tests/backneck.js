// 背影看得到脖子：妹妹頭背對畫面時，頭髮下面中間露出皮膚色的脖子；長髮背影還是蓋住脖子
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; };
    try {
      const shot = (style, back) => { const c = document.createElement('canvas'); c.width = 80; c.height = 110; const g = c.getContext('2d'); g.translate(40, 104); g.scale(1.5, 1.5);
        drawGirl(g, { t: 1, walking: false, back, blink: false, outfit: currentOutfit(), face: 'happy', stage: 'kid', hair: { style, color: 'brown' } }); return g; };
      const skinAt = (g) => { let n = 0; for (let y = 50; y < 64; y++) { const d = g.getImageData(40, y, 1, 1).data; if (d[0] > 230 && d[1] > 180 && d[1] < 225 && d[2] > 150 && d[2] < 205) n++; } return n; };
      o.bobNeck = skinAt(shot('bob', true)) >= 2;
      o.longCovered = skinAt(shot('long', true)) === 0;
      o.ponyNeck = skinAt(shot('pony', true)) >= 2;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
