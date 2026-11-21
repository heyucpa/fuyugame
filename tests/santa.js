// 🎅 聖誕老公公的家＋借雪橇：聖誕節期間地圖上才有、過了進不去；主人畫得出來、選單；玩具工廠（照訂單、錯的不算）、麋鹿（照想要的給 8 次）、包禮物；每天星星；送 5 份禮物借雪橇（可以飛）；聖誕節過了收回、送模型；明年可以再借；遊戲選單；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; }, sceneClose = () => { const s = document.getElementById('vevScene'); if (s && vevScene.test) vevScene.test.close(); };
    try {
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.xmas = { stars: 0, got: [] }; G.vehicles = ['bike']; G.ride = 'bike'; G.gameBonusDay = today();
    SEASON_TODAY = [12, 5]; islMapCache = null; o.onMap = islMap(0).blds.some(q => q.id === 'santa');
    SEASON_TODAY = [1, 5]; o.offMap = !islMap(0).blds.some(q => q.id === 'santa');
    o.hubOff = !allQuickGames().some(g => g.where === 'santa');
    SEASON_TODAY = [12, 5]; o.hubOn = allQuickGames().some(g => g.where === 'santa'); islMap(0);
    o.host = (() => { try { const c = document.createElement('canvas').getContext('2d'); drawNeighbor(c, HOSTS.santa, { happy: true }); return true; } catch (e) { return e.message; } })() === true;
    host.n = HOSTS.santa; const lab = hostMenuEntries().map(e => e[0]).join('|'); o.menu = /做玩具/.test(lab) && /麋鹿/.test(lab) && /包禮物/.test(lab) && /熱可可/.test(lab) && /再送 5 份/.test(lab);
    o.acts = FURNITURE_ACT.toy_bench === 'santa_toy' && FURNITURE_ACT.reindeer_stall === 'santa_deer' && FURNITURE_ACT.wrap_table === 'santa_wrap';
    // 玩具工廠
    openToyFactory(); let T = openToyFactory.test; const o0 = T.orders[0]; T.set(o0.type === 'car' ? 'bear' : 'car', o0.col); T.make(); o.toyWrong = T.k === 0;
    T.orders.forEach(od => { T.set(od.type, od.col); T.make(); }); o.toyDone = T.k === 3 && G.xmas.gm.toy === today() && G.xmas.stars === 1; close();
    // 麋鹿
    openDeerCare(); const D = openDeerCare.test; const wrongId = DEER_WANTS.map(q => q[0]).find(k => k !== D.want); D.give(wrongId); o.deerWrong = D.got === 0;
    for (let i = 0; i < 8; i++) { D.give(D.want); await w(950); } await w(300); o.deerDone = D.got === 8 && G.xmas.gm.deer === today() && G.xmas.stars === 2; close();
    // 包禮物
    openGiftWrap(); const P = openGiftWrap.test; P.set('paper', 'star'); P.fin(); o.wrapNeedAll = G.xmas.stars === 2;
    P.set('ribbon', '#ffd23f'); P.set('tag', '⭐'); P.fin(); o.wrapDone = G.xmas.gm.wrap === today() && G.xmas.stars === 3; await w(1000); close();
    // 借雪橇
    G.xmas.gave = 4; o.notYet = santaSleighCheck() === false && !santaLent();
    G.xmas.gave = 5; o.lend = santaSleighCheck() === true && G.vehicles.includes('sleigh') && G.xmas.lend === new Date().getFullYear(); await w(1500); o.lendScene = !!document.getElementById('vevScene'); sceneClose(); sceneClose(); await w(100);
    o.draws = (() => { try { vehicleCanvas('sleigh', 120, 70); return true; } catch (e) { return e.message; } })() === true;
    openIsland(); await w(900); G.ride = 'sleigh'; islRideBtn(); islToggleFly(); o.flies = !!(isl.fly && isl.fly.on); closeIsland(); await w(200); document.getElementById('modal').hidden = true;
    // 聖誕節過了：收回
    SEASON_TODAY = [1, 3]; const m0 = G.inv.sleigh_model || 0; o.ret = santaSleighReturn() === true && !G.vehicles.includes('sleigh') && G.ride !== 'sleigh' && (G.inv.sleigh_model || 0) === m0 + 1; sceneClose(); sceneClose();
    o.retOnce = santaSleighReturn() === false;
    o.closedDoor = (() => { openIsland(); return true; })(); await w(800); const away0 = G.away; islEnter('santa'); o.cantEnter = !!isl && G.away === away0; closeIsland(); await w(200); document.getElementById('modal').hidden = true;
    // 明年再借
    SEASON_TODAY = [12, 5]; o.sameYearNo = santaSleighCheck() === false;
    G.xmas.lend = new Date().getFullYear() - 1; o.nextYear = santaSleighCheck() === true; await w(1500); sceneClose(); sceneClose();
    // 存檔
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { xmas: { stars: 3, got: [], gave: 7, lend: 2026, gm: { toy: '2026-12-05', deer: 'x', bad: '1' } } }));
    o.save = n.xmas.gave === 7 && n.xmas.lend === 2026 && n.xmas.gm.toy === '2026-12-05' && n.xmas.gm.bad === undefined && n.vehicles.includes('sleigh');
    o.saveBad = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { xmas: { gave: -1, lend: 5 } })).xmas.gave === undefined;
    SEASON_TODAY = null;
    } catch (e) { o.err = String(e.stack).slice(0, 400); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
