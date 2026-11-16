// 🪑 每樣家具都有動作：地上家具（除了桌子）、牆上的東西、桌上的小東西都可以用；走過去做完不出錯
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
    const shop = FURNITURE.filter(d => !d.gift && !d.season);
    const TABLES = /table|^desk$/;
    o.floorMissing = shop.filter(d => d.layer !== 'wall' && !canUse({ id: d.id }) && !/table/.test(d.id)).map(d => d.name);
    o.wallMissing = shop.filter(d => d.layer === 'wall' && !wallActOf(d.id)).map(d => d.name);
    o.allFloor = o.floorMissing.length === 0; o.allWall = o.wallMissing.length === 0;
    o.actsValid = Object.values(FURNITURE_ACT).concat(Object.values(WALL_ACT), Object.values(TOP_ACT)).every(k => ACTIVITIES[k]);
    // 真的做一次：地毯滾滾、牆上看畫、桌上小蛋糕
    const room = curRoom(); room.items = []; room.wallItems = []; room.w = room.d = 8;
    room.items.push({ uid: 9901, id: 'rainbow_rug', x: 4, y: 4, rot: 0 }, { uid: 9902, id: 'wood_table', x: 1, y: 5, rot: 0, top: 'small_cake' });
    room.wallItems.push({ uid: 9903, id: 'art_mountain', side: 'R', pos: 3 }, { uid: 9904, id: 'calendar', side: 'L', pos: 2 });
    commit();
    const run = async (fn, key) => { fufu.act = null; fufu.task = null; fn(); for (let k = 0; k < 200 && !(fufu.act && fufu.act.key === key); k++) await wait(30); return !!(fufu.act && fufu.act.key === key); };
    o.rug = await run(() => fufuGoUse(room.items[0], false, 'roll'), 'roll');
    o.wallArt = await run(() => fufuGoWall(room.wallItems[0]), 'artlook');
    o.wallBack = fufu.back === true;
    o.calendar = await run(() => fufuGoWall(room.wallItems[1]), 'date');
    o.topMenu = (() => { const r0 = []; const orig = window.openMenu; let got = null; window.openMenu = (en) => { got = en; }; showItemMenu(room.items[1], { clientX: 10, clientY: 10 }); window.openMenu = orig; return !!got && got.some(e => /吃一口/.test(e[0])); })();
    o.cake = await run(() => fufuGoUse(room.items[1], false, 'treat'), 'treat');
    await wait(300);
    return o;
  });
  const ok = Object.entries(o).every(([k, v]) => v === true || Array.isArray(v)) && o.allFloor && o.allWall && !errs.length;
  console.log(JSON.stringify(o), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
