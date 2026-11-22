// 🛳️ 郵輪：船票、開船動畫、三個港口小遊戲（水果數對才算、企鵝要同色冰屋、寶藏箭頭方向）、蓋章送紀念品、三個都去過送郵輪模型、船上四間、地圖走得到、存檔檢查
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
    G.cruise = {}; ['port_pineapple', 'port_igloo', 'port_chest', 'cruise_model'].forEach(id => { delete G.inv[id]; });
    const closeScene = async () => { for (let k = 0; k < 6 && document.getElementById('vevScene'); k++) { vevScene.test.go(); await w(60); } };
    G.bells = 100; openCruise(); [...document.querySelectorAll('#modalCard button')].find(b => /熱帶水果島/.test(b.textContent)).click(); await w(100); o.ticketNeeded = !document.getElementById('vevScene') && G.bells === 100; document.getElementById('modal').hidden = true;
    G.bells = 5000; openCruise(); [...document.querySelectorAll('#modalCard button')].find(b => /熱帶水果島/.test(b.textContent)).click(); await w(100); o.ticketPaid = G.bells === 4800 && !!document.getElementById('vevScene');
    await closeScene(); await w(200); const F = openPortFruit.test;
    F.pick('🍉'); F.give(); o.fruitWrongStays = F.n === 0;
    for (let k = 0; k < 5; k++) { const wv = F.want; await w(10); /* 清空籃子 */ document.querySelector('.game-card .big.alt') && null; for (let j = 0; j < 9; j++) [...document.querySelectorAll('.game-card button')].find(b => /拿出來/.test(b.textContent)).click(); for (let j = 0; j < wv.k; j++) F.pick(wv.f[0]); F.give(); }
    await w(200); o.fruitDone = cruiseState().st.fruit === 1 && G.inv.port_pineapple === 1; closeGameWindow();
    openPortPenguin(); await w(100); const P = openPortPenguin.test; const p0 = P.pens[0], wrongIg = P.igloos.find(i => i.col !== p0.col), rightIg = P.igloos.find(i => i.col === p0.col);
    P.tap(p0.x, p0.y - 10); P.tap(wrongIg.x, wrongIg.y); o.penWrong = !p0.home; P.tap(p0.x, p0.y - 10); P.tap(rightIg.x, rightIg.y); o.penRight = p0.home;
    P.pens.forEach(p => { if (!p.home) { P.tap(p.x, p.y - 10); const ig = P.igloos.find(i => i.col === p.col); P.tap(ig.x, ig.y); } }); await w(900); o.penDone = cruiseState().st.ice === 1; closeGameWindow();
    openPortTreasure(); await w(100); const T = openPortTreasure.test; const ox = T.tr.x === 0 ? 4 : 0; T.dig(ox, T.tr.y); o.notFoundYet = !T.found; T.dig(T.tr.x, T.tr.y); await w(900);
    o.allStamps = cruiseState().st.pirate === 1 && G.inv.cruise_model === 1; closeGameWindow();
    o.shipRooms = PLACES.ship.rooms.length === 4;
    islMapCache = null; const m = islMap(0), home = m.blds.find(q => q.id === 'home'), cb = m.blds.find(q => q.id === 'cruise');
    const reach = (from, to) => { const seen = new Set([from.join()]), q = [from]; while (q.length) { const [x, y] = q.shift(); if (x === to[0] && y === to[1]) return true; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && islPass(m, nx, ny)) { seen.add(k); q.push([nx, ny]); } }); } return false; };
    o.walk = !!cb && reach(home.door, cb.door);
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { cruise: { st: { fruit: 1, nope: 1, ice: 2 }, x: 1 } })); o.saveClean = JSON.stringify(n.cruise) === '{"st":{"fruit":1}}';
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
