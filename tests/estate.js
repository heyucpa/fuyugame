// 🏡 小可愛不動產：錢不夠買不了、身上＋銀行一起付、房間加進家裡（est 標記）、不算蓋房間名額、房子長大不受影響、走得到房子門口、進去換到那間房、存錢目標、存檔讀回來還在、壞的 est 清掉
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
    const n0 = G.rooms.length, nr0 = normalRooms(), tier0 = homeTier();
    G.bells = 1000; bankState().sav = 0; o.cantBuy = estateBuy('cabin') === false && G.rooms.length === n0;
    bankState().goal = 'cabin'; openBank(); await w(100); o.goalShown = /存錢目標/.test(document.querySelector('.game-card').textContent) && /還差/.test(document.querySelector('.game-card').textContent); closeGameWindow(); document.getElementById('modal').hidden = true;
    G.bells = 15000; bankState().sav = 10000; const r = estateBuy('cabin');
    o.paid = !!r && r.fromBank === 5000 && G.bells === 0 && bankState().sav === 5000 && !bankState().goal;
    o.roomsAdded = G.rooms.length === n0 + 1 && G.rooms[G.rooms.length - 1].est === 'cabin' && estateOwned('cabin');
    o.notNormal = normalRooms() === nr0 && homeTier() === tier0;
    o.noDouble = estateBuy('cabin') === false;
    // 地圖：走得到房子門口
    islMapCache = null; const m = islMap(0), b = m.blds.find(q => q.id === 'estate_cabin'), home = m.blds.find(q => q.id === 'home');
    const reach = (from, to) => { const seen = new Set([from.join()]), q = [from]; while (q.length) { const [x, y] = q.shift(); if (x === to[0] && y === to[1]) return true; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && islPass(m, nx, ny)) { seen.add(k); q.push([nx, ny]); } }); } return false; };
    o.walkCabin = !!b && reach(home.door, b.door); o.walkRealty = reach(home.door, m.blds.find(q => q.id === 'realty').door);
    o.allLotsReach = ESTATES.every(E => reach(home.door, m.blds.find(q => q.id === 'estate_' + E.id).door));
    estateEnter('cabin'); await w(300); o.entered = curRoom().est === 'cabin' && !G.away;
    // 存檔讀回來
    saveGame(); const back = loadGame(); o.saveKeeps = back && back.rooms.some(q => q.est === 'cabin');
    const nn = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { rooms: JSON.parse(JSON.stringify(G.rooms)).concat([{ name: 'x', w: 6, d: 6, items: [], wallItems: [], est: 'nope' }]), bank: { sav: 1, goal: 'nope' } }));
    o.badEstCleared = nn.rooms[nn.rooms.length - 1].est === undefined && nn.bank.goal === undefined;
    openRealty(); o.realtyOwned = /是你的了/.test(document.getElementById('modalCard').textContent); document.getElementById('modal').hidden = true;
    o.inMenu = AWAY_GAMES.some(g => g[2] === 'realty');
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
