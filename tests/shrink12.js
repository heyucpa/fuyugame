// 📐 已經擴到 14×14 的房間自動改回 12×12：超出去的家具／牆上的東西／桌上的東西都收進「我的東西」、退錢、留一份存檔紀錄、只做一次
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  const url = 'file://' + path.resolve(__dirname, '../house.html');
  await p.goto(url, { timeout: 90000 }); await p.waitForTimeout(2000);
  const before = await p.evaluate(() => {
    document.getElementById('modal').hidden = true; G.guide = 'done';
    const r = G.rooms[0]; r.w = 14; r.d = 14; r.items = r.items.filter(it => it.x < 9 && it.y < 9); let u = 50000;
    r.items.push({ uid: u++, id: 'sofa', x: 12, y: 3, rot: 0 }, { uid: u++, id: 'dining_table', x: 3, y: 12, rot: 0, top: 'flower_vase' }, { uid: u++, id: 'plant_l', x: 11, y: 11, rot: 0 }, { uid: u++, id: 'plant_l', x: 13, y: 13, rot: 0 });
    r.wallItems = (r.wallItems || []).filter(w => w.pos < 9).concat([{ uid: u++, id: 'window', side: 'L', pos: 13 }, { uid: u++, id: 'window', side: 'R', pos: 2 }]);
    const inv = id => G.inv[id] || 0;
    const o = { bells: G.bells, sofa: inv('sofa'), table: inv('dining_table'), vase: inv('flower_vase'), plant: inv('plant_l'), win: inv('window'), n: r.items.length };
    saveGame(); return o;
  });
  await p.reload(); await p.waitForTimeout(3000);
  const o = await p.evaluate(b0 => {
    const r = G.rooms[0], inv = id => G.inv[id] || 0, o = {};
    o.size12 = r.w === 12 && r.d === 12;
    o.sofaBack = inv('sofa') === b0.sofa + 1; o.tableBack = inv('dining_table') === b0.table + 1; o.vaseBack = inv('flower_vase') === b0.vase + 1;
    o.plantOneBack = inv('plant_l') === b0.plant + 1 && r.items.some(it => it.id === 'plant_l' && it.x === 11 && it.y === 11);   // 11,11 放得下的留著
    o.windowBack = inv('window') === b0.win + 1 && r.wallItems.some(w => w.id === 'window' && w.pos === 2);
    o.allInside = r.items.every(it => { const fp = footprint(FURN_BY_ID[it.id], it.rot || 0); return it.x + fp.w <= 12 && it.y + fp.d <= 12; });
    o.count = r.items.length === b0.n - 3;
    o.refund = G.bells === b0.bells + EXPAND_COST[14];
    o.snapKept = readSnaps().some(s => /"w":14/.test(s.raw || s.data || JSON.stringify(s)));
    o.savedNow = /"w":12/.test(localStorage.getItem(SAVE_KEY)) && !/"w":14/.test(localStorage.getItem(SAVE_KEY));
    o.onceOnly = shrinkBigRooms() === null;
    o.noFurther = nextSize(r) === null;
    return o;
  }, before);
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 2)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
