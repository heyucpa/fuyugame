// 搭船的感覺：船上和碼頭的背景是大海（會動）、房間底下是船身／碼頭，其他地方不受影響，海上的底圖會常常重畫
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
      G.guide = 'done';
      travelArrive('ship', 0); await w(800);
      o.shipSea = seaPlace() === 'ship';
      const b0 = roomLayerStats.builds; await w(1000); o.animates = roomLayerStats.builds - b0 >= 3;
      const cv = document.getElementById('view'), g = cv.getContext('2d');
      const px = g.getImageData(4, cv.height - 6, 1, 1).data; o.seaBlue = px[2] > px[0] + 40;
      travelArrive('cruise', 0); await w(600); o.dock = seaPlace() === 'dock';
      travelArrive('park', 0); await w(600); o.parkNormal = seaPlace() === null;
      const px2 = g.getImageData(4, cv.height - 6, 1, 1).data; o.parkNotSea = !(px2[2] > px2[0] + 40 && px2[2] > 150 && px2[1] < 140);
      o.noCssRock = !cv.style.transform;
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
