// 🎆 煙火：哪幾天放（聖誕、跨年、春節初一～初五）、遊戲選單只有那幾天有、放煙火小遊戲（點了會飛上去炸開、四種形狀、放 10 發給錢一次）、大地圖晚上自己放、跨年倒數／春節紅包一年一次、存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), sc = () => { const s = document.getElementById('vevScene'); if (s) vevScene.test.close(); };
    try {
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.fw = {}; G.gameBonusDay = today();
    const on = md => { SEASON_TODAY = md; const d = fwDay(); return d && d.id; };
    const y = new Date().getFullYear(), c = CNY_DATES[y + 1] || CNY_DATES[2027];
    o.days = on([12, 19]) == null && on([12, 20]) === 'xmas' && on([12, 26]) === 'xmas' && on([12, 27]) === 'ny' && on([12, 31]) === 'ny' && on([1, 2]) === 'ny' && on([1, 3]) == null && on([7, 4]) == null;
    SEASON_TODAY = [12, 28]; G.fw = {}; o.noEarlyCount = fwFestScene() === false; G.fw = {};
    { const cc0 = CNY_DATES[y]; if (cc0) { const dd = new Date(y, cc0[0] - 1, cc0[1] + 6), d7 = new Date(y, cc0[0] - 1, cc0[1] + 7); o.cny7 = on([dd.getMonth() + 1, dd.getDate()]) === 'cny' && on([d7.getMonth() + 1, d7.getDate()]) == null; } else o.cny7 = true; }
    SEASON_TODAY = [11, 22]; o.hubOff = !allQuickGames().some(g => g.id === 'x:fw');
    SEASON_TODAY = [12, 31]; o.hubOn = allQuickGames()[0].id === 'x:fw';
    openFireworks(); const F = openFireworks.test; await w(100); const b0 = G.bells;
    for (let i = 0; i < 10; i++) { F.pick(i % 4); F.fire(100 + i * 15, 80); }
    await w(1500); o.burst = F.ps.length > 30 && F.n === 10 && G.bells > b0;
    const b1 = G.bells; for (let i = 0; i < 5; i++) F.fire(150, 80); o.payOnce = G.bells === b1; closeGameWindow(); document.getElementById('modal').hidden = true;
    // 大地圖晚上
    openIsland(); await w(900); ISL_HOUR_TEST = 21; islFw.next = 0; for (let i = 0; i < 30; i++) { islFwDraw(isl.cv.getContext('2d'), performance.now() + i * 50); } o.islFw = islFw.rk.length + islFw.ps.length > 0;
    ISL_HOUR_TEST = 12; islFw.ps.length = 0; islFw.rk.length = 0; islFw.next = 0; islFwDraw(isl.cv.getContext('2d'), performance.now() + 5000); o.dayNone = islFw.rk.length === 0;
    ISL_HOUR_TEST = null; closeIsland(); await w(200); document.getElementById('modal').hidden = true;
    // 跨年倒數
    SEASON_TODAY = [12, 31]; o.ny = fwFestScene() === true && /倒數/.test(document.querySelector('.vev-cap').textContent); sc(); sc(); o.nyOnce = fwFestScene() === false && G.fw.ny === y + 1;
    // 春節：用今年的初一
    const cc = CNY_DATES[y]; if (cc) { SEASON_TODAY = [cc[0], cc[1] + 2]; const b2 = G.bells; o.cny = fwFestScene() === true && G.bells === b2 + 200; sc(); sc(); o.cnyOnce = fwFestScene() === false; } else { o.cny = true; o.cnyOnce = true; }
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { fw: { ny: 2027, cny: 5, x: 1 } }));
    o.save = JSON.stringify(n.fw) === JSON.stringify({ ny: 2027 });
    SEASON_TODAY = null;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
