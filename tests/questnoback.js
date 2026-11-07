// ➡️ 闖關：按住 ▶ 頂著牆，不會自己往左退（以前簡單模式卡 1.6 秒會自動往後退，小朋友覺得「突然往左跑」）
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(() => {
    const o = {}, QT = 18; G.guide = 'done'; $('#modal').hidden = true;
    for (const mode of ['easy', 'normal']) {
      questState().mode = mode; playQuest('1-1'); const T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
      T.ents.length = 0; for (let r = 0; r < 14; r++) for (let c = 0; c < 30; c++) T.L.g[r][c] = r >= 13 ? '#' : ' ';
      for (let r = 8; r < 13; r++) T.L.g[r][12] = '#';   // 一面高牆
      T.P.x = 8 * QT; T.P.y = 13 * QT - T.P.h; T.P.vx = 0; T.P.vy = 0; T.keys.ArrowRight = true;
      let minX = 1e9; for (let i = 0; i < 60 * 4; i++) { T.step(1 / 60); if (i > 60) minX = Math.min(minX, T.P.x); }
      o[mode] = minX > 12 * QT - T.P.w - 4 && T.P.x > 12 * QT - T.P.w - 4;
      T.keys.ArrowRight = false; closeGameWindow(); $('#modal').hidden = true;
    }
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
