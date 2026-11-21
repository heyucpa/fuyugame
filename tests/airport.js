// ✈️ 機場：地圖上有機場、機長選單；搭飛機（扣機票→登機→飛行→到達）、拍照蓋章送錢、買紀念品；8 個章送小飛機（可以飛）；開飛機小遊戲過關開下一關；存檔檢查
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.trip = undefined; G.vehicles = ['bike']; G.ride = 'bike'; G.gameBonusDay = today();
    o.bld = ISL_BLD.some(x => x.id === 'airport') && !!PLACES.airport && !!HOSTS.airport;
    o.notInShop = !!VEHICLE_BY_ID.plane.prize && !shopCatalog().some(e => e[0] === 'v:plane');
    host.n = HOSTS.airport; const lab = hostMenuEntries().map(e => e[0]).join('|'); o.menu = /搭飛機/.test(lab) && /護照/.test(lab) && /開飛機/.test(lab);
    o.acts = FURNITURE_ACT.checkin_desk === 'air_trip' && FURNITURE_ACT.gate_sign === 'air_fly';
    G.bells = 50; openAirTravel(); openAirTravel.test.go('冰雪國'); o.poor = G.bells === 50 && !!document.querySelector('.tkd-moves'); closeGameWindow();
    G.bells = 1000; openAirTravel(); openAirTravel.test.go('冰雪國'); o.paid = G.bells === 900;
    airBoard.test.next(); airBoard.test.next(); airBoard.test.next(); await w(300); o.flying = !!document.querySelector('.game-canvas');
    airFlight.test.skip(); await w(300); o.arrived = !!airArrive.test;
    const b0 = G.bells; airArrive.test.photo(); o.stamp = G.trip.st['冰雪國'] === 1 && G.bells > b0;
    const b1 = G.bells; airArrive.test.photo(); o.noDouble = G.bells === b1;
    const inv0 = G.inv.souv_snowglobe || 0; airArrive.test.shop(); o.souv = (G.inv.souv_snowglobe || 0) === inv0 + 1 && G.bells === b1 - 150;
    airArrive.test.home(); await w(200);
    // 蓋滿 8 個章送小飛機
    AIR_DEST.forEach(d => { if (d !== '星星國') G.trip.st[d] = 1; }); delete G.trip.st['星星國'];
    openAirTravel(); openAirTravel.test.go('星星國'); airBoard.test.next(); airBoard.test.next(); airBoard.test.next(); await w(100); airFlight.test.skip(); await w(300);
    airArrive.test.photo(); o.plane = G.vehicles.includes('plane'); closeGameWindow(); document.getElementById('modal').hidden = true;
    openAirPassport(); o.passport = document.querySelectorAll('.tkd-moves .tkd-move.on').length === 8; closeGameWindow();
    // 小飛機可以飛
    openIsland(); await w(900); G.ride = 'plane'; islRideBtn(); islToggleFly(); o.flies = !!(isl.fly && isl.fly.on); closeIsland(); await w(200); document.getElementById('modal').hidden = true;
    o.draws = (() => { try { vehicleCanvas('plane', 120, 80); return true; } catch (e) { return e.message; } })() === true;
    // 開飛機小遊戲
    openPlaneGame(1); await w(1300); const T = openPlaneGame.test; o.spawns = T.things.length > 0;
    T.got = 6; T.end(); await w(200); o.lvUp = G.trip.fly === 1;
    closeGameWindow(); document.getElementById('modal').hidden = true;
    openPlaneGame(3); await w(100); openPlaneGame.test.end(); await w(200); o.lockedStays = G.trip.fly === 1; closeGameWindow(); document.getElementById('modal').hidden = true;
    // 存檔
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { trip: { st: { '冰雪國': 1, '亂來國': 1, '沙漠國': 2 }, n: -1, fly: 9, junk: 1 } }));
    o.saveOk = JSON.stringify(n.trip) === JSON.stringify({ st: { '冰雪國': 1 }, fly: 3 }) && normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { trip: 5 })).trip === undefined;
    o.vehSave = normalizeSave(JSON.parse(JSON.stringify(G))).vehicles.includes('plane');
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
