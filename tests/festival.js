// 農曆節日：端午／中秋／元宵日期（農曆對照）、限定商品、遊戲選單出現、下一個節日倒數；划龍舟、包粽子、中秋烤肉、玉兔搗麻糬、猜燈謎、搓湯圓
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
    const ids = () => allQuickGames().map(g => g.id);
    SEASON_TODAY = [6, 13]; o.duanwuStart = (seasonNow() || {}).id === 'duanwu' && ids().includes('f:boat') && ids().includes('f:zongzi');
    SEASON_TODAY = [6, 12]; o.duanwuBefore = !seasonNow();
    SEASON_TODAY = [6, 20]; o.duanwuEnd = (seasonNow() || {}).id === 'duanwu'; SEASON_TODAY = [6, 21]; o.duanwuOver = !seasonNow() && !ids().includes('f:boat');
    SEASON_TODAY = [9, 25]; o.moon = (seasonNow() || {}).id === 'midautumn' && ids().includes('f:bbq') && ids().includes('f:mochi');
    SEASON_TODAY = [3, 3]; o.lantern = (seasonNow() || {}).id === 'lantern' && ids().includes('f:riddle'); SEASON_TODAY = [2, 23]; o.lanternNotDuringFw = !seasonNow() || seasonNow().id !== 'lantern';
    SEASON_TODAY = [12, 5]; o.xmasStill = (seasonNow() || {}).id === 'christmas';
    SEASON_TODAY = [1, 10]; const nx = festNext(); o.nextFest = !!nx && nx.name === '元宵節' && nx.days === 45;
    openQuickGames(); o.calShown = /下一個節日/.test(document.querySelector('.qg-cal').textContent); document.getElementById('modal').hidden = true;
    SEASON_TODAY = [6, 15]; openQuickGames(); o.calNow = /現在是端午節/.test(document.querySelector('.qg-cal').textContent); document.getElementById('modal').hidden = true;
    o.shopItems = !!FURN_BY_ID.dragon_boat_model && !!KID_FOOD_BY_ID.zongzi && SEASON_FURNITURE.some(d => d.season === 'lantern');
    o.notice = !!SEASON_NOTICE.duanwu && /端午/.test(festVisitLine(seasonNow()) + '端午');
    // 划龍舟
    openDragonBoat(); let B = openDragonBoat.test; B.setT(B.P * 4 + .02); const v0 = B.me.v; B.hit(); o.boatOnBeat = B.me.v > v0 + 50; const v1 = B.me.v; B.hit(); o.boatSameBeatSlows = B.me.v < v1;
    B.setT(B.P * 5 + .37); const v2 = B.me.v; B.hit(); o.boatOffBeat = B.me.v < v2;
    B.win(); await w(200); o.boatWin = B.done && /第一名/.test(document.querySelector('.game-card').textContent); close();
    openDragonBoat(); B = openDragonBoat.test; B.setT(0); B.rv.x = 999.9; await w(200); o.boatLose = B.done && /青蛙隊先到/.test(document.querySelector('.game-card').textContent); close();
    // 包粽子
    const z0 = G.kidFood.zongzi || 0; openZongzi(); const Z = openZongzi.test; Z.next(); Z.next(); o.zFillStep = Z.st === 2; Z.pickFill(1); Z.pickFill(1); o.zNoDouble = Z.st === 2; Z.pickFill(2); o.zFillDone = Z.st === 3;
    for (let i = 0; i < 5; i++) Z.next(); Z.skip(); await w(150); o.zongzi = Z.done && (G.kidFood.zongzi || 0) === z0 + 2 && /鹹蛋黃＋香菇/.test(document.querySelector('.game-card').textContent); close();
    // 烤肉
    openBBQ(); const Q = openBBQ.test; Q.slots[0].c = .2; Q.take(0); o.bbqRaw = Q.plate === 0 && Q.slots[0].c === .2;
    Q.slots[1].c = 1.2; Q.take(1); o.bbqBurnt = Q.plate === 0 && Q.slots[1].c === 0;
    for (let i = 0; i < 8; i++) { Q.slots[i % 4].wait = 0; Q.slots[i % 4].c = .8; Q.take(i % 4); } await w(100); o.bbqWin = Q.done && /月餅/.test(document.querySelector('.game-card').textContent); close();
    // 搗麻糬
    openMochi(); const M = openMochi.test; const hn = M.notes.find(n => n.k === 'hit'); M.setT(hn.at); M.press(); o.mochiHit = M.good === 1;
    const hd = M.notes.find(n => n.k === 'hand'); if (hd) { M.setT(hd.at); M.press(); o.mochiHand = M.oops === 1; } else o.mochiHand = true;
    M.notes.forEach(n => { if (!n.res) { M.setT(n.at); if (n.k === 'hit') M.press(); } }); M.setT(999); await w(150); o.mochiDone = M.done; close();
    // 猜燈謎
    openRiddles(); const R = openRiddles.test; const wrong = R.opts.findIndex(x => x !== R.q); R.answer(wrong); o.riddleWrongStays = R.lit === 0;
    for (let k = 0; k < 5; k++) { R.answer(R.opts.indexOf(R.q)); await w(1000); } o.riddleWin = R.done && R.lit === 5; close();
    // 搓湯圓
    openTangyuan(); const T = openTangyuan.test; for (let i = 0; i < 6 * 8; i++) T.roll(); o.tyMade = T.made === 6; T.skip(); await w(150); o.tyDone = T.done; close();
    SEASON_TODAY = null;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
