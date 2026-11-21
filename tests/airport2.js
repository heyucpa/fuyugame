// ✈️ 機場第二批：行李安檢（有危險的要打開、乾淨的放行；錯 2 個以內過關）、塔台指揮（跑道一次一台、空白鍵叫等最久的）、空服員送餐（推車過去、給對的東西、兩樣都給才算）；三個都過第 3 關送飛機模型一次；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; };
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.trip = { st: {} }; G.inv.plane_model = 0; G.gameBonusDay = today();
    host.n = HOSTS.airport; const lab = hostMenuEntries().map(e => e[0]).join('|'); o.menu = /行李安檢/.test(lab) && /塔台/.test(lab) && /送餐/.test(lab);
    o.acts = FURNITURE_ACT.xray_belt === 'air_sec' && FURNITURE_ACT.food_cart === 'air_meal' && FURNITURE_ACT.departure_board === 'air_tower';
    o.room = PLACES.airport.rooms[0].items.some(i => (i.id || i[0]) === 'xray_belt') && PLACES.airport.rooms[0].items.some(i => (i.id || i[0]) === 'food_cart');
    openSecurity(); o.lockedLv = document.querySelectorAll('.lv-btn.alt').length === 2; close();
    // 安檢：每個都答對
    const runSec = async (lv, wrong) => { openSecurity(lv); const T = openSecurity.test; let k = 0;
      for (let guard = 0; guard < 400 && T.idx < T.bags.length && document.querySelector('.tkd-moves'); guard++) { if (T.ph === 'in') T.x = 200; await w(30); if (T.ph === 'wait') { const bad = T.bags[T.idx].items.some(T.isBad); T.decide(k++ < wrong ? !bad : bad); T.x = 999; } }
      await w(150); return T; };
    let T = await runSec(1, 0); o.secMix = T.bags.some(b => b.items.some(T.isBad)) && T.bags.some(b => !b.items.some(T.isBad));
    o.secWin = T.good === 6 && T.miss === 0 && G.trip.sec === 1; close();
    T = await runSec(2, 3); o.secLose = T.miss === 3 && G.trip.sec === 1 && /再試一次/.test(document.querySelector('.game-card').textContent); close();
    // 鍵盤：← 放行、→ 打開
    openSecurity(1); T = openSecurity.test; T.x = 200; await w(80); const g0 = T.good + T.miss;
    document.dispatchEvent(new KeyboardEvent('keydown', { code: T.bags[0].items.some(T.isBad) ? 'ArrowRight' : 'ArrowLeft' })); o.secKey = T.good === 1 && g0 === 0; close();
    // 塔台
    openTower(1); let R = openTower.test; R.spawn(); R.spawn(); R.spawn(); await w(50);
    const wait = R.planes.filter(p => p.ph === 'wait'); R.go(wait[0]); R.go(wait[1]); o.oneRunway = R.planes.filter(p => p.ph === 'go').length === 1;
    await w(2200); o.twrDone = R.done >= 1;
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); o.twrSpace = R.planes.some(p => p.ph === 'go');
    R.done = 5; await w(2300); o.twrWin = G.trip.twr === 1; close();
    openTower(2); R = openTower.test; R.end(); await w(100); o.twrLose = G.trip.twr === 1 && /再試一次/.test(document.querySelector('.game-card').textContent); close();
    // 送餐
    openMeal(1); let M = openMeal.test; const s0 = M.seats[0]; s0.want = ['rice']; M.cx = s0.x; M.pick(0); M.give(0); o.mealWrong = s0.want.length === 1 && M.done === 0;
    M.pick(1); M.give(0); o.mealRight = s0.want.length === 0 && M.done === 1;
    const s3 = M.seats[3]; s3.want = ['cookie']; s3.happy = 0; M.cx = M.seats[0].x; M.pick(2); M.give(3); o.mealWalk = M.done === 1; await w(2500); o.mealArrive = M.done === 2 && Math.abs(M.cx - s3.x) < 4;
    M.done = 5; const s1 = M.seats[1]; s1.happy = 0; s1.want = ['music']; M.cx = s1.x; M.pick(3); M.give(1); await w(100); o.mealWin = G.trip.meal === 1; close();
    openMeal(3); M = openMeal.test; const s2 = M.seats[2]; s2.want = ['drink', 'cookie']; M.cx = s2.x; M.pick(0); M.give(2); o.twoNeedBoth = M.done === 0 && s2.want.length === 1; M.pick(2); M.give(2); o.twoDone = M.done === 1; close();
    // 三個都過第 3 關 → 飛機模型（只送一次）
    G.trip.sec = 3; G.trip.twr = 3; G.trip.meal = 2; o.noPrizeYet = airPrizeCheck() === false && !G.trip.pz;
    G.trip.meal = 3; o.prize = airPrizeCheck() === true && G.inv.plane_model === 1 && G.trip.pz === 1; o.prizeOnce = airPrizeCheck() === false && G.inv.plane_model === 1;
    await w(1800); document.querySelectorAll('#showcase').forEach(x => x.remove());
    // 存檔
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { trip: { st: {}, sec: 7, twr: 2, meal: 'x', pz: 3 } }));
    o.save = n.trip.sec === 3 && n.trip.twr === 2 && n.trip.meal === undefined && n.trip.pz === undefined;
    o.saveKeep = normalizeSave(JSON.parse(JSON.stringify(G))).trip.pz === 1;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
