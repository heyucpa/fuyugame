// 🎨 美勞課可以一直塗滿：上限放大（卡片維持原本）、超粗筆刷、「畫好滿了」不會一直疊、存檔留得住大張畫、作品牆用快取
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    const scribble = (cv, n) => {   // 在畫布上塗 n 筆，每筆來回很多點
      const r = cv.getBoundingClientRect(), ev = (t, x, y) => cv['on' + t]({ preventDefault() {}, pointerId: 1, clientX: r.left + x / PAD_W * r.width, clientY: r.top + y / PAD_H * r.height });
      for (let k = 0; k < n; k++) { ev('pointerdown', 10, 10 + (k % 14) * 10); for (let i = 0; i < 60; i++) ev('pointermove', 10 + (i % 2 ? 220 : 0) * ((i % 4) > 1 ? 1 : .5), 10 + (k % 14) * 10 + (i % 3) * 3); ev('pointerup', 0, 0); }
    };
    let toasts = 0; const t0 = window.toast; window.toast = (...a) => { toasts++; return t0(...a); };
    // 美勞課（big）
    let got = null; openDrawPad('test', d => { got = d; }, { big: true }); await wait(50);
    const T = openDrawPad.test; scribble(T.cv, 60);
    o.bigPast1500 = padPoints({ s: T.strokes }) > 1500;
    o.threeSizes = [...document.querySelectorAll('#modalCard .pad-t')].some(x => /超粗/.test(x.textContent)) && PAD_SIZES.length === 3;
    // 塞到滿：一直點，提醒只跳一次
    toasts = 0; scribble(T.cv, 200); o.toastOnce = toasts <= 2;
    [...document.querySelectorAll('#modalCard button')].find(x => /畫好了/.test(x.textContent)).click();
    o.bigKept = got && padPoints(got) > 1500;
    // 存檔：作品牆的大張畫不會被剪到 1500
    G.artWall = [got]; saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    o.savedBig = padPoints(normalizeSave(raw).artWall[0]) > 1500;
    // 卡片（連結）維持 1500
    openDrawPad('card', d => { got = d; }); await wait(50); scribble(openDrawPad.test.cv, 80);
    o.cardCapped = padPoints({ s: openDrawPad.test.strokes }) <= 1500 + 60;
    // 作品牆快取：同一張畫第二次貼圖很快
    const c = document.createElement('canvas'); c.width = c.height = 200; const g = c.getContext('2d');
    drawCardStrokesCached(g, G.artWall[0], .5); const t1 = performance.now(); for (let i = 0; i < 50; i++) drawCardStrokesCached(g, G.artWall[0], .5); o.cachedFast = performance.now() - t1 < 50;
    document.getElementById('modal').hidden = true; window.toast = t0;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
