// 🔧 改車店：地圖上有、技師選單；改車（試看看不用錢、買過免費、錢不夠不能存、還原、轉過來）；畫得出所有車的所有樣子；洗車（三個步驟、髒的才給錢、洗完 dirt=0）；開車會變髒；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; };
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.carLook = {}; G.carOwn = []; G.vehicles = ['bike', 'sports']; G.ride = 'sports'; G.gameBonusDay = today();
    o.bld = ISL_BLD.some(x => x.id === 'garage') && !!PLACES.garage && !!HOSTS.garage;
    host.n = HOSTS.garage; const lab = hostMenuEntries().map(e => e[0]).join('|'); o.menu = /改裝/.test(lab) && /洗車/.test(lab);
    o.acts = FURNITURE_ACT.car_lift === 'car_mod' && FURNITURE_ACT.wash_bay === 'car_wash';
    const v0 = G.vehicles; G.vehicles = []; let toasted = ''; const rt = toast; toast = m => { toasted = m; }; openCarShop(); o.noCar = /還沒有交通工具/.test(toasted); toast = rt; G.vehicles = v0;
    // 畫得出每一台車、每一種樣子
    o.draws = (() => { try { const c = document.createElement('canvas').getContext('2d'); VEHICLES.forEach(v => { CAR_COLORS.forEach(cc => CAR_STICKERS.forEach((st, i) => drawVehicle(c, v.id, 2, 1, true, null, { c: cc[0], st: st[0], wh: CAR_WHEELS[i % CAR_WHEELS.length][0], gl: CAR_GLOWS[i % CAR_GLOWS.length][0], dirt: (i * 15) % 101 }))); }); return true; } catch (e) { return e.message; } })() === true;
    // 改車
    G.bells = 1000; openCarShop(); let T = openCarShop.test; o.picksRide = /跑車|sports/i.test(document.querySelector('.game-card h2, .game-card .game-title, .game-card').textContent);
    T.set('c', 'pink'); T.set('st', 'heart'); o.cost = T.cost() === 180 && G.bells === 1000;   // 試看看不扣錢
    T.save(); o.saved = G.bells === 820 && G.carLook.sports.c === 'pink' && G.carLook.sports.st === 'heart' && G.carOwn.includes('c:pink');
    T.set('c', 'blue'); T.undo(); o.undo = T.draft.c === 'pink';
    T.set('c', 'blue'); T.save(); T.set('c', 'pink'); o.freeAgain = T.cost() === 0; T.save(); o.freeSaved = G.bells === 720 && G.carLook.sports.c === 'pink';
    G.bells = 50; T.set('wh', 'gold'); T.save(); o.poor = G.bells === 50 && G.carLook.sports.wh !== 'gold';
    T.turn(); await w(500); o.turn = T.face < 0; close();
    // 開車變髒
    G.carLook.sports.dirt = 0; openIsland(); await w(900); islRideBtn(); carDirtTick.p = null; carDirtTick(); isl.x += 2; carDirtTick(); o.dirty = Math.abs(G.carLook.sports.dirt - .8) < .01; G.carLook.sports.dirt = 59.9; isl.x += 1; carDirtTick(); o.dirtCap = G.carLook.sports.dirt > 60; closeIsland(); await w(200); document.getElementById('modal').hidden = true;
    // 洗車（很髒 → 給錢）
    G.carLook.sports.dirt = 80; openCarWash('sports'); let Wt = openCarWash.test; o.washCells = Wt.cells.length > 10 && Wt.cells.some(c => c.mud);
    const b0 = G.bells; Wt.all(); await w(100); o.washed = Wt.done && G.carLook.sports.dirt === 0 && G.bells > b0; close();
    openCarWash('sports'); Wt = openCarWash.test; const b1 = G.bells; Wt.all(); await w(100); o.cleanNoPay = Wt.done && G.bells === b1; close();
    // 存檔
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { carLook: { sports: { c: 'pink', st: 'hack', wh: 'gold', gl: 'rainbow', dirt: 500 }, ufo: { c: 'red' } }, carOwn: ['c:pink', 'bad', 3, 'gl:rainbow', 'c:pink'] }));
    o.save = JSON.stringify(n.carLook) === JSON.stringify({ sports: { c: 'pink', wh: 'gold', gl: 'rainbow' } }) && JSON.stringify(n.carOwn) === JSON.stringify(['c:pink', 'gl:rainbow']);
    o.saveBad = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { carLook: 'x', carOwn: 'y' })).carLook === undefined;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
