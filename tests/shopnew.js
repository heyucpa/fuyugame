// 🆕 商店「新東西」區：最近更新才有、還沒買的集中在上面；買了就不見；14 天後就不算新；舊存檔第一次只有最近加的算新的
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true;
    // 舊存檔第一次：只有機器人算新的
    delete G.shopFirst; G.vehicles = (G.vehicles || []).filter(v => v !== 'robot');
    let nw = shopNewItems(); o.seedOnlyRobot = nw.n === 1 && nw.veh[0].id === 'robot';
    // 模擬更新多了一件家具、一種壁紙
    const fd = FURNITURE.find(d => !d.gift && !d.season && !G.seen[d.id] && d.price < 5000), wp = WALLPAPERS.find(w => !w.season && !G.walls.includes(w.id));
    delete G.shopFirst['f:' + fd.id]; if (wp) delete G.shopFirst['w:' + wp.id];
    nw = shopNewItems(); o.updateNew = nw.furn.some(d => d.id === fd.id) && (!wp || nw.wall.some(w => w.id === wp.id));
    shopKind = 'all'; shopTheme = 'all'; openTab('shop'); await wait(100);
    o.tabBtn = [...document.querySelectorAll('#tabBody .filter.kinds button')].some(x => /新東西/.test(x.textContent));
    o.section = !!document.querySelector('#tabBody .shop-new') && document.querySelector('#tabBody .shop-new').textContent.includes(fd.name);
    shopKind = 'new'; renderTab(); await wait(50);
    o.onlyNew = document.querySelectorAll('#tabBody .shop-new').length === 1 && !document.querySelector('#tabBody .filter.themes');
    // 買了就不見
    G.bells = 1e6; [...document.querySelectorAll('#tabBody .shop-new .card')].find(c => c.textContent.includes(fd.name)).click(); await wait(100);
    o.boughtGone = !shopNewItems().furn.some(d => d.id === fd.id) && G.inv[fd.id] >= 1;
    // 14 天後不算新
    Object.keys(G.shopFirst).forEach(k => { if (G.shopFirst[k] > 0) G.shopFirst[k] -= 15; });
    o.expired = shopNewItems().n === 0;
    shopKind = 'new'; renderTab(); await wait(50); o.fallback = shopKind === 'all';
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    o.saved = raw.shopFirst && Object.keys(raw.shopFirst).length > 50;
    const n = normalizeSave(Object.assign({}, raw, { shopFirst: { 'f:sofa': 3, 'bad key!': 1, 'w:x': -2, 'v:robot': 'x' } })).shopFirst;
    o.norm = n['f:sofa'] === 3 && Object.keys(n).length === 1 && normalizeSave(Object.assign({}, raw, { shopFirst: [1] })).shopFirst == null;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
