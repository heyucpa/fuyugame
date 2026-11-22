// 🛍️ 百貨公司：四層樓、限定家具不在一般商店、買限定家具、週末 8 折、扭蛋扣錢給東西（稀有優先給還沒有的）、地圖上走得到、選單裡有
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
    o.floors = PLACES.dept.rooms.length === 4;
    o.notInShop = !shopCatalog().some(([k]) => /dept_|gacha_/.test(k));
    const base = FURN_BY_ID.dept_sofa.deptPrice; o.salePrice = deptPrice('dept_sofa') === (deptSale() ? Math.round(base * .8) : base) && gachaPrice() === (deptSale() ? 240 : 300);
    G.bells = 50000; const inv0 = G.inv.dept_sofa || 0; openDeptStore(); await w(100);
    const card = [...document.querySelectorAll('#modalCard .card')].find(c => /豪華絨布沙發/.test(c.textContent)); card.click(); await w(150);
    o.bought = (G.inv.dept_sofa || 0) === inv0 + 1 && G.bells === 50000 - deptPrice('dept_sofa'); document.getElementById('modal').hidden = true;
    const b1 = G.bells, n1 = Object.values(G.inv).reduce((a, n) => a + (n || 0), 0); const r = gachaRoll();
    o.gacha = !!r && G.bells === b1 - gachaPrice() && Object.values(G.inv).reduce((a, n) => a + (n || 0), 0) === n1 + 1 && !!FURN_BY_ID[r.id];
    GACHA_RARE.forEach(id => { delete G.inv[id]; }); G.inv.gacha_robot = 1; G.inv.gacha_unicorn = 1; const save = Math.random; Math.random = () => .01; const r2 = gachaRoll(); Math.random = save; o.rareFresh = r2.rare && r2.id === 'gacha_rocket';
    G.bells = 10; o.noMoney = gachaRoll() === null;
    islMapCache = null; const m = islMap(0), home = m.blds.find(q => q.id === 'home'), d = m.blds.find(q => q.id === 'dept');
    const reach = (from, to) => { const seen = new Set([from.join()]), q = [from]; while (q.length) { const [x, y] = q.shift(); if (x === to[0] && y === to[1]) return true; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && islPass(m, nx, ny)) { seen.add(k); q.push([nx, ny]); } }); } return false; };
    o.walk = !!d && reach(home.door, d.door);
    o.menu = AWAY_GAMES.some(g => g[2] === 'dept') && placeKind('dept') === 'shop';
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
